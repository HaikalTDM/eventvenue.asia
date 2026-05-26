export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Search & Discover",
      description:
        "Browse curated event venues across Southeast Asia with verified halal options, transparent pricing, and real reviews.",
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      step: "02",
      title: "Compare & Book",
      description:
        "Shortlist venues, check availability, and book instantly with our secure payment and contract workflow.",
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
        </svg>
      ),
    },
    {
      step: "03",
      title: "Host With Confidence",
      description:
        "Arrive at your verified venue with everything confirmed. Enjoy dedicated support before, during, and after your event.",
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="border-t border-gray-200 bg-white py-16 lg:py-24">
      <div className="container-custom">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            How EventVenue.Asia Works
          </h2>
          <p className="mt-3 text-gray-500">
            From discovery to day-of, we make booking the perfect venue effortless.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.step}
              className="relative rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:border-gray-200 hover:bg-white hover:shadow-lg hover:shadow-gray-100"
            >
              <div className="mb-1 inline-flex items-center justify-center rounded-xl bg-[#EB4D4B]/10 p-3 text-[#EB4D4B]">
                {step.icon}
              </div>
              <span className="absolute right-6 top-6 text-5xl font-black text-gray-100">
                {step.step}
              </span>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
