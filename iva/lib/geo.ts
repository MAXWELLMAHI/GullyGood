const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export const MUMBAI_CENTER = {
  latitude: 19.076,
  longitude: 72.8777,
};

export function formatPickupWindow(
  start: string | null | undefined,
  end: string | null | undefined,
) {
  if (!start || !end) {
    return "Flexible pickup window";
  }

  return `${dateTimeFormatter.format(new Date(start))} to ${dateTimeFormatter.format(new Date(end))}`;
}

export function formatDistance(distanceKm: number | null | undefined) {
  if (distanceKm == null) {
    return "Local match";
  }

  if (distanceKm < 1) {
    return `${Math.max(100, Math.round(distanceKm * 1000))} m away`;
  }

  const decimals = distanceKm < 10 ? 1 : 0;
  return `${distanceKm.toFixed(decimals)} km away`;
}

export function maskAddress(locality: string | null, city: string | null) {
  if (!locality && !city) {
    return "Address visible after NGO lock";
  }

  return [locality, city].filter(Boolean).join(", ");
}

export function formatCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  if (latitude == null || longitude == null) {
    return "Mumbai coverage area";
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}
