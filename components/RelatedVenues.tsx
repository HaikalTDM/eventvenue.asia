import type { Venue } from "@/lib/types";
import VenueCard from "@/components/VenueCard";

interface RelatedVenuesProps {
  venues: Venue[];
}

export default function RelatedVenues({ venues }: RelatedVenuesProps) {
  return (
    <section className="border-t border-gray-200 bg-white py-16 lg:py-24">
      <div className="container-custom">
        <h2 className="text-2xl font-bold text-gray-900">Similar Venues</h2>
        <p className="mt-2 text-gray-500">
          Explore more spaces you might like.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </div>
    </section>
  );
}
