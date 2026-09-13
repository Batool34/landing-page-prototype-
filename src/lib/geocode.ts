/** Stored in prefs / synced to backend — not shown in profile UI. */
export type LocationGeoDetails = {
  lat: number;
  lng: number;
  country?: string;
  region?: string;
  locality?: string;
  neighbourhood?: string;
  postcode?: string;
  provider?: "bigdatacloud" | "nominatim";
};

export type CapturedLocation = {
  city: string;
  district: string | null;
  lat: number;
  lng: number;
  geo: LocationGeoDetails;
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

function pickDistrictFromAddress(a: Record<string, string>): string | null {
  const d =
    a.suburb ||
    a.neighbourhood ||
    a.city_district ||
    a.quarter ||
    a.district ||
    a.borough ||
    null;
  return d?.trim() || null;
}

/** City + district for UI; full coordinates in `geo` for backend only. */
export async function reverseGeocodeCity(lat: number, lng: number): Promise<CapturedLocation> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
        postcode?: string;
        localityInfo?: { administrative?: Array<{ name?: string; order?: number }> };
      };
      const city = data.city || data.locality || data.principalSubdivision || "Riyadh";
      const admin = data.localityInfo?.administrative ?? [];
      const neighbourhood =
        admin.find((x) => x.order === 8 || x.order === 9)?.name ||
        admin.find((x) => x.order === 7)?.name ||
        null;
      const district =
        neighbourhood && neighbourhood !== city ? neighbourhood : data.locality !== city ? data.locality : null;
      return {
        city,
        district,
        lat,
        lng,
        geo: {
          lat,
          lng,
          country: data.countryName,
          region: data.principalSubdivision,
          locality: data.locality,
          neighbourhood: district ?? undefined,
          postcode: data.postcode,
          provider: "bigdatacloud",
        },
      };
    }
  } catch {
    /* fallback */
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=14`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = (await res.json()) as { address?: Record<string, string> };
      const a = data.address ?? {};
      const city =
        a.city || a.town || a.village || a.state || a.principalSubdivision || "Riyadh";
      const district = pickDistrictFromAddress(a);
      return {
        city,
        district: district && district !== city ? district : null,
        lat,
        lng,
        geo: {
          lat,
          lng,
          country: a.country,
          region: a.state || a.principalSubdivision,
          locality: a.city || a.town || a.village,
          neighbourhood: district ?? undefined,
          postcode: a.postcode,
          provider: "nominatim",
        },
      };
    }
  } catch {
    /* ignore */
  }

  return {
    city: "Riyadh",
    district: null,
    lat,
    lng,
    geo: { lat, lng, provider: "nominatim" },
  };
}

export async function captureUserLocation(): Promise<CapturedLocation> {
  const pos = await getCurrentPosition();
  return reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude);
}
