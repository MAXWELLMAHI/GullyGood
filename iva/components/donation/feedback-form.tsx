"use client";

import { useActionState, useState } from "react";
import { submitFeedbackAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const RATING_OPTIONS = [
  { val: 5, label: "5 - Excellent", emoji: "🌟" },
  { val: 4, label: "4 - Good", emoji: "✨" },
  { val: 3, label: "3 - Okay", emoji: "👍" },
  { val: 2, label: "2 - Needs Work", emoji: "⚠️" },
  { val: 1, label: "1 - Poor", emoji: "👎" },
];

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
  const [selectedRating, setSelectedRating] = useState<number>(5);

  return (
    <Card className="rounded-[24px] border border-border/80 bg-white p-6 shadow-sm">
      <div className="mb-4 space-y-1">
        <h3 className="font-display text-xl font-bold tracking-tight text-ink">
          Share Pickup Feedback
        </h3>
        <p className="text-xs font-medium text-muted">
          Close the loop with a quick rating and helpful context for the community.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input name="listingId" type="hidden" value={listingId} />
        <input name="claimId" type="hidden" value={claimId ?? ""} />
        <input name="targetRole" type="hidden" value={targetRole} />
        <input name="rating" type="hidden" value={selectedRating} />

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">Rating</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setSelectedRating(opt.val)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all active:scale-95 ${
                  selectedRating === opt.val
                    ? "border-meadow bg-meadow-subtle/70 text-meadow-dk shadow-sm ring-2 ring-meadow/30 font-display"
                    : "border-border/70 bg-paper text-ink hover:bg-slate-50"
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.val} ★</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">Notes & Comments</label>
          <Textarea
            name="comments"
            className="min-h-[90px] rounded-2xl border-border/80 bg-paper/60 p-3.5 text-xs focus:bg-white"
            placeholder="How did the pickup coordination go? Anything we should improve next time?"
          />
        </div>

        {state.message ? (
          <div className={`rounded-xl p-3 text-xs font-semibold ${state.status === "error" ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
            {state.message}
          </div>
        ) : null}

        {previewMode ? (
          <Button disabled variant="outline" className="w-full rounded-2xl py-3 text-xs font-bold">
            Connect Supabase to submit feedback
          </Button>
        ) : (
          <SubmitButton className="w-full rounded-2xl py-3 text-xs font-bold shadow-md shadow-meadow/20" idleLabel="Save Feedback" pendingLabel="Saving..." />
        )}
      </form>
    </Card>
  );
}
