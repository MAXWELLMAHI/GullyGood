"use client";

import { useActionState } from "react";
import { submitFeedbackAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/forms";
import type { AppRole } from "@/lib/roles";

type FeedbackFormProps = {
  listingId: string;
  claimId?: string | null;
  targetRole: AppRole;
  previewMode: boolean;
};

export function FeedbackForm({
  listingId,
  claimId,
  targetRole,
  previewMode,
}: FeedbackFormProps) {
  const [state, formAction] = useActionState(
    submitFeedbackAction,
    initialActionState,
  );

  return (
    <Card className="glass-panel p-6">
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold text-foreground">
          Share pickup feedback
        </h3>
        <p className="text-sm leading-6 text-muted">
          Close the loop with a simple rating and any context the other side should know.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input name="listingId" type="hidden" value={listingId} />
        <input name="claimId" type="hidden" value={claimId ?? ""} />
        <input name="targetRole" type="hidden" value={targetRole} />

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Rating</label>
          <Select name="rating">
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Okay</option>
            <option value="2">2 - Needs improvement</option>
            <option value="1">1 - Poor</option>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Notes</label>
          <Textarea
            name="comments"
            placeholder="How did the pickup coordination go? Anything we should improve next time?"
          />
        </div>

        {state.message ? (
          <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
            {state.message}
          </p>
        ) : null}

        {previewMode ? (
          <Button disabled variant="outline">
            Connect Supabase to submit feedback
          </Button>
        ) : (
          <SubmitButton idleLabel="Save feedback" pendingLabel="Saving..." />
        )}
      </form>
    </Card>
  );
}
