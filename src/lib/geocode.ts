export type CapturedLocation = {
  city: string;
  lat: number;
  lng: number;
  label?: string;
};

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60_000,
    });
  });
}

/** City name for profile (prefer city/locality, not full address). */
export async function reverseGeocodeCity(lat: number, lng: number): Promise<CapturedLocation> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
      };
      const city = data.city || data.locality || data.principalSubdivision || "Riyadh";
      return { city, lat, lng, label: city };
    }
  } catch {
    /* fallback */
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=10`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = (await res.json()) as { address?: Record<string, string> };
      const a = data.address ?? {};
      const city =
        a.city || a.town || a.village || a.state || a.principalSubdivision || "Riyadh";
      return { city, lat, lng, label: city };
    }
  } catch {
    /* ignore */
  }

  return { city: "Riyadh", lat, lng, label: "Riyadh" };
}

export async function captureUserLocation(): Promise<CapturedLocation> {
  const pos = await getCurrentPosition();
  return reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude);
}
