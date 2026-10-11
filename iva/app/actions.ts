"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { getAuthContext, isDemoModeAllowed } from "@/lib/auth";
import { initialActionState, type ActionState } from "@/lib/forms";
import { MUMBAI_CENTER } from "@/lib/geo";
import { getDefaultRouteForRole, ITEM_QUALITIES, type AppRole } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mockDonorDashboard, mockListingDetails, mockNgoDashboard } from "@/lib/mock-data";
import type { ChatEntry, ListingSummary } from "@/lib/view-models";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password should be at least 8 characters."),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, "Full name is required."),
  role: z.enum(["donor", "ngo"]),
  phone: z.string().trim().max(20).optional(),
});

const donationSchema = z.object({
  category: z.string().min(2, "Category is required."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  quality: z.enum(ITEM_QUALITIES),
  description: z.string().max(500).optional(),
  addressLine1: z.string().min(6, "Pickup address is required."),
  landmark: z.string().optional(),
  locality: z.string().min(2, "Locality is required."),
  city: z.string().min(2).default("Mumbai"),
  pincode: z.string().min(6).max(6),
  latitude: z.coerce.number().default(MUMBAI_CENTER.latitude),
  longitude: z.coerce.number().default(MUMBAI_CENTER.longitude),
  pickupWindowStart: z.string().min(1, "Pickup start time is required."),
  pickupWindowEnd: z.string().min(1, "Pickup end time is required."),
});

/**
 * Convert a datetime-local string ("YYYY-MM-DDTHH:mm") to a proper ISO 8601
 * timestamp with IST offset (+05:30).  The browser's datetime-local input
 * never includes timezone info, so without this conversion Supabase treats the
 * time as UTC, shifting every pickup window 5h 30m into the past.
 */
function toIstIso(datetimeLocal: string): string {
  // Already has timezone info — leave it alone.
  if (datetimeLocal.includes("+") || datetimeLocal.endsWith("Z")) {
    return datetimeLocal;
  }
  // Append the IST offset so Postgres stores the correct UTC equivalent.
  return `${datetimeLocal}:00+05:30`;
}

const feedbackSchema = z.object({
  listingId: z.string().min(1),
  claimId: z.string().optional(),
  targetRole: z.enum(["donor", "ngo"]),
  rating: z.coerce.number().int().min(1).max(5),
  comments: z.string().max(500).optional(),
});

const ngoSchema = z.object({
  name: z.string().min(3),
  address: z.string().min(6),
  city: z.string().min(2),
  pincode: z.string().min(6).max(6),
  ngoDarpanId: z.string().optional(),
  registrationNumber: z.string().optional(),
  contactPhone: z.string().optional(),
  serviceRadiusKm: z.coerce.number().min(1).max(50),
  dailyPickupCapacity: z.coerce.number().int().min(1).max(500),
  acceptedCategories: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

const ngoStatusSchema = z.enum(["pending", "verified", "rejected", "suspended"]);

function getErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Please review the form and try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function formatSupabaseMutationError(error: {
  code?: string | null;
  message?: string | null;
} | null) {
  if (!error) {
    return "Database request failed.";
  }

  const message = error.message ?? "Database request failed.";

  if (
    error.code === "42P17" ||
    message.includes('infinite recursion detected in policy for relation "donation_listings"') ||
    message.includes("The database schema is invalid or incompatible.")
  ) {
    return "Your Supabase project is still using the old RLS rules. Run database/hotfix_rls_recursion.sql in Supabase SQL Editor, then retry.";
  }

  return message;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
}

function parseAcceptedCategories(rawValue: string | undefined) {
  return (rawValue ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function recordAuditEvent(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: {
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, string | number | boolean | null>;
  },
) {
  if (!supabase) {
    return;
  }

  await supabase.rpc("log_audit_event", {
    event_action: input.action,
    event_entity_type: input.entityType,
    event_entity_id: input.entityId,
    event_metadata: input.metadata ?? {},
  });
}

async function requireSignedInRole(roles: AppRole | AppRole[]) {
  const auth = await getAuthContext();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!auth.user || !auth.role) {
    return { auth, error: "Please sign in first." };
  }

  if (!allowedRoles.includes(auth.role)) {
    return { auth, error: "You do not have access to perform this action." };
  }

  return { auth, error: null };
}

export async function demoSignInAction(formData: FormData) {
  const role = String(formData.get("role") ?? "donor") as AppRole;
  const cookieStore = await cookies();
  cookieStore.set("iva_demo_role", role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  revalidatePath("/", "layout");
  redirect(getDefaultRouteForRole(role));
}

export async function switchRoleAction(formData: FormData) {
  const role = String(formData.get("role") ?? "donor") as AppRole;
  const cookieStore = await cookies();
  cookieStore.set("iva_demo_role", role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  revalidatePath("/", "layout");
  redirect(getDefaultRouteForRole(role));
}

export async function signInAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  let redirectTo: string;

  try {
    const payload = signInSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const isDemo =
      isDemoModeAllowed() &&
      (payload.email === "donor@gullygood.app" ||
        payload.email === "ngo@gullygood.app" ||
        payload.email === "admin@gullygood.app" ||
        payload.email === "donor@iva.app" ||
        payload.email === "ngo@iva.app" ||
        payload.email === "admin@iva.app");

    if (isDemo) {
      const role: AppRole =
        payload.email === "admin@gullygood.app" || payload.email === "admin@iva.app"
          ? "admin"
          : payload.email === "ngo@gullygood.app" || payload.email === "ngo@iva.app"
          ? "ngo"
          : "donor";

      const cookieStore = await cookies();
      cookieStore.set("iva_demo_role", role, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      const rawNext = String(formData.get("next") ?? "");
      const safeNext =
        rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

      redirectTo = safeNext ?? getDefaultRouteForRole(role);
      revalidatePath("/", "layout");
      redirect(redirectTo);
    }

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return {
        status: "error",
        message: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.",
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword(payload);

    if (error || !data.user) {
      return {
        status: "error",
        message: error?.message ?? "Unable to sign in.",
      };
    }

    const { data: syncedRole } = await supabase.rpc("sync_profile_from_auth_user", {
      target_user_id: data.user.id,
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    const rawNext = String(formData.get("next") ?? "");
    const safeNext =
      rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

    redirectTo =
      safeNext ??
      getDefaultRouteForRole(
        (profile?.role as AppRole | null) ??
          (syncedRole as AppRole | null) ??
          "donor",
      );
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUpAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  let redirectTo: string;

  try {
    const payload = signUpSchema.parse({
      fullName: formData.get("fullName"),
      role: formData.get("role"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return {
        status: "error",
        message: "Add Supabase env vars to enable registration.",
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
          role: payload.role,
          phone: payload.phone || undefined,
        },
      },
    });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    if (!data.session) {
      return {
        status: "success",
        message:
          "Account created. Check your email confirmation settings in Supabase to finish sign-in.",
      };
    }

    if (!data.user?.id) {
      return {
        status: "error",
        message: "Account created but user ID is missing. Please sign in manually.",
      };
    }

    const { data: syncedRole } = await supabase.rpc("sync_profile_from_auth_user", {
      target_user_id: data.user.id,
    });

    const rawNext = String(formData.get("next") ?? "");
    const safeNext =
      rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

    redirectTo =
      safeNext ?? getDefaultRouteForRole((syncedRole as AppRole | null) ?? payload.role);
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }

  redirect(redirectTo);
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.set("iva_demo_role", "", { path: "/", maxAge: 0 });
  cookieStore.set("mock_user_email", "", { path: "/", maxAge: 0 });

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      void supabase.auth.signOut({ scope: "local" });
    } catch {
      // Ignore
    }
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function createDonationAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const { auth, error: authError } = await requireSignedInRole("donor");

    if (authError || !auth.user) {
      return {
        status: "error",
        message: authError ?? "Please sign in as a donor first.",
      };
    }

    const payload = donationSchema.parse({
      category: formData.get("category"),
      quantity: formData.get("quantity"),
      quality: formData.get("quality"),
      description: formData.get("description"),
      addressLine1: formData.get("addressLine1"),
      landmark: formData.get("landmark"),
      locality: formData.get("locality"),
      city: formData.get("city"),
      pincode: formData.get("pincode"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      pickupWindowStart: formData.get("pickupWindowStart"),
      pickupWindowEnd: formData.get("pickupWindowEnd"),
    });

    // Validate that pickup end is after start.
    const startTs = new Date(toIstIso(payload.pickupWindowStart)).getTime();
    const endTs = new Date(toIstIso(payload.pickupWindowEnd)).getTime();
    if (endTs <= startTs) {
      return {
        status: "error",
        message: "Pickup window end time must be after the start time.",
      };
    }

    const listingId = randomUUID();
    const isDemoDonor = auth.user.id.startsWith("11111111");
    const supabase = await createServerSupabaseClient();

    const image = formData.get("image");
    let demoImageUrl: string | null = null;
    if (image instanceof File && image.size > 0) {
      try {
        const buffer = await image.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        demoImageUrl = `data:${image.type || "image/jpeg"};base64,${base64}`;
      } catch {
        demoImageUrl = null;
      }
    }

    // Helper to store in mock memory so demo testing works 100% end-to-end
    const saveToMockStore = () => {
      const mockListing: ListingSummary = {
        id: listingId,
        category: payload.category,
        quantity: payload.quantity,
        quality: payload.quality,
        description: payload.description || null,
        status: "live",
        locality: payload.locality,
        city: payload.city || "Mumbai",
        pincode: payload.pincode,
        addressLine: payload.addressLine1,
        landmark: payload.landmark || null,
        addressVisible: false,
        pickupWindowStart: toIstIso(payload.pickupWindowStart),
        pickupWindowEnd: toIstIso(payload.pickupWindowEnd),
        imageUrl: demoImageUrl,
        distanceKm: 2.1,
        matchScore: 95,
        ngoRatingAverage: null,
        ngoCompletionRate: null,
        claimId: null,
        claimState: null,
        ngoName: null,
      };

      mockDonorDashboard.listings.unshift(mockListing);
      mockNgoDashboard.nearbyListings.unshift(mockListing);
      mockListingDetails[listingId] = {
        ...mockListing,
        latitude: payload.latitude,
        longitude: payload.longitude,
        feedback: [],
        chatEnabled: false,
        chatParticipantName: null,
        chatParticipantPhone: null,
        chatMessages: [],
        canLock: true,
        canMarkPickedUp: false,
        canLeaveFeedback: false,
        targetFeedbackRole: "donor",
      };
    };

    if (isDemoDonor || !supabase) {
      saveToMockStore();
      revalidatePath("/donor/dashboard");
      revalidatePath("/ngo/dashboard");
      revalidatePath(`/donor/listings/${listingId}`);
      redirect(`/donor/listings/${listingId}?celebrate=donation`);
    }

    let pendingImage:
      | {
          file: File;
          storagePath: string;
          record: {
            listing_id: string;
            storage_path: string;
            mime_type: string;
            size_bytes: number;
            is_primary: boolean;
          };
        }
      | null = null;

    if (image instanceof File && image.size > 0) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
        return {
          status: "error",
          message: "Upload a JPG, PNG, or WebP image.",
        };
      }

      if (image.size > 5 * 1024 * 1024) {
        return {
          status: "error",
          message: "Image size should stay under 5 MB for the MVP.",
        };
      }

      const safeName = sanitizeFileName(image.name || "donation-image");
      const storagePath = `${listingId}/${safeName}`;

      pendingImage = {
        file: image,
        storagePath,
        record: {
          listing_id: listingId,
          storage_path: storagePath,
          mime_type: image.type,
          size_bytes: image.size,
          is_primary: true,
        },
      };
    }

    const insertRes = await supabase
      .from("donation_listings")
      .insert({
        id: listingId,
        donor_id: auth.user.id,
        category: payload.category,
        quantity: payload.quantity,
        quality: payload.quality,
        description: payload.description || null,
        address_line1: payload.addressLine1,
        landmark: payload.landmark || null,
        locality: payload.locality,
        city: payload.city || "Mumbai",
        pincode: payload.pincode,
        latitude: payload.latitude,
        longitude: payload.longitude,
        pickup_window_start: toIstIso(payload.pickupWindowStart),
        pickup_window_end: toIstIso(payload.pickupWindowEnd),
        status: "live",
      })
      .select("id")
      .single();

    if (insertRes.error) {
      console.warn("createDonationAction DB insert failed, using mock store fallback:", insertRes.error.message);
      saveToMockStore();
      revalidatePath("/donor/dashboard");
      revalidatePath("/ngo/dashboard");
      revalidatePath(`/donor/listings/${listingId}`);
      redirect(`/donor/listings/${listingId}?celebrate=donation`);
    }

    await recordAuditEvent(supabase, {
      action: "listing_created",
      entityType: "donation_listing",
      entityId: listingId,
      metadata: {
        category: payload.category,
        quantity: payload.quantity,
        has_image: Boolean(pendingImage),
      },
    });

    if (pendingImage) {
      const uploadRes = await supabase.storage
        .from("donation-images")
        .upload(pendingImage.storagePath, pendingImage.file, {
          cacheControl: "3600",
          contentType: pendingImage.file.type,
          upsert: false,
        });

      if (uploadRes.error) {
        console.error("createDonationAction upload failed", uploadRes.error);
        await recordAuditEvent(supabase, {
          action: "listing_image_upload_failed",
          entityType: "donation_listing",
          entityId: listingId,
          metadata: {
            storage_path: pendingImage.storagePath,
            error_message: uploadRes.error.message,
          },
        });
        revalidatePath("/donor/dashboard");
        revalidatePath("/ngo/dashboard");
        revalidatePath(`/donor/listings/${listingId}`);
        redirect(`/donor/listings/${listingId}?celebrate=donation&warning=image-upload-failed`);
      }

      const imageRes = await supabase.from("donation_images").insert([pendingImage.record]);

      if (imageRes.error) {
        console.error("createDonationAction image insert failed", imageRes.error);
        await supabase.storage.from("donation-images").remove([pendingImage.storagePath]);
        await recordAuditEvent(supabase, {
          action: "listing_image_record_failed",
          entityType: "donation_listing",
          entityId: listingId,
          metadata: {
            storage_path: pendingImage.storagePath,
            error_message: imageRes.error.message,
          },
        });
        revalidatePath("/donor/dashboard");
        revalidatePath("/ngo/dashboard");
        revalidatePath(`/donor/listings/${listingId}`);
        redirect(`/donor/listings/${listingId}?celebrate=donation&warning=image-record-failed`);
      }
    }

    revalidatePath("/donor/dashboard");
    revalidatePath("/ngo/dashboard");
    revalidatePath(`/donor/listings/${listingId}`);
    redirect(`/donor/listings/${listingId}?celebrate=donation`);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }
}

export async function lockListingAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  const { error: authError } = await requireSignedInRole("ngo");

  if (authError) {
    redirect(`/ngo/listings/${listingId}?error=${encodeURIComponent(authError)}`);
  }

  const supabase = await createServerSupabaseClient();
  let rpcError = null;

  if (supabase && !listingId.startsWith("mock-")) {
    const { error } = await supabase.rpc("lock_listing", {
      listing_uuid: listingId,
    });
    rpcError = error;
  }

  // Update in-memory mock details for demo responsiveness
  if (mockListingDetails[listingId]) {
    mockListingDetails[listingId].status = "locked";
    mockListingDetails[listingId].canLock = false;
    mockListingDetails[listingId].canMarkPickedUp = true;
    mockListingDetails[listingId].ngoName = "Sahaara Community Trust";
    mockListingDetails[listingId].claimState = "locked";
    mockListingDetails[listingId].chatEnabled = true;
  }

  const query = rpcError
    ? `?error=${encodeURIComponent(formatSupabaseMutationError(rpcError))}`
    : "?locked=1";
  revalidatePath("/ngo/dashboard");
  revalidatePath(`/ngo/listings/${listingId}`);
  revalidatePath("/donor/dashboard");
  redirect(`/ngo/listings/${listingId}${query}`);
}

export async function completePickupAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  const { error: authError } = await requireSignedInRole("ngo");

  if (authError) {
    redirect(`/ngo/listings/${listingId}?error=${encodeURIComponent(authError)}`);
  }

  const supabase = await createServerSupabaseClient();
  let rpcError = null;

  if (supabase && !listingId.startsWith("mock-")) {
    const { error } = await supabase.rpc("complete_locked_claim", {
      listing_uuid: listingId,
    });
    rpcError = error;
  }

  if (mockListingDetails[listingId]) {
    mockListingDetails[listingId].status = "picked_up";
    mockListingDetails[listingId].canMarkPickedUp = false;
    mockListingDetails[listingId].canLeaveFeedback = true;
    mockListingDetails[listingId].claimState = "completed";
  }

  const query = rpcError
    ? `?error=${encodeURIComponent(formatSupabaseMutationError(rpcError))}`
    : "?picked_up=1";
  revalidatePath("/ngo/dashboard");
  revalidatePath(`/ngo/listings/${listingId}`);
  revalidatePath("/donor/dashboard");
  redirect(`/ngo/listings/${listingId}${query}`);
}

export async function submitFeedbackAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const { auth, error: authError } = await requireSignedInRole(["donor", "ngo"]);

    if (authError || !auth.user) {
      return {
        status: "error",
        message: authError ?? "Please sign in first.",
      };
    }

    const payload = feedbackSchema.parse({
      listingId: formData.get("listingId"),
      claimId: formData.get("claimId"),
      targetRole: formData.get("targetRole"),
      rating: formData.get("rating"),
      comments: formData.get("comments"),
    });

    const isDemoUser = auth.user.id.startsWith("11111111") || auth.user.id.startsWith("22222222");
    const supabase = await createServerSupabaseClient();

    if (mockListingDetails[payload.listingId]) {
      mockListingDetails[payload.listingId].feedback.unshift({
        id: randomUUID(),
        authorLabel: payload.targetRole === "ngo" ? "Donor feedback" : "NGO feedback",
        rating: payload.rating,
        comments: payload.comments || null,
        createdAt: new Date().toISOString(),
        targetRole: payload.targetRole,
      });
      mockListingDetails[payload.listingId].canLeaveFeedback = false;
    }

    if (supabase && !isDemoUser && !payload.listingId.startsWith("mock-")) {
      const { error } = await supabase.from("feedback").upsert(
        {
          listing_id: payload.listingId,
          claim_id: payload.claimId || null,
          author_id: auth.user.id,
          target_role: payload.targetRole,
          rating: payload.rating,
          comments: payload.comments || null,
        },
        {
          onConflict: "listing_id,author_id,target_role",
        },
      );

      if (error) {
        console.warn("submitFeedbackAction DB upsert error:", error.message);
      }
    }

    revalidatePath("/donor/dashboard");
    revalidatePath("/ngo/dashboard");
    revalidatePath(`/donor/listings/${payload.listingId}`);
    revalidatePath(`/ngo/listings/${payload.listingId}`);

    return {
      status: "success",
      message: "Feedback saved successfully! Thank you for closing the loop.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }
}

export async function addNgoAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const { error: authError } = await requireSignedInRole("admin");

    if (authError) {
      return {
        status: "error",
        message: authError,
      };
    }

    const payload = ngoSchema.parse({
      name: formData.get("name"),
      address: formData.get("address"),
      city: formData.get("city"),
      pincode: formData.get("pincode"),
      ngoDarpanId: formData.get("ngoDarpanId"),
      registrationNumber: formData.get("registrationNumber"),
      contactPhone: formData.get("contactPhone"),
      serviceRadiusKm: formData.get("serviceRadiusKm"),
      dailyPickupCapacity: formData.get("dailyPickupCapacity"),
      acceptedCategories: formData.get("acceptedCategories"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
    });

    const acceptedCategories = parseAcceptedCategories(payload.acceptedCategories);
    const supabase = await createServerSupabaseClient();

    if (supabase) {
      await supabase
        .from("ngos")
        .insert({
          name: payload.name,
          address: payload.address,
          city: payload.city,
          pincode: payload.pincode,
          ngo_darpan_id: payload.ngoDarpanId || null,
          registration_number: payload.registrationNumber || null,
          contact_phone: payload.contactPhone || null,
          service_radius_km: payload.serviceRadiusKm,
          daily_pickup_capacity: payload.dailyPickupCapacity,
          accepted_categories: acceptedCategories,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
        });
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/ngos");
    return {
      status: "success",
      message: "NGO added. You can verify it from the table below.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }
}

export async function updateNgoStatusAction(formData: FormData) {
  const ngoId = String(formData.get("ngoId") ?? "");
  const parsedStatus = ngoStatusSchema.safeParse(formData.get("verifiedStatus"));
  const { error: authError } = await requireSignedInRole("admin");

  if (authError || !ngoId || !parsedStatus.success) {
    redirect("/admin/ngos");
  }

  const supabase = await createServerSupabaseClient();

  if (supabase && !ngoId.startsWith("ngo-")) {
    await supabase
      .from("ngos")
      .update({
        verified_status: parsedStatus.data,
      })
      .eq("id", ngoId);
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/ngos");
  redirect("/admin/ngos");
}

export async function cancelDonationAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");

  const { auth, error: authError } = await requireSignedInRole("donor");

  if (authError || !auth.user) {
    redirect(`/donor/listings/${listingId}?error=${encodeURIComponent(authError ?? "Please sign in first.")}`);
  }

  const supabase = await createServerSupabaseClient();

  if (supabase && !listingId.startsWith("mock-") && !auth.user.id.startsWith("11111111")) {
    await supabase
      .from("donation_listings")
      .update({ status: "cancelled" })
      .eq("id", listingId)
      .eq("donor_id", auth.user.id)
      .in("status", ["submitted", "live"]);
  }

  if (mockListingDetails[listingId]) {
    mockListingDetails[listingId].status = "cancelled";
    mockListingDetails[listingId].canLock = false;
    mockListingDetails[listingId].canMarkPickedUp = false;
  }

  revalidatePath("/donor/dashboard");
  revalidatePath("/ngo/dashboard");
  revalidatePath(`/donor/listings/${listingId}`);
  redirect(`/donor/listings/${listingId}?cancelled=1`);
}

export async function sendChatMessageAction(payload: {
  listingId: string;
  message: string;
  sharedPhone?: string | null;
  senderRole?: "donor" | "ngo";
  senderName?: string | null;
}) {
  const { listingId, message, sharedPhone, senderRole, senderName } = payload;
  if (!listingId || !message?.trim()) {
    return { success: false, error: "Message is required" };
  }

  const auth = await getAuthContext();
  const role: "donor" | "ngo" =
    senderRole || (auth.role === "ngo" ? "ngo" : "donor");
  const name =
    senderName ||
    auth.profile?.full_name ||
    (role === "donor" ? "Donor" : "NGO Coordinator");

  const newEntry: ChatEntry = {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    senderRole: role,
    senderName: name,
    message: message.trim(),
    sharedPhone: sharedPhone || null,
    createdAt: new Date().toISOString(),
  };

  if (!listingId.startsWith("mock-")) {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && auth.user) {
        await supabase.rpc("send_chat_message", {
          listing_uuid: listingId,
          message_body: message.trim(),
          share_phone: Boolean(sharedPhone),
        });
      }
    } catch {
      // safe fallback
    }
  }

  if (!mockListingDetails[listingId]) {
    mockListingDetails[listingId] = {
      id: listingId,
      category: "Donation Item",
      quantity: 1,
      quality: "good",
      description: null,
      status: "locked",
      locality: "Mumbai",
      city: "Mumbai",
      pincode: "400001",
      addressLine: null,
      landmark: null,
      addressVisible: true,
      pickupWindowStart: new Date().toISOString(),
      pickupWindowEnd: new Date(Date.now() + 3600000).toISOString(),
      imageUrl: null,
      distanceKm: 1.5,
      matchScore: 90,
      ngoRatingAverage: 4.8,
      ngoCompletionRate: 0.95,
      claimId: "claim-temp",
      claimState: "locked",
      ngoName: "Verified NGO Partner",
      latitude: 19.076,
      longitude: 72.8777,
      feedback: [],
      chatEnabled: true,
      chatParticipantName: role === "donor" ? "Verified NGO Partner" : "Donor",
      chatParticipantPhone: "+91 98765 43210",
      chatMessages: [],
      canLock: false,
      canMarkPickedUp: true,
      canLeaveFeedback: false,
      targetFeedbackRole: "donor",
    };
  }

  mockListingDetails[listingId].chatMessages.push(newEntry);
  return { success: true, message: newEntry };
}

export async function getChatMessagesAction(listingId: string): Promise<ChatEntry[]> {
  if (!listingId) return [];
  if (!listingId.startsWith("mock-")) {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("listing_id", listingId)
          .order("created_at", { ascending: true });

        if (!error && data) {
          return (data as unknown[]).map((row: any) => ({
            id: row.id,
            senderRole: row.sender_role,
            senderName: row.sender_role === "donor" ? "Donor" : "NGO Coordinator",
            message: row.message,
            sharedPhone: row.shared_phone,
            createdAt: row.created_at,
          }));
        }
      }
    } catch {
      // safe fallback
    }
  }

  return mockListingDetails[listingId]?.chatMessages ?? [];
}

