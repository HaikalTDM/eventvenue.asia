export interface ParsedGoogleMapsLink {
  name: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ParseResult {
  ok: boolean;
  data: ParsedGoogleMapsLink | null;
  error: string | null;
}

const GOOGLE_MAPS_HOSTS = [
  "www.google.com",
  "google.com",
  "maps.google.com",
  "www.google.com.my",
  "google.com.my",
  "www.google.com.sg",
  "goo.gl",
  "maps.app.goo.gl",
];

function isGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return GOOGLE_MAPS_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

function isShortLink(url: URL): boolean {
  return url.hostname === "maps.app.goo.gl" || url.hostname === "goo.gl";
}

function isPlaceUrl(url: URL): boolean {
  return url.pathname.startsWith("/maps/place/") || url.pathname.startsWith("/place/");
}

function extractFromPlacePath(url: URL): ParsedGoogleMapsLink {
  const pathname = url.pathname;
  const result: ParsedGoogleMapsLink = { name: null, latitude: null, longitude: null };

  const atMatch = pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    result.latitude = parseFloat(atMatch[1]);
    result.longitude = parseFloat(atMatch[2]);
  }

  const placeMatch = pathname.match(/\/(?:maps\/)?place\/(.+?)(?:\/@|$)/);
  if (placeMatch) {
    const raw = decodeURIComponent(placeMatch[1]);
    result.name = raw.replace(/\+/g, " ").trim();
  }

  return result;
}

function extractFromQuery(url: URL): ParsedGoogleMapsLink {
  const result: ParsedGoogleMapsLink = { name: null, latitude: null, longitude: null };

  const q = url.searchParams.get("q");
  if (q) {
    const coordsMatch = q.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordsMatch) {
      result.latitude = parseFloat(coordsMatch[1]);
      result.longitude = parseFloat(coordsMatch[2]);
      return result;
    }

    const pathMatch = q.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (pathMatch) {
      result.latitude = parseFloat(pathMatch[1]);
      result.longitude = parseFloat(pathMatch[2]);
      return result;
    }
  }

  const ll = url.searchParams.get("ll");
  if (ll) {
    const parts = ll.split(",");
    if (parts.length >= 2) {
      result.latitude = parseFloat(parts[0]);
      result.longitude = parseFloat(parts[1]);
    }
  }

  return result;
}

function extractFromViewport(url: URL): ParsedGoogleMapsLink {
  const result: ParsedGoogleMapsLink = { name: null, latitude: null, longitude: null };

  const pathname = url.pathname;
  const atMatch = pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    result.latitude = parseFloat(atMatch[1]);
    result.longitude = parseFloat(atMatch[2]);
  }

  return result;
}

export function parseGoogleMapsUrl(raw: string): ParseResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, data: null, error: "No URL provided." };
  }

  if (!isGoogleMapsUrl(trimmed)) {
    return {
      ok: false,
      data: null,
      error: "Not a Google Maps URL. Paste a link from Google Maps.",
    };
  }

  const url = new URL(trimmed);

  if (isShortLink(url)) {
    return {
      ok: false,
      data: null,
      error:
        "Short links (maps.app.goo.gl) cannot be previewed. Open the link in your browser, then copy the full URL from the address bar.",
    };
  }

  let data: ParsedGoogleMapsLink;

  if (isPlaceUrl(url)) {
    data = extractFromPlacePath(url);
  } else if (url.searchParams.has("q") || url.searchParams.has("ll")) {
    data = extractFromQuery(url);
  } else {
    data = extractFromViewport(url);
  }

  if (data.latitude === null || data.longitude === null) {
    return {
      ok: false,
      data: null,
      error: "Could not find location coordinates in this URL. Use the 'Share → Copy link' button in Google Maps.",
    };
  }

  if (Number.isNaN(data.latitude) || Number.isNaN(data.longitude)) {
    return { ok: false, data: null, error: "Invalid coordinates in URL." };
  }

  if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) {
    return { ok: false, data: null, error: "Coordinates out of range." };
  }

  return { ok: true, data, error: null };
}
