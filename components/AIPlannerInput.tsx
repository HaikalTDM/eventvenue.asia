"use client";

import { useState } from "react";

interface AIPlannerInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  "Wedding for 300 guests, halal catering, photography, RM50K budget",
  "Corporate product launch in Singapore, 100 pax, AV system, bar service",
  "Small birthday party for 30 people, outdoor garden, RM5K budget",
];

export default function AIPlannerInput({ onSubmit, isLoading }: AIPlannerInputProps) {
  const [prompt, setPrompt] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (trimmed.length > 0 && !isLoading) {
      onSubmit(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const cycleExample = () => {
    setExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EB4D4B]/10">
            <svg className="h-5 w-5 text-[#EB4D4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">EventVenue Smart Planner</span>
        </div>

        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`e.g. ${EXAMPLE_PROMPTS[exampleIndex]}...`}
            rows={3}
            maxLength={500}
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm leading-relaxed text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20 disabled:opacity-50"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-gray-400">{prompt.length}/500</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={cycleExample}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Try: &ldquo;{EXAMPLE_PROMPTS[exampleIndex]}&rdquo;
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={prompt.trim().length === 0 || isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] hover:shadow-lg hover:shadow-[#EB4D4B]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#EB4D4B]"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Planning your event...
              </>
            ) : (
              <>
                Plan My Event
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
