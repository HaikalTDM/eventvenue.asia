export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white" role="status" aria-label="Loading">
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-50 via-white to-accent-100 animate-gradient-shift opacity-60" />

      {/* Expanding rings */}
      <div className="absolute">
        <div className="h-32 w-32 rounded-full border-2 border-accent-300 animate-ring-expand" />
      </div>
      <div className="absolute">
        <div
          className="h-32 w-32 rounded-full border-2 border-accent-200 animate-ring-expand"
          style={{ animationDelay: "0.5s" }}
        />
      </div>
      <div className="absolute">
        <div
          className="h-32 w-32 rounded-full border-2 border-accent-100 animate-ring-expand"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo / Brand mark */}
        <div className="animate-scale-pulse">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg shadow-accent-200">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </div>
        </div>

        {/* Brand text */}
        <div className="animate-fade-in-up text-center" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-xl font-semibold text-gray-800 tracking-tight">
            EventVenue<span className="text-accent-500">.Asia</span>
          </h2>
        </div>

        {/* Bouncing dots */}
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full bg-accent-400 animate-dot-bounce"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full bg-accent-500 animate-dot-bounce"
            style={{ animationDelay: "0.16s" }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full bg-accent-600 animate-dot-bounce"
            style={{ animationDelay: "0.32s" }}
          />
        </div>

        {/* Subtitle */}
        <p
          className="animate-fade-in-up text-sm text-gray-400 tracking-wide opacity-0"
          style={{ animationDelay: "0.4s" }}
        >
          Discovering your perfect venue...
        </p>
      </div>
    </div>
  );
}
