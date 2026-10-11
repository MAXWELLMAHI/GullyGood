-- ============================================================================
-- FCFS (First-Come, First-Served) Atomic Donation Claiming Migration
-- Uber-style Race Condition Prevention, Optimistic/Pessimistic Locking & TTL Expiry
-- ============================================================================

-- 1. Ensure Performance & Concurrency Indexes
CREATE INDEX IF NOT EXISTS idx_donation_listings_id_status 
  ON public.donation_listings (id, status);

CREATE INDEX IF NOT EXISTS idx_donation_listings_status_expires 
  ON public.donation_listings (status, expires_at);

CREATE INDEX IF NOT EXISTS idx_claims_listing_state 
  ON public.claims (listing_id, state);

-- Ensure claim table has expires_at for grace period / timeout TTL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'claims' 
      AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.claims ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_claims_expires_at 
  ON public.claims (expires_at) 
  WHERE state = 'locked';

-- Unique constraint ensuring only ONE active lock can exist per donation
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_single_active_lock 
  ON public.claims (listing_id) 
  WHERE state = 'locked';


-- 2. Atomic FCFS Claim Stored Procedure
-- Uses PostgreSQL SELECT ... FOR UPDATE row-level locking to guarantee zero race conditions.
CREATE OR REPLACE FUNCTION public.claim_donation_fcfs(
  p_listing_id uuid,
  p_ngo_id uuid,
  p_user_id uuid,
  p_timeout_minutes integer DEFAULT 15,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.donation_listings%ROWTYPE;
  v_existing_claim public.claims%ROWTYPE;
  v_new_claim_id uuid;
  v_expires_at timestamptz;
  v_now timestamptz := timezone('utc', now());
BEGIN
  -- Compute TTL expiration timestamp
  v_expires_at := v_now + (COALESCE(p_timeout_minutes, 15) || ' minutes')::interval;

  -- 1. Check for expired locks and auto-release before locking
  UPDATE public.claims
  SET state = 'timed_out',
      timed_out_at = v_now,
      updated_at = v_now
  WHERE listing_id = p_listing_id
    AND state = 'locked'
    AND expires_at IS NOT NULL
    AND expires_at < v_now;

  IF FOUND THEN
    UPDATE public.donation_listings
    SET status = 'live',
        updated_at = v_now
    WHERE id = p_listing_id
      AND status = 'locked';
  END IF;

  -- 2. Acquire pessimistic row-level lock on the donation listing
  SELECT *
  INTO v_listing
  FROM public.donation_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  -- Not found check
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'Donation listing does not exist.'
    );
  END IF;

  -- 3. Idempotency Check: Did this exact NGO already claim this donation?
  SELECT *
  INTO v_existing_claim
  FROM public.claims
  WHERE listing_id = p_listing_id
    AND ngo_id = p_ngo_id
    AND state = 'locked';

  IF FOUND THEN
    -- Return HTTP 200 equivalent idempotent success
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'claim_id', v_existing_claim.id,
      'donation_id', p_listing_id,
      'ngo_id', p_ngo_id,
      'status', 'CLAIMED',
      'claimed_at', v_existing_claim.locked_at,
      'expires_at', v_existing_claim.expires_at,
      'message', 'Donation already claimed by your organization.'
    );
  END IF;

  -- 4. Race Condition Check: Is the listing still available?
  IF v_listing.status <> 'live' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'CONFLICT',
      'message', 'This donation has already been claimed by another NGO.'
    );
  END IF;

  -- 5. ATOMIC EXECUTION: Transition status to 'locked' and insert claim
  UPDATE public.donation_listings
  SET status = 'locked',
      updated_at = v_now
  WHERE id = p_listing_id
    AND status = 'live';

  IF NOT FOUND THEN
    -- Another transaction grabbed it in the nanosecond between
    RETURN jsonb_build_object(
      'success', false,
      'code', 'CONFLICT',
      'message', 'This donation has already been claimed by another NGO.'
    );
  END IF;

  -- Create claim record
  INSERT INTO public.claims (
    listing_id,
    ngo_id,
    locked_by_user_id,
    state,
    locked_at,
    expires_at,
    created_at,
    updated_at
  )
  VALUES (
    p_listing_id,
    p_ngo_id,
    p_user_id,
    'locked',
    v_now,
    v_expires_at,
    v_now,
    v_now
  )
  RETURNING id INTO v_new_claim_id;

  -- Auto-schedule pickup task
  INSERT INTO public.pickup_tasks (
    listing_id,
    claim_id,
    scheduled_start,
    scheduled_end,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_listing_id,
    v_new_claim_id,
    v_listing.pickup_window_start,
    v_listing.pickup_window_end,
    'scheduled',
    v_now,
    v_now
  )
  ON CONFLICT (claim_id) DO NOTHING;

  -- Audit trail
  PERFORM public.log_audit_event(
    'donation_fcfs_claimed',
    'donation_listing',
    p_listing_id,
    jsonb_build_object(
      'claim_id', v_new_claim_id,
      'ngo_id', p_ngo_id,
      'user_id', p_user_id,
      'expires_at', v_expires_at,
      'idempotency_key', p_idempotency_key
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'claim_id', v_new_claim_id,
    'donation_id', p_listing_id,
    'ngo_id', p_ngo_id,
    'status', 'CLAIMED',
    'claimed_at', v_now,
    'expires_at', v_expires_at,
    'donation', jsonb_build_object(
      'id', v_listing.id,
      'category', v_listing.category,
      'quantity', v_listing.quantity,
      'locality', v_listing.locality,
      'city', v_listing.city,
      'pickup_window_start', v_listing.pickup_window_start,
      'pickup_window_end', v_listing.pickup_window_end
    )
  );
END;
$$;


-- 3. Automatic TTL Expiry Function (Sweep background worker / cron)
CREATE OR REPLACE FUNCTION public.sweep_expired_claims()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := timezone('utc', now());
  v_released_count integer := 0;
  v_expired_rec RECORD;
BEGIN
  FOR v_expired_rec IN
    SELECT id, listing_id, ngo_id
    FROM public.claims
    WHERE state = 'locked'
      AND expires_at IS NOT NULL
      AND expires_at < v_now
    FOR UPDATE
  LOOP
    -- Mark claim timed out
    UPDATE public.claims
    SET state = 'timed_out',
        timed_out_at = v_now,
        updated_at = v_now
    WHERE id = v_expired_rec.id;

    -- Reset listing to live
    UPDATE public.donation_listings
    SET status = 'live',
        updated_at = v_now
    WHERE id = v_expired_rec.listing_id
      AND status = 'locked';

    -- Log audit
    PERFORM public.log_audit_event(
      'claim_ttl_expired_released',
      'donation_listing',
      v_expired_rec.listing_id,
      jsonb_build_object('claim_id', v_expired_rec.id, 'ngo_id', v_expired_rec.ngo_id)
    );

    v_released_count := v_released_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'released_count', v_released_count,
    'timestamp', v_now
  );
END;
$$;
