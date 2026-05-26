"use client";

import { useState } from "react";

export interface GeoFilterValue {
  /** WGS84 latitude in decimal degrees, or null when geo filter is off */
  latitude: number | null;
  /** WGS84 longitude in decimal degrees, or null when geo filter is off */
  longitude: number | null;
  /** Search radius in kilometres */
  radiusKm: number;
}

interface GeolocationFilterProps {
  value: GeoFilterValue;
  onChange: (next: GeoFilterValue) => void;
  className?: string;
}

const DEFAULT_RADIUS_KM = 10;
const RADIUS_OPTIONS = [1, 5, 10, 25, 50, 100];

/**
 * Two complementary inputs for "near me" filtering:
 *   1. "Use My Current Location" - browser navigator.geolocation
 *   2. Manual latitude / longitude entry
 *
 * Plus a radius selector. The parent owns the value and is expected to
 * pass {latitude, longitude, radiusKm} to the listings API as
 * ?lat=..&lng=..&radius=.. query params.
 */
export default function GeolocationFilter({
  value,
  onChange,
  className,
}: GeolocationFilterProps) {
  const [latText, setLatText] = useState(
    value.latitude !== null ? String(value.latitude) : ""
  );
  const [lngText, setLngText] = useState(
    value.longitude !== null ? String(value.longitude) : ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = value.latitude !== null && value.longitude !== null;

  const handleUseCurrentLocation = () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatText(lat.toFixed(6));
        setLngText(lng.toFixed(6));
        onChange({ latitude: lat, longitude: lng, radiusKm: value.radiusKm || DEFAULT_RADIUS_KM });
        setBusy(false);
      },
      (err) => {
        setBusy(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission denied. Use the manual coordinates field instead.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Location unavailable. Try manual coordinates.");
        } else if (err.code === err.TIMEOUT) {
          setError("Location request timed out.");
        } else {
          setError("Could not get your location.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleApplyManual = () => {
    setError(null);
    const lat = parseFloat(latText);
    const lng = parseFloat(lngText);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError("Latitude must be a number between -90 and 90.");
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError("Longitude must be a number between -180 and 180.");
      return;
    }
    onChange({ latitude: lat, longitude: lng, radiusKm: value.radiusKm || DEFAULT_RADIUS_KM });
  };

  const handleClear = () => {
    setLatText("");
    setLngText("");
    setError(null);
    onChange({ latitude: null, longitude: null, radiusKm: value.radiusKm });
  };

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-4 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Search near a point</h3>
        {isActive && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-medium text-gray-500 hover:text-[#EB4D4B]"
          >
            Clear
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={busy}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#EB4D4B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#dc2626] disabled:opacity-60"
      >
        {busy ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
        {busy ? "Getting your location..." : "Use My Current Location"}
      </button>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Latitude</label>
          <input
            type="text"
            inputMode="decimal"
            value={latText}
            onChange={(e) => setLatText(e.target.value)}
            placeholder="e.g. 3.1390"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Longitude</label>
          <input
            type="text"
            inputMode="decimal"
            value={lngText}
            onChange={(e) => setLngText(e.target.value)}
            placeholder="e.g. 101.6869"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleApplyManual}
        disabled={!latText.trim() || !lngText.trim()}
        className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        Apply manual coordinates
      </button>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Radius (km)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() =>
                onChange({
                  latitude: value.latitude,
                  longitude: value.longitude,
                  radiusKm: r,
                })
              }
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                (value.radiusKm || DEFAULT_RADIUS_KM) === r
                  ? "bg-[#EB4D4B] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {error}
        </p>
      )}

      {isActive && !error && (
        <p className="mt-3 text-xs text-gray-500">
          Filtering venues within {value.radiusKm || DEFAULT_RADIUS_KM} km of{" "}
          <span className="font-mono">
            {value.latitude!.toFixed(4)}, {value.longitude!.toFixed(4)}
          </span>
        </p>
      )}
    </div>
  );
}
