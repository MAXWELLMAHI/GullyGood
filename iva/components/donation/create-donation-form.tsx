"use client";

import { useActionState } from "react";
import { createDonationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { MUMBAI_CENTER } from "@/lib/geo";
import { initialActionState } from "@/lib/forms";

type CreateDonationFormProps = {
  previewMode: boolean;
};

export function CreateDonationForm({ previewMode }: CreateDonationFormProps) {
  const [state, formAction] = useActionState(
    createDonationAction,
    initialActionState,
  );

  return (
    <Card className="glass-panel p-6 sm:p-8">
      <form action={formAction} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Category</label>
            <Select name="category">
              <option value="Blankets">Blankets</option>
              <option value="Clothes">Clothes</option>
              <option value="Books">Books</option>
              <option value="Packed Meals">Packed Meals</option>
              <option value="Utensils">Utensils</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Quantity</label>
            <Input min={1} name="quantity" placeholder="6" type="number" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Quality</label>
            <Select name="quality">
              <option value="new">New</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Image</label>
            <Input accept="image/png,image/jpeg,image/webp" name="image" type="file" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Description</label>
          <Textarea
            name="description"
            placeholder="Add condition notes, sizing, food freshness, or any handling instructions."
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-foreground">Pickup address</label>
            <Input name="addressLine1" placeholder="House/Building, street name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Landmark</label>
            <Input name="landmark" placeholder="Near station / market / school" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Locality</label>
            <Input name="locality" placeholder="Mahim" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">City</label>
            <Input defaultValue="Mumbai" name="city" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Pincode</label>
            <Input inputMode="numeric" maxLength={6} name="pincode" placeholder="400016" />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Pickup window start</label>
            <Input name="pickupWindowStart" type="datetime-local" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Pickup window end</label>
            <Input name="pickupWindowEnd" type="datetime-local" />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Latitude</label>
            <Input
              defaultValue={MUMBAI_CENTER.latitude}
              name="latitude"
              step="0.000001"
              type="number"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Longitude</label>
            <Input
              defaultValue={MUMBAI_CENTER.longitude}
              name="longitude"
              step="0.000001"
              type="number"
            />
          </div>
        </div>

        {state.message ? (
          <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
            {state.message}
          </p>
        ) : null}

        {previewMode ? (
          <Button disabled size="lg" variant="outline">
            Connect Supabase to save donations
          </Button>
        ) : (
          <SubmitButton
            idleLabel="Create live donation"
            pendingLabel="Publishing donation..."
            size="lg"
          />
        )}
      </form>
    </Card>
  );
}
