import type { Venue } from "@/lib/types";
import Image from "next/image";

interface VenueOverviewProps {
  venue: Venue;
}

export default function VenueOverview({ venue }: VenueOverviewProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900">About This Venue</h2>
      <p className="mt-3 leading-relaxed text-gray-600">{venue.description}</p>

      {/* Specs */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Hourly Rate" value={`${venue.currency} ${venue.pricePerHour}`} />
        <StatCard label="Max Capacity" value={venue.capacity.toLocaleString()} />
        <StatCard label="Rating" value={`${venue.rating} / 5.0`} />
        <StatCard label="Reviews" value={`${venue.reviewCount}+`} />
      </div>

      {/* Events */}
      <div className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Suitable For
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {venue.eventTypes.map((type) => (
            <span
              key={type}
              className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Host */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Hosted By
        </h3>
        <div className="mt-4 flex items-center gap-4">
          {venue.hostAvatar ? (
            <Image
              src={venue.hostAvatar}
              alt={venue.hostName}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EB4D4B] text-lg font-bold text-white">
              {venue.hostName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}
          <div>
            <p className="text-base font-bold text-gray-900">{venue.hostName}</p>
            <div className="mt-0.5 flex items-center gap-3 text-sm text-gray-500">
              <span>
                {venue.hostResponseRate}% response rate
              </span>
              <span className="h-3 w-px bg-gray-300" />
              <span>{venue.hostResponseTime}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-400">{label}</p>
    </div>
  );
}
