import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EB4D4B] text-lg font-bold text-white">
          EV
        </span>
        <h1 className="mt-6 text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-3 text-lg font-semibold text-gray-700">Page Not Found</p>
        <p className="mt-2 text-sm text-gray-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-colors hover:bg-[#dc2626]"
          >
            Back to Home
          </Link>
          <Link
            href="/#venues"
            className="rounded-xl border-2 border-[#EB4D4B] px-6 py-3 text-sm font-bold text-[#EB4D4B] transition-colors hover:bg-[#EB4D4B]/5"
          >
            Browse Venues
          </Link>
        </div>
      </div>
    </div>
  );
}
