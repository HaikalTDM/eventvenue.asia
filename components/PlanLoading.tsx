"use client";

interface PlanLoadingProps {
  currentStep: number;
}

const STEPS = [
  "Analyzing your request...",
  "Searching venues...",
  "Matching services...",
  "Building your plan...",
];

export default function PlanLoading({ currentStep }: PlanLoadingProps) {
  const step = Math.min(currentStep, STEPS.length - 1);

  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EB4D4B]/10">
          <svg className="h-8 w-8 text-[#EB4D4B] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <div className="mt-5 space-y-3">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center justify-center gap-2.5">
              {i < step ? (
                <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : i === step ? (
                <svg className="h-5 w-5 text-[#EB4D4B] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  i <= step ? "text-gray-900 font-medium" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
