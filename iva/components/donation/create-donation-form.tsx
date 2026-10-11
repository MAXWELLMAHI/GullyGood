"use client";

import { useActionState, useState, useEffect, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Image as ImageIcon,
  Info,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createDonationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { MUMBAI_CENTER } from "@/lib/geo";
import { initialActionState } from "@/lib/forms";
import { cn } from "@/lib/utils";

type CreateDonationFormProps = {
  previewMode: boolean;
};

const categoryOptions = [
  { name: "Clothes", emoji: "👕", bg: "bg-[#22C55E]", chip: "bg-[#F1FCF5] text-[#17A34A]", desc: "Clean shirts, pants, jackets" },
  { name: "Books", emoji: "📚", bg: "bg-[#1CB0F6]", chip: "bg-[#F0F9FF] text-[#0284C7]", desc: "Textbooks, novels, workbooks" },
  { name: "Blankets", emoji: "🛏️", bg: "bg-[#FFC800]", chip: "bg-[#FFFBEB] text-[#8A6300]", desc: "Warm bedding & linens" },
  { name: "Packed Meals", emoji: "🍲", bg: "bg-[#FF6B6B]", chip: "bg-[#FFF1F2] text-[#E11D48]", desc: "Fresh sealed food & rations" },
  { name: "Toys", emoji: "🧸", bg: "bg-[#7C6EF2]", chip: "bg-[#F5F3FF] text-[#7C6EF2]", desc: "Games, puzzles, soft toys" },
  { name: "Utensils", emoji: "🥣", bg: "bg-[#06B6D4]", chip: "bg-[#ECFEFF] text-[#0E7490]", desc: "Cooking pots, plates, cutlery" },
];

const qualityOptions = [
  { value: "new", label: "Brand new", hint: "Unopened or with tags" },
  { value: "excellent", label: "Excellent", hint: "Gently used, looks fresh" },
  { value: "good", label: "Good", hint: "Functional with slight wear" },
  { value: "fair", label: "Fair", hint: "Usable condition" },
];

const localityPresets = [
  { name: "Mahim", pincode: "400016", lat: 19.0415, lng: 72.8397, landmark: "Near Mahim railway station" },
  { name: "Bandra West", pincode: "400050", lat: 19.0548, lng: 72.8265, landmark: "Linking Road / Hill Road" },
  { name: "Dadar East", pincode: "400014", lat: 19.0152, lng: 72.8451, landmark: "Near Swami Narayan Temple" },
  { name: "Andheri West", pincode: "400058", lat: 19.1197, lng: 72.8468, landmark: "Near Lokhandwala Market" },
  { name: "Colaba", pincode: "400005", lat: 18.9067, lng: 72.8147, landmark: "Near Causeway" },
];

function getDefaultWindows() {
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  const end = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours from now

  const formatLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return {
    start: formatLocal(start),
    end: formatLocal(end),
  };
}

function playHappyChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.001, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.045 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.17);
    });
  } catch {
    // Ignore audio restriction
  }
}

function triggerHappyFeedback() {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    try {
      playHappyChime();
    } catch {
      // Audio optional
    }
    try {
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([15, 30, 20]);
      }
    } catch {
      // Vibrate optional
    }
  }, 0);
}

export function CreateDonationForm({ previewMode }: CreateDonationFormProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "Clothes";

  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState<string>(initialCategory);
  const [quantity, setQuantity] = useState<number>(5);
  const [quality, setQuality] = useState<string>("good");
  const [description, setDescription] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [locality, setLocality] = useState<string>("Mahim");
  const [pincode, setPincode] = useState<string>("400016");
  const [landmark, setLandmark] = useState<string>("Near Mahim railway station");
  const [addressLine1, setAddressLine1] = useState<string>("Flat 302, Palm View Apartments");
  const [city, setCity] = useState<string>("Mumbai");
  const [latitude, setLatitude] = useState<number>(19.0415);
  const [longitude, setLongitude] = useState<number>(72.8397);

  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationDetected, setLocationDetected] = useState<boolean>(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);

  async function detectLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    setLocationDetected(false);
    setDetectedAddress(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          const data = await res.json();

          if (data && data.success) {
            if (data.addressLine1) setAddressLine1(data.addressLine1);
            if (data.locality) setLocality(data.locality);
            if (data.city) setCity(data.city);
            if (data.pincode) setPincode(data.pincode);
            if (data.landmark) setLandmark(data.landmark);
            setDetectedAddress(data.formattedAddress || `${data.addressLine1}, ${data.locality}`);
            setLocationDetected(true);
          } else {
            throw new Error(data?.error || "Failed to resolve address");
          }
        } catch {
          // Fallback reverse geocoding via BigDataCloud client API
          try {
            const bdcRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            const bdcData = await bdcRes.json();
            const loc = bdcData.locality || bdcData.principalSubdivision || "";
            const ct = bdcData.city || "Mumbai";
            const pin = bdcData.postcode || "";
            const addr = [bdcData.locality, bdcData.principalSubdivision].filter(Boolean).join(", ");
            if (addr) setAddressLine1(addr);
            if (loc) setLocality(loc);
            if (ct) setCity(ct);
            if (pin) setPincode(pin);
            setDetectedAddress([addr, loc, ct, pin].filter(Boolean).join(", "));
            setLocationDetected(true);
          } catch {
            setAddressLine1(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            setDetectedAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            setLocationDetected(true);
          }
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) {
          setLocationError(
            "Location permission was denied. Please allow location access in your browser (click the lock/tune icon in the address bar) and try again."
          );
        } else if (err.code === 2) {
          setLocationError(
            "Location unavailable. Please make sure your device GPS / location services are enabled."
          );
        } else if (err.code === 3) {
          setLocationError("Location request timed out. Please tap the button to try again.");
        } else {
          setLocationError("Couldn't access location. Try again or pick a Mumbai area preset below.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  const defaultWindows = getDefaultWindows();
  const [pickupWindowStart, setPickupWindowStart] = useState<string>(defaultWindows.start);
  const [pickupWindowEnd, setPickupWindowEnd] = useState<string>(defaultWindows.end);

  const [state, formAction] = useActionState(
    createDonationAction,
    initialActionState,
  );

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && categoryOptions.some((c) => c.name.toLowerCase() === cat.toLowerCase())) {
      const match = categoryOptions.find((c) => c.name.toLowerCase() === cat.toLowerCase());
      if (match) {
        setCategory(match.name);
        setStep(2); // automatically jump to details if category passed in URL
      }
    }
  }, [searchParams]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function applyPresetLocality(preset: typeof localityPresets[0]) {
    setLocality(preset.name);
    setPincode(preset.pincode);
    setLandmark(preset.landmark);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setAddressLine1(`${preset.landmark}, ${preset.name}`);
    setLocationDetected(false);
    setDetectedAddress(null);
  }

  const selectedCategoryObj = categoryOptions.find((c) => c.name === category) || categoryOptions[0];

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      {/* 1. Progress Step Indicator (Spec §4 redline 5) */}
      <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          {[
            { n: 1, title: "Category" },
            { n: 2, title: "Item details" },
            { n: 3, title: "Pickup window" },
            { n: 4, title: "Review & publish" },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => s.n < step && setStep(s.n)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                step === s.n
                  ? "bg-[#14251C] text-[#22C55E]"
                  : step > s.n
                  ? "bg-[#F1FCF5] text-[#17A34A] cursor-pointer"
                  : "text-[#9CA3AF]",
              )}
            >
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                step === s.n ? "bg-[#22C55E] text-[#14251C]" : step > s.n ? "bg-[#17A34A] text-white" : "bg-[#E5E7EB] text-[#6B7280]"
              )}>
                {step > s.n ? "✓" : s.n}
              </span>
              <span className="hidden sm:inline font-display">{s.title}</span>
            </button>
          ))}
        </div>
        {/* Progress Bar Fill */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
          <div
            className="h-full bg-[#22C55E] transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form action={formAction} className="pb-28 sm:pb-0">
        {/* Hidden inputs to pass data to Server Action */}
        <input name="category" type="hidden" value={category} />
        <input name="quantity" type="hidden" value={quantity} />
        <input name="quality" type="hidden" value={quality} />
        <input name="description" type="hidden" value={description} />
        <input name="addressLine1" type="hidden" value={addressLine1} />
        <input name="landmark" type="hidden" value={landmark} />
        <input name="locality" type="hidden" value={locality} />
        <input name="city" type="hidden" value={city} />
        <input name="pincode" type="hidden" value={pincode} />
        <input name="latitude" type="hidden" value={latitude} />
        <input name="longitude" type="hidden" value={longitude} />
        <input name="pickupWindowStart" type="hidden" value={pickupWindowStart} />
        <input name="pickupWindowEnd" type="hidden" value={pickupWindowEnd} />

        {/* STEP 1: CATEGORY SELECTION (Spec §4 redlines 5 & 6) */}
        {step === 1 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17A34A]">
                Step 1 of 4
              </span>
              <h2 className="font-display text-2xl font-bold text-[#14251C] sm:text-3xl">
                What are you giving today?
              </h2>
              <p className="text-sm text-[#6B7280]">
                Choose an item category. Each category carries a fixed hue across the app.
              </p>
            </div>

            {/* Solid Color Big Category Tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categoryOptions.map((cat) => {
                const isSelected = category.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setCategory(cat.name);
                      triggerHappyFeedback();
                    }}
                    onPointerDown={(e) => {
                      if (e.pointerType === "touch") {
                        setCategory(cat.name);
                        triggerHappyFeedback();
                      }
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-[24px] p-4 sm:p-5 text-center text-white transition-all duration-100 cursor-pointer touch-manipulation select-none border-4 min-h-[140px] sm:min-h-[160px]",
                      cat.bg,
                      isSelected
                        ? "border-white ring-4 ring-[#14251C] shadow-2xl scale-[1.03] z-10"
                        : "border-transparent opacity-95 active:opacity-80"
                    )}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#14251C] shadow-lg font-bold">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </span>
                    )}
                    <span className="text-4xl sm:text-5xl transition-transform duration-100">
                      {cat.emoji}
                    </span>
                    <span className="mt-2 font-display text-base sm:text-lg font-bold">
                      {cat.name}
                    </span>
                    <span className="mt-0.5 text-[11px] opacity-90 line-clamp-1 font-medium">
                      {cat.desc}
                    </span>
                    {isSelected && (
                      <span className="mt-1.5 rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                        Selected ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop Continue Button */}
            <div className="hidden sm:flex justify-end pt-4">
              <Button
                size="lg"
                type="button"
                onClick={() => {
                  setStep(2);
                  triggerHappyFeedback();
                }}
                className="w-auto font-display touch-manipulation shadow-md shadow-[#22C55E]/20"
              >
                <span>Continue to details ({category})</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: ITEM DETAILS & QUANTITY */}
        {step === 2 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17A34A]">
                Step 2 of 4 · {category}
              </span>
              <h2 className="font-display text-2xl font-bold text-[#14251C] sm:text-3xl">
                How many and what condition?
              </h2>
              <p className="text-sm text-[#6B7280]">
                Help nearby Mumbai NGOs know item volume and quality upfront.
              </p>
            </div>

            {/* Quantity Stepper */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFA] p-5 space-y-3">
              <label className="font-display text-sm font-bold text-[#14251C]">
                Quantity ({category})
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity((prev) => Math.max(1, prev - 1));
                      triggerHappyFeedback();
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-lg font-bold text-[#14251C] shadow-xs transition hover:bg-[#F1FCF5] touch-manipulation cursor-pointer"
                  >
                    <Minus className="h-5 w-5 pointer-events-none" />
                  </button>
                  <div className="flex h-12 min-w-20 items-center justify-center rounded-2xl bg-white px-4 border border-[#E5E7EB] shadow-xs font-display text-2xl font-bold text-[#14251C]">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity((prev) => prev + 1);
                      triggerHappyFeedback();
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22C55E] text-lg font-bold text-white shadow-xs transition hover:bg-[#17A34A] touch-manipulation cursor-pointer"
                  >
                    <Plus className="h-5 w-5 pointer-events-none" />
                  </button>
                </div>
                {/* Quick presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0 sm:ml-2">
                  {[1, 5, 10, 20, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setQuantity(num);
                        triggerHappyFeedback();
                      }}
                      className={cn(
                        "min-h-[36px] min-w-[36px] rounded-full px-3.5 py-1 text-xs font-bold transition touch-manipulation cursor-pointer",
                        quantity === num ? "bg-[#14251C] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F1FCF5]"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality Selector Pills */}
            <div className="space-y-2.5">
              <label className="font-display text-sm font-bold text-[#14251C]">
                Quality rating
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {qualityOptions.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => {
                      setQuality(q.value);
                      triggerHappyFeedback();
                    }}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all touch-manipulation select-none cursor-pointer min-h-[64px]",
                      quality === q.value
                        ? "border-[#22C55E] bg-[#F1FCF5] ring-2 ring-[#22C55E]/40 scale-[1.02]"
                        : "border-[#E5E7EB] bg-white hover:bg-[#FCFCFA]"
                    )}
                  >
                    <span className="font-display text-sm font-bold text-[#14251C] pointer-events-none">
                      {q.label}
                    </span>
                    <span className="text-[11px] text-[#6B7280] pointer-events-none">
                      {q.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Upload Zone */}
            <div className="space-y-2">
              <label className="font-display text-sm font-bold text-[#14251C]">
                Add a photo (optional)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#FCFCFA] p-5">
                {imagePreview ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[#E5E7EB] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="Item preview" className="h-full w-full object-cover" src={imagePreview} />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1FCF5] text-[#17A34A] shrink-0">
                    <Camera className="h-7 w-7" />
                  </div>
                )}
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-xs font-semibold text-[#14251C]">
                    Upload a real photo to help NGOs match faster
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    PNG, JPG, WebP up to 5MB
                  </p>
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    name="image"
                    onChange={handleImageChange}
                    type="file"
                    className="mt-2 text-xs text-[#6B7280] file:mr-2 file:rounded-full file:border-0 file:bg-[#14251C] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-[#1B3226]"
                  />
                </div>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label className="font-display text-sm font-bold text-[#14251C]">
                Description & notes
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g. Clean shirts washed and packed in a bag, ready near society gate."
                className="min-h-20"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={() => {
                  setStep(3);
                  triggerHappyFeedback();
                }}
                className="font-display touch-manipulation shadow-md shadow-[#22C55E]/20"
              >
                <span>Pickup window & area</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: LOCATION & PICKUP WINDOW */}
        {step === 3 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17A34A]">
                Step 3 of 4 · Pickup Setup
              </span>
              <h2 className="font-display text-2xl font-bold text-[#14251C] sm:text-3xl">
                Where and when should we pick up?
              </h2>
              <p className="text-sm text-[#6B7280]">
                Your exact flat/building address stays private until an NGO locks the donation.
              </p>
            </div>

            {/* Privacy Guarantee Banner */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#22C55E]/30 bg-[#F1FCF5] p-3.5 text-xs font-medium text-[#14251C]">
              <ShieldCheck className="h-5 w-5 text-[#17A34A] shrink-0" />
              <p>
                <strong className="text-[#17A34A]">Privacy protected:</strong> NGOs only see your locality ({locality}) until they officially claim this item.
              </p>
            </div>

            {/* Auto-detect Current Location */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-display text-sm font-bold text-[#14251C]">
                  Current Pickup Location
                </label>
                <span className="text-[11px] font-semibold text-[#17A34A] bg-[#F1FCF5] px-2.5 py-0.5 rounded-full border border-[#22C55E]/30">
                  GPS Auto-Fill
                </span>
              </div>

              <button
                type="button"
                onClick={detectLocation}
                disabled={locationLoading}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-md transition-all duration-200 active:scale-95 cursor-pointer",
                  locationLoading
                    ? "bg-[#16A34A]/80 text-white cursor-wait"
                    : locationDetected
                    ? "border-2 border-[#16A34A] bg-[#F1FCF5] text-[#15803D] hover:bg-[#E2F7E9]"
                    : "bg-[#16A34A] text-white hover:bg-[#15803D] shadow-[#16A34A]/25"
                )}
              >
                {locationLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Accessing location & auto-filling address...</span>
                  </>
                ) : locationDetected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                    <span>Location Allowed ✓ — Tap to Refresh Address</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="h-4 w-4 text-white" />
                    <span>Allow & Access Current Location (Auto-fill Address)</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-[#6B7280]">
                Clicking allows browser location permission to automatically look up your street, locality, landmark, and pincode.
              </p>

              {locationError && (
                <div className="rounded-2xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <span>⚠️</span>
                    <span>Location Permission / Access</span>
                  </div>
                  <p>{locationError}</p>
                </div>
              )}

              {locationDetected && (
                <div className="rounded-2xl border border-[#22C55E]/40 bg-[#F1FCF5] p-3.5 text-xs text-[#14251C] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#17A34A] flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                      Address Auto-Filled Successfully
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </span>
                  </div>
                  <p className="font-semibold text-[#14251C]">
                    📍 {detectedAddress || `${addressLine1}, ${locality}, ${city}`}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    Address fields below have been auto-filled. You can edit any field to add flat, floor, or gate details.
                  </p>
                </div>
              )}
            </div>

            {/* Locality Shortcut Chips */}
            <div className="space-y-2">
              <label className="font-display text-sm font-bold text-[#14251C]">
                Or pick a Mumbai preset
              </label>
              <div className="flex flex-wrap gap-2">
                {localityPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPresetLocality(preset)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                      locality === preset.name && !locationDetected
                        ? "bg-[#14251C] text-white shadow-xs"
                        : "bg-[#FCFCFA] border border-[#E5E7EB] text-[#4B5563] hover:border-[#22C55E]"
                    )}
                  >
                    📍 {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Address fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#14251C]">House / Building & Street</label>
                <Input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Flat No, Building, Street"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#14251C]">Landmark</label>
                <Input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near station / temple / school"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#14251C]">Pincode</label>
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="400016"
                  maxLength={6}
                />
              </div>
            </div>

            {/* Pickup Window Date Times */}
            <div className="space-y-2">
              <label className="font-display text-sm font-bold text-[#14251C]">
                Pickup time window
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#6B7280]">Earliest available</span>
                  <Input
                    type="datetime-local"
                    value={pickupWindowStart}
                    onChange={(e) => setPickupWindowStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#6B7280]">Latest available</span>
                  <Input
                    type="datetime-local"
                    value={pickupWindowEnd}
                    onChange={(e) => setPickupWindowEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Navigation for Step 3 */}
            <div className="hidden sm:flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={() => {
                  setStep(4);
                  triggerHappyFeedback();
                }}
                className="font-display touch-manipulation shadow-md shadow-[#22C55E]/20"
              >
                <span>Review & confirm</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 4: REVIEW & CELEBRATION SUBMIT */}
        {step === 4 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17A34A]">
                Step 4 of 4 · Final Review
              </span>
              <h2 className="font-display text-2xl font-bold text-[#14251C] sm:text-3xl">
                Ready to publish your donation?
              </h2>
              <p className="text-sm text-[#6B7280]">
                Once published, nearby verified NGOs will receive an instant radius match notification.
              </p>
            </div>

            {/* Summary Visual Card */}
            <div className="rounded-3xl border border-[#E5E7EB] bg-[#FCFCFA] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${selectedCategoryObj.bg} text-3xl text-white shadow-md`}>
                  {selectedCategoryObj.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#14251C] px-2.5 py-0.5 text-[10px] font-bold text-[#22C55E]">
                      {category}
                    </span>
                    <span className="rounded-full bg-white border border-[#E5E7EB] px-2.5 py-0.5 text-[10px] font-bold text-[#4B5563] uppercase">
                      {quality}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#14251C] mt-1">
                    {quantity} {quantity === 1 ? "unit" : "units"} ready for pickup
                  </h3>
                </div>
              </div>

              <div className="grid gap-3 pt-3 border-t border-[#E5E7EB] text-xs font-medium text-[#6B7280] sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#22C55E]" />
                  <span>{addressLine1}, {locality}, Mumbai ({pincode})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#1CB0F6]" />
                  <span>From {new Date(pickupWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(pickupWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {description && (
                <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-xs text-[#6B7280]">
                  <strong>Notes:</strong> {description}
                </div>
              )}
            </div>

            {state.message ? (
              <p className={`text-sm font-semibold ${state.status === "error" ? "text-[#FF4B4B]" : "text-[#17A34A]"}`}>
                {state.message}
              </p>
            ) : null}

            {/* Desktop Navigation for Step 4 */}
            <div className="hidden sm:flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Edit details</span>
              </Button>

              {previewMode ? (
                <SubmitButton
                  idleLabel="Publish live donation (Demo)"
                  pendingLabel="Publishing..."
                  size="lg"
                  className="font-display touch-manipulation shadow-md shadow-[#22C55E]/30"
                />
              ) : (
                <SubmitButton
                  idleLabel="Publish donation to verified NGOs 🎉"
                  pendingLabel="Broadcasting to NGOs..."
                  size="lg"
                  className="font-display animate-celebrate touch-manipulation shadow-md shadow-[#22C55E]/30"
                />
              )}
            </div>
          </Card>
        )}

        {/* UNIFIED MOBILE BOTTOM BAR (Fixed to Viewport, Safe-Area Padded, Always Accessible) */}
        <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-[#E5E7EB] bg-white/98 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(20,37,28,0.12)] backdrop-blur-lg sm:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            {step === 1 && (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl">{selectedCategoryObj.emoji}</span>
                  <div className="truncate">
                    <p className="font-display text-sm font-bold text-[#14251C] truncate">
                      {category}
                    </p>
                    <p className="text-[10px] font-bold text-[#17A34A]">
                      Ready to give 🎁
                    </p>
                  </div>
                </div>
                <Button
                  size="md"
                  type="button"
                  onClick={() => {
                    setStep(2);
                    triggerHappyFeedback();
                  }}
                  onPointerDown={(e) => {
                    if (e.pointerType === "touch") {
                      setStep(2);
                      triggerHappyFeedback();
                    }
                  }}
                  className="h-12 px-6 font-display text-sm font-bold shadow-md shadow-[#22C55E]/30 touch-manipulation shrink-0 cursor-pointer"
                >
                  <span>Continue →</span>
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  onPointerDown={(e) => {
                    if (e.pointerType === "touch") setStep(1);
                  }}
                  className="h-11 px-3.5 font-bold touch-manipulation shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <div className="text-center truncate px-1">
                  <p className="font-display text-xs font-bold text-[#14251C] truncate">
                    {quantity} items · {quality}
                  </p>
                </div>
                <Button
                  size="md"
                  type="button"
                  onClick={() => {
                    setStep(3);
                    triggerHappyFeedback();
                  }}
                  onPointerDown={(e) => {
                    if (e.pointerType === "touch") {
                      setStep(3);
                      triggerHappyFeedback();
                    }
                  }}
                  className="h-12 px-5 font-display text-sm font-bold shadow-md shadow-[#22C55E]/30 touch-manipulation shrink-0 cursor-pointer"
                >
                  <span>Next: Area →</span>
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(2)}
                  onPointerDown={(e) => {
                    if (e.pointerType === "touch") setStep(2);
                  }}
                  className="h-11 px-3.5 font-bold touch-manipulation shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <div className="text-center truncate px-1">
                  <p className="font-display text-xs font-bold text-[#14251C] truncate">
                    📍 {locality}
                  </p>
                </div>
                <Button
                  size="md"
                  type="button"
                  onClick={() => {
                    setStep(4);
                    triggerHappyFeedback();
                  }}
                  onPointerDown={(e) => {
                    if (e.pointerType === "touch") {
                      setStep(4);
                      triggerHappyFeedback();
                    }
                  }}
                  className="h-12 px-5 font-display text-sm font-bold shadow-md shadow-[#22C55E]/30 touch-manipulation shrink-0 cursor-pointer"
                >
                  <span>Review →</span>
                </Button>
              </>
            )}

            {step === 4 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(3)}
                  onPointerDown={(e) => {
                    if (e.pointerType === "touch") setStep(3);
                  }}
                  className="h-11 px-3.5 font-bold touch-manipulation shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
                <div className="flex-1">
                  <SubmitButton
                    idleLabel={previewMode ? "Publish (Demo) 🎉" : "Publish to NGOs 🎉"}
                    pendingLabel="Broadcasting..."
                    size="md"
                    className="w-full h-12 font-display text-sm font-bold shadow-md shadow-[#22C55E]/30 touch-manipulation cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

