import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ReverseGeocodeResult = {
  success: boolean;
  addressLine1: string;
  locality: string;
  city: string;
  pincode: string;
  landmark: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng") || searchParams.get("lon");

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { success: false, error: "Latitude and longitude are required parameters." },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { success: false, error: "Invalid latitude or longitude." },
      { status: 400 }
    );
  }

  // 1. Try Nominatim (OpenStreetMap) with a proper custom User-Agent
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GullyGood-Community-Donation-Platform/1.0 (contact@gullygood.app)",
        "Accept-Language": "en,en-IN",
      },
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // Locality resolution
      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.residential ||
        addr.village ||
        addr.town ||
        addr.city_district ||
        "";

      // City resolution
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.state_district ||
        "Mumbai";

      // Pincode resolution
      const pincode = addr.postcode || "";

      // Street / Building components
      const building = addr.building || addr.amenity || addr.house_name || "";
      const houseNumber = addr.house_number || "";
      const road = addr.road || addr.pedestrian || addr.street || "";

      const streetParts = [building, houseNumber, road].filter(Boolean);
      let addressLine1 = streetParts.join(", ");

      // Fallback for addressLine1 if specific street parts were missing in OSM
      if (!addressLine1 && data.display_name) {
        const segments = data.display_name
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        // Take first 2-3 segments before country/state
        const usableSegments = segments.slice(0, Math.min(3, Math.max(1, segments.length - 3)));
        addressLine1 = usableSegments.join(", ");
      }

      if (!addressLine1) {
        addressLine1 = locality ? `${locality} Area` : "Nearby Area";
      }

      // Landmark recommendation
      const landmark = road
        ? `Near ${road}`
        : locality
        ? `Near ${locality}`
        : "Near landmark";

      const formattedAddress = [addressLine1, locality, city, pincode]
        .filter(Boolean)
        .join(", ");

      const result: ReverseGeocodeResult = {
        success: true,
        addressLine1,
        locality: locality || "Mumbai Area",
        city,
        pincode,
        landmark,
        formattedAddress: formattedAddress || data.display_name || "Location detected",
        latitude: lat,
        longitude: lng,
      };

      return NextResponse.json(result);
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode error or timeout, trying fallback:", err);
  }

  // 2. Fallback: BigDataCloud Reverse Geocoding API
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(bdcUrl, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.principalSubdivision || "";
      const city = data.city || data.localityInfo?.administrative?.[2]?.name || "Mumbai";
      const pincode = data.postcode || "";
      const addressLine1 = [data.locality, data.principalSubdivision].filter(Boolean).join(", ");
      const landmark = locality ? `Near ${locality}` : "Near landmark";

      const formattedAddress = [addressLine1, locality, city, pincode].filter(Boolean).join(", ");

      return NextResponse.json({
        success: true,
        addressLine1: addressLine1 || "GPS Detected Location",
        locality: locality || "Mumbai Area",
        city,
        pincode,
        landmark,
        formattedAddress: formattedAddress || "Location detected",
        latitude: lat,
        longitude: lng,
      });
    }
  } catch (err) {
    console.warn("BigDataCloud fallback failed:", err);
  }

  // 3. Fallback coordinates only
  return NextResponse.json({
    success: true,
    addressLine1: "Current Location",
    locality: "Mumbai Area",
    city: "Mumbai",
    pincode: "",
    landmark: "Near GPS coordinates",
    formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    latitude: lat,
    longitude: lng,
  });
}
