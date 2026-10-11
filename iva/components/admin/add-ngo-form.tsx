"use client";

import { useActionState, useState } from "react";
import { LocateFixed, CheckCircle2 } from "lucide-react";
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
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locDetected, setLocDetected] = useState(false);

  async function detectLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          if (data && data.success) {
            if (data.formattedAddress) setAddress(data.formattedAddress);
            if (data.city) setCity(data.city);
            if (data.pincode) setPincode(data.pincode);
            setLocDetected(true);
          }
        } catch {
          setLocDetected(true);
        } finally {
          setLocLoading(false);
        }
      },
      () => {
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <Card className="rounded-[28px] border border-border/80 bg-white p-6 shadow-sm">
      <div className="mb-5 space-y-1">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">
          Add NGO Partner
        </h2>
        <p className="text-xs font-medium text-muted">
          Create the organization record first, then assign staff and verification credentials.
        </p>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={detectLocation}
          disabled={locLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#15803D] active:scale-95 cursor-pointer disabled:opacity-60"
        >
          {locLoading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Detecting Office Address...</span>
            </>
          ) : locDetected ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Office Address Auto-Filled ✓</span>
            </>
          ) : (
            <>
              <LocateFixed className="h-3.5 w-3.5" />
              <span>Allow & Access Current Location for NGO Office</span>
            </>
          )}
        </button>
      </div>

      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <Input name="name" placeholder="NGO Organization Name" />
        <Input name="contactPhone" placeholder="Contact Phone (+91...)" />
        <Input
          className="md:col-span-2"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Registered Office / Warehouse Address"
        />
        <Input
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (e.g. Mumbai)"
        />
        <Input
          name="pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          placeholder="Pincode (e.g. 400050)"
        />
        <Input name="ngoDarpanId" placeholder="NGO Darpan ID (e.g. MH/2024/012345)" />
        <Input name="registrationNumber" placeholder="Trust / Society Reg. Number" />
        <Input name="serviceRadiusKm" placeholder="Service Radius (km)" type="number" defaultValue={10} />
        <Input
          name="latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Latitude (optional, e.g. 19.0596)"
          step="0.000001"
          type="number"
        />
        <Input
          name="longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Longitude (optional, e.g. 72.8295)"
          step="0.000001"
          type="number"
        />

        <div className="md:col-span-2">
          {state.message ? (
            <div className={`rounded-xl p-3 text-xs font-semibold ${state.status === "error" ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {state.message}
            </div>
          ) : null}
        </div>

        <div className="md:col-span-2 pt-2">
          {previewMode ? (
            <Button disabled variant="outline" className="w-full rounded-2xl py-3 text-xs font-bold">
              Connect Supabase to Add NGOs
            </Button>
          ) : (
            <SubmitButton className="w-full rounded-2xl py-3 text-xs font-bold shadow-md shadow-meadow/20" idleLabel="Create NGO Partner Record" pendingLabel="Registering NGO..." />
          )}
        </div>
      </form>
    </Card>
  );
}
