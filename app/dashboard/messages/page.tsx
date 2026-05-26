"use client";

export default function MessagesPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Direct chat with vendors and group threads for your events
        </p>
      </div>

      <div className="mt-12 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-600">
          Messages coming soon
        </h3>
        <p className="mt-2 max-w-md mx-auto text-sm text-gray-400">
          Real-time chat with vendors and group threads with the rest of your
          event team will appear here once the messaging service is wired up.
          For now, vendors reach you via the contact info you provided in the
          inquiry.
        </p>
      </div>
    </div>
  );
}
