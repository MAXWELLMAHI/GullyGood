"use client";

import { useActionState } from "react";
import { addNgoAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/forms";

type AddNgoFormProps = {
  previewMode: boolean;
};

export function AddNgoForm({ previewMode }: AddNgoFormProps) {
  const [state, formAction] = useActionState(addNgoAction, initialActionState);

  return (
    <Card className="glass-panel p-6">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Add NGO manually</h2>
        <p className="text-sm leading-6 text-muted">
          Create the organization record first, then assign staff and verification status.
        </p>
      </div>

      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <Input name="name" placeholder="NGO name" />
        <Input name="contactPhone" placeholder="Contact phone" />
        <Input className="md:col-span-2" name="address" placeholder="Address" />
        <Input name="city" placeholder="City" />
        <Input name="pincode" placeholder="Pincode" />
        <Input name="ngoDarpanId" placeholder="NGO Darpan ID" />
        <Input name="registrationNumber" placeholder="Registration number" />
        <Input name="serviceRadiusKm" placeholder="Service radius (km)" type="number" />
        <Input name="latitude" placeholder="Latitude (optional)" step="0.000001" type="number" />
        <Input name="longitude" placeholder="Longitude (optional)" step="0.000001" type="number" />

        <div className="md:col-span-2">
          {state.message ? (
            <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
              {state.message}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          {previewMode ? (
            <Button disabled variant="outline">
              Connect Supabase to add NGOs
            </Button>
          ) : (
            <SubmitButton idleLabel="Add NGO record" pendingLabel="Adding NGO..." />
          )}
        </div>
      </form>
    </Card>
  );
}
