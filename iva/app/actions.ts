"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { initialActionState, type ActionState } from "@/lib/forms";
import { MUMBAI_CENTER } from "@/lib/geo";
import { getDefaultRouteForRole, ITEM_QUALITIES, type AppRole } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password should be at least 8 characters."),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, "Full name is required."),
  role: z.enum(["donor", "ngo"]),
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

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
}

async function requireSignedInRole(roles: AppRole | AppRole[]) {
  const auth = await getAuthContext();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!auth.supabaseConfigured) {
    return { auth, error: "Add Supabase env vars to enable mutations." };
  }

  if (!auth.user || !auth.role) {
    return { auth, error: "Please sign in first." };
  }

  if (!allowedRoles.includes(auth.role)) {
    return { auth, error: "You do not have access to perform this action." };
  }

  return { auth, error: null };
}

export async function signInAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const payload = signInSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    redirect(getDefaultRouteForRole((profile?.role as AppRole | null) ?? "donor"));
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }
}

export async function signUpAction(
  previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;

  try {
    const payload = signUpSchema.parse({
      fullName: formData.get("fullName"),
      role: formData.get("role"),
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

    redirect(getDefaultRouteForRole(payload.role));
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

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

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return {
        status: "error",
        message: "Supabase is not configured yet.",
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

    const image = formData.get("image");
    const listingId = randomUUID();
    const uploadedImages: Array<{
      listing_id: string;
      storage_path: string;
      mime_type: string;
      size_bytes: number;
      is_primary: boolean;
    }> = [];

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
      const uploadRes = await supabase.storage
        .from("donation-images")
        .upload(storagePath, image, {
          cacheControl: "3600",
          contentType: image.type,
          upsert: false,
        });

      if (uploadRes.error) {
        return {
          status: "error",
          message: uploadRes.error.message,
        };
      }

      uploadedImages.push({
        listing_id: listingId,
        storage_path: storagePath,
        mime_type: image.type,
        size_bytes: image.size,
        is_primary: true,
      });
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
        pickup_window_start: payload.pickupWindowStart,
        pickup_window_end: payload.pickupWindowEnd,
        status: "live",
      })
      .select("id")
      .single();

    if (insertRes.error) {
      return {
        status: "error",
        message: insertRes.error.message,
      };
    }

    if (uploadedImages.length > 0) {
      const imageRes = await supabase.from("donation_images").insert(uploadedImages);

      if (imageRes.error) {
        return {
          status: "error",
          message: imageRes.error.message,
        };
      }
    }

    revalidatePath("/donor/dashboard");
    revalidatePath("/ngo/dashboard");
    redirect(`/donor/listings/${listingId}`);
  } catch (error) {
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

  if (!supabase || !listingId) {
    redirect(`/ngo/listings/${listingId}`);
  }

  const { error } = await supabase.rpc("lock_listing", {
    listing_uuid: listingId,
  });

  const query = error ? `?error=${encodeURIComponent(error.message)}` : "?locked=1";
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

  if (!supabase || !listingId) {
    redirect(`/ngo/listings/${listingId}`);
  }

  const { error } = await supabase.rpc("complete_locked_claim", {
    listing_uuid: listingId,
  });

  const query = error
    ? `?error=${encodeURIComponent(error.message)}`
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

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return {
        status: "error",
        message: "Supabase is not configured yet.",
      };
    }

    const payload = feedbackSchema.parse({
      listingId: formData.get("listingId"),
      claimId: formData.get("claimId"),
      targetRole: formData.get("targetRole"),
      rating: formData.get("rating"),
      comments: formData.get("comments"),
    });

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
      return {
        status: "error",
        message: error.message,
      };
    }

    revalidatePath("/donor/dashboard");
    revalidatePath("/ngo/dashboard");
    revalidatePath(`/donor/listings/${payload.listingId}`);
    revalidatePath(`/ngo/listings/${payload.listingId}`);

    return {
      status: "success",
      message: "Feedback saved.",
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

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return {
        status: "error",
        message: "Supabase is not configured yet.",
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
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
    });

    const { error } = await supabase.from("ngos").insert({
      name: payload.name,
      address: payload.address,
      city: payload.city,
      pincode: payload.pincode,
      ngo_darpan_id: payload.ngoDarpanId || null,
      registration_number: payload.registrationNumber || null,
      contact_phone: payload.contactPhone || null,
      service_radius_km: payload.serviceRadiusKm,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
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

  if (!supabase) {
    redirect("/admin/ngos");
  }

  await supabase
    .from("ngos")
    .update({
      verified_status: parsedStatus.data,
    })
    .eq("id", ngoId);

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/ngos");
  redirect("/admin/ngos");
}
