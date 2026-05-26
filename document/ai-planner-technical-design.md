# AI Smart Planner — Technical Design Document

> **Project:** EventVenue.Asia | **Feature:** Natural Language Event Planner  
> **Version:** 1.0 | **Date:** 2026-05-25 | **PRD Ref:** §3.1 AI Features (Phase 3)

---

## 1. Feature Overview

A conversational AI-driven planning tool embedded on the customer homepage. Users type a natural language prompt describing their event (e.g. *"I want to plan a wedding for at least 300 guests, including halal catering and photography, with a maximum budget of RM50,000"*) and the system returns a structured, bookable plan with venue + service bundle recommendations, cost breakdown, and status indicators.

### 1.1 User Stories

| # | As a... | I want to... | So that I can... |
|---|---------|-------------|------------------|
| US-01 | Customer | Type my event requirements in plain language | Avoid filling out multiple filter fields |
| US-02 | Customer | Receive a bundled plan (venue + services) with pricing | Understand total cost instantly |
| US-03 | Customer | See which items match my budget and which don't | Make informed trade-off decisions |
| US-04 | Customer | Refine the plan through conversation or prompt edits | Iterate without starting over |
| US-05 | Customer | Save a generated plan or share it | Review later or get input from others |
| US-06 | Customer | Convert plan items into actual inquiries with one click | Reduce booking friction |

### 1.2 Example Inputs & Expected Outputs

| Input | Extracted Parameters | Expected Result |
|-------|---------------------|-----------------|
| *"Wedding for 300 guests, halal catering, under RM50K"* | `eventType: Wedding`, `guestCount: 300`, `halal: true`, `services: [catering]`, `budget: 50000` | 2-3 venue options fitting capacity + catering service packages, total ≤ RM50K |
| *"Corporate product launch in Singapore for 100 pax with AV system, bar service"* | `eventType: Launch`, `guestCount: 100`, `location: Singapore`, `amenities: [AV, bar]`, `services: []` | Singapore venues including Luminous Loft, no services bundled |
| *"Small birthday party for 30 people, outdoor garden, RM5K budget"* | `eventType: Birthday`, `guestCount: 30`, `amenities: [garden]`, `budget: 5000` | Glasshouse PJ, Bayview Terrace — flag budget constraints |
| *"I need a DJ and photographer for my wedding on June 15"* | `eventType: Wedding`, `eventDate: 2026-06-15`, `services: [dj, photography]` | Service-only results (venues excluded) |

---

## 2. User Interface Design

### 2.1 Homepage Integration

The AI Smart Planner replaces (or surfaces as a toggle alongside) the existing search bar in `HeroSearch.tsx`. Two entry modes:

```
┌──────────────────────────────────────────────────────────┐
│  [Search Filters]  ◄─── Toggle ───►  [AI Smart Planner]  │
└──────────────────────────────────────────────────────────┘
```

**Mode A — Floating Prompt Bar (replaces current search bar grid)**

```
┌─────────────────────────────────────────────────────────┐
│  🪄  Describe your event...                              │
│  ┌───────────────────────────────────────────────────┐   │
│  │  Plan a wedding for 300 guests, halal catering,   │   │
│  │  photography, RM50K budget...                     │░░░│
│  └───────────────────────────────────────────────────┘   │
│  [ Generate Plan → ]             1 example prompt below  │
│    ↑ free-text textarea, grows to 4 lines max            │
│    "Try: Wedding reception with halal food, DJ,          │
│          200 guests, KL area, under RM30K"               │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Results View (Plan Display)

Below the prompt bar, after generation:

```
┌─────────────────────────────────────────────────────────┐
│  🎯 Your Event Plan         [Edit Prompt] [Save Plan]    │
│  ─────────────────────────────────────────────────────── │
│  Extract: Wedding •  300 guests •  Halal •  ≤ RM50,000  │
│           ☰ Catering   ☰ Photography                    │
│                                                          │
│  ┌─ Budget Summary ──────────────────────────────────┐   │
│  │  Total estimate: RM 46,800                          │   │
│  │  ██████████████████████░░░░░  93.6% of budget      │   │
│  │  Breakdown: Venue RM24k | Catering RM18k | Photo..  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Recommended Venue (Best Match) ──────────────────┐   │
│  │  🏆 Best  ┌──────────────────────────────────────┐ │   │
│  │           │  Grand Ballroom at The Majestic KL    │ │   │
│  │           │  ★ 4.9 (128) · 500 cap · RM 450/hr   │ │   │
│  │           │  ✅ Halal Certified  ✅ Stage  ✅ AV  │ │   │
│  │           │  [View Details]  [Send Inquiry]       │ │   │
│  │           └──────────────────────────────────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐                        │   │
│  │  │ Skyline   │ │ Heritage │  (2 more matches)     │   │
│  │  │ Rooftop   │ │ Hall JB  │                        │   │
│  │  │ ★4.8 200p │ │ ★4.5 300p│                        │   │
│  │  └──────────┘ └──────────┘                        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Recommended Services ────────────────────────────┐   │
│  │  🍽 Hassan Premium Catering - Platinum (RM18,000)  │   │
│  │     Rating 4.8 · JAKIM Certified · up to 500 pax  │   │
│  │     [View Details]  [Send Inquiry]                 │   │
│  │                                                     │   │
│  │  📷 Lisa Creative Photography - Premium (RM6,000)  │   │
│  │     Rating 4.9 · Same-day edit · 3 photographers   │   │
│  │     [View Details]  [Send Inquiry]                 │   │
│  │                                                     │   │
│  │  + Add services: [🎵 DJ] [🎬 Video] [💄 Makeup]    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  [⚡ Send All Inquiries]  ← bulk action                 │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Refinement Flow

```
User clicks "Edit Prompt" → Prompt bar becomes editable
                        → User modifies text
                        → Re-generates plan (debounced, 800ms)

OR: Inline refinement chips below extract bar:
     [Guest Count: 300 ▼] [Location: KL ▼] [Budget: RM50,000 ✎]
     Clicking a chip opens an inline dropdown/input to adjust.
     Changing a chip triggers re-recommendation.
```

### 2.4 Edge States

| State | UI |
|-------|-----|
| **No match found** | "We couldn't find venues matching all your requirements. Try adjusting guest count or budget. Here are the closest matches:" → show top-3 relaxed |
| **Over-budget** | Highlight items in red with badge "Over budget" + "See budget-friendly alternatives" link |
| **No services match** | Show "No catering providers found in this area" with suggestion: "Try expanding location to Klang Valley" |
| **Empty prompt** | Show 3 rotating example prompts as placeholder text, "Generate Plan" button disabled |
| **Loading** | Animated typing indicator (brand-colored dots) in the results area with step labels: "Analyzing your request..." → "Searching venues..." → "Matching services..." → "Building your plan..." |
| **Error** | "Something went wrong. Please try again or use the manual search filters below." + Retry button |
| **Incomplete extraction** | Yellow info banner: "We understood most of your request. [Budget] was not specified — showing best-value options." |

---

## 3. NLP Extraction Logic

### 3.1 Architecture: LLM-Powered Structured Extraction

**Phase A (MVP):** Use a single LLM call for extraction. No custom NLP pipeline needed for launch.

**Phase B (Optimization):** Cache extraction results keyed by normalized query hash. Add hybrid fallback: regex + keyword extraction for common patterns when LLM is unavailable.

### 3.2 Extraction Schema

The LLM is prompted to return a structured JSON object. The defined TypeScript type:

```typescript
type PlanExtraction = {
  eventType: "wedding" | "corporate" | "private_party" | "birthday" | "launch" | "seminar" | null;
  guestCount: { min: number; max: number } | null;
  location: string | null;         // city/region name
  budget: { amount: number; currency: string } | null;
  halalRequired: boolean;
  services: ServiceCategory[];     // catering, photography, videography, decoration, dj_entertainment, makeup, planning
  amenities: string[];             // WiFi, AV System, Stage, Garden, Parking, etc.
  preferredDate: string | null;    // ISO date
  duration: { startTime: string; endTime: string } | null;
  specialNotes: string;            // anything not captured above
  confidence: {
    eventType: number;   // 0.0–1.0
    guestCount: number;
    location: number;
    budget: number;
    overall: number;
  };
};
```

### 3.3 LLM Prompt Design

```
System: You are an event planning extraction engine. Given a user's
natural language description of an event they want to plan, extract
the structured parameters.

Rules:
- eventType: map to one of [wedding, corporate, private_party, 
  birthday, launch, seminar]. Infer from keywords (e.g., "product 
  launch" → launch, "annual dinner" → corporate, "birthday bash" 
  → birthday). Return null if unclear.
- guestCount: parse min/max. "at least 300" → {min:300}. "50-100" 
  → {min:50,max:100}. "around 200" → {min:180,max:220}.
- location: extract city or region (KL, Penang, Singapore, etc). 
  Return null if not specified.
- budget: extract max budget amount and currency. "under RM50K" 
  → {amount:50000, currency:"RM"}. "S$10,000" → {amount:10000, 
  currency:"S$"}.
- halalRequired: true if "halal", "Muslim-friendly", "JAKIM", 
  "MUI", "MUIS" mentioned. Default: false.
- services: map to categories. "catering/food" → catering, 
  "photographer/photo" → photography, "DJ/music" → dj_entertainment,
  "decoration/decor" → decoration, "videography/video" → videography,
  "makeup/styling" → makeup, "planner/coordinator" → planning.
- amenities: map to known list [WiFi, AV System, Catering, 
  Free Parking, Stage, Dressing Room, Bar Service, Valet Parking, 
  Garden, Outdoor Lighting]. "projector/screen" → AV System,
  "parking" → Free Parking, "stage" → Stage, "garden/outdoor" 
  → Garden.
- preferredDate: parse date references. "June 15" → 2026-06-15.
  "next month" → currentDate + 1 month. Return null if not specified.
- confidence: score 0.0-1.0 per field indicating how confident you
  are in the extraction.
- specialNotes: capture ANY requirement that doesn't fit the fields
  above (e.g., "need wheelchair access", "prefer sunset ceremony",
  "Chinese vegetarian banquet").

Respond ONLY with valid JSON. No markdown, no explanation.

User: {userInput}
```

### 3.4 Normalization & Mapping Layer

After LLM extraction, apply a post-processing normalization layer:

```typescript
function normalizeExtraction(raw: PlanExtraction): NormalizedPlan {
  return {
    eventType: mapEventType(raw.eventType),
    guestCount: normalizeGuestCount(raw.guestCount),
    location: resolveLocation(raw.location),    // "KL" → "Kuala Lumpur, Malaysia"
    budget: raw.budget,
    halalRequired: raw.halalRequired,
    serviceCategories: deduplicateServices(raw.services),
    amenityFilters: normalizeAmenities(raw.amenities),
    preferredDate: validateDate(raw.preferredDate),
  };
}
```

**Key mappings:**

| Raw Extraction | Normalized Value | Data Model Field |
|---------------|-----------------|------------------|
| `"wedding"` | `"Wedding"` | `Venue.eventTypes` / `Service.eventTypes` |
| `"KL"`, `"kuala lumpur"`, `"KLCC"` | `"Kuala Lumpur, Malaysia"` | `Venue.location` |
| `"under RM50K"` | `{amount:50000, currency:"RM"}` | Budget ceiling filter |
| `["catering", "photo"]` | `["catering", "photography"]` | `ServiceCategory` |
| `["projector", "big screen"]` | `["WiFi", "AV System"]` | `Venue.amenities` |

### 3.5 Fallback: Regex/Keyword Hybrid (No LLM Needed)

When LLM is unavailable (rate limited, API down), use a regex pipeline:

```typescript
const PATTERNS = {
  guestCount: /(\d+)\s*(?:\+|\s*(?:guests?|pax|people|attendees|persons))/i,
  budget: /(?:under|max|budget|up to)\s*(?:RM|MYR|S\$|THB|IDR)\s*(\d[\d,]*[kK]?)/i,
  halal: /\b(halal|muslim.friendly|jakim|mui|muis)\b/i,
  eventTypes: {
    wedding: /\b(wedding|nikah|akad|reception)\b/i,
    corporate: /\b(corporate|company|gala|dinner|townhall|conference)\b/i,
    birthday: /\b(birthday|bday)\b/i,
    launch: /\b(launch|product\s+launch|unveiling)\b/i,
    seminar: /\b(seminar|workshop|training|conference)\b/i,
    party: /\b(party|celebration|gathering)\b/i,
  },
  services: {
    catering: /\b(catering|food|cuisine|menu|buffet|meal)\b/i,
    photography: /\b(photographer|photo|pictures|images)\b/i,
    videography: /\b(videographer|video|film|recording)\b/i,
    dj_entertainment: /\b(dj|music|band|entertainment|mc)\b/i,
    decoration: /\b(decor|decoration|flower|setup|design)\b/i,
    makeup: /\b(makeup|make.up|styling|hair|grooming)\b/i,
    planning: /\b(planner|coordinator|organiz)\b/i,
  },
};
```

This fallback provides degraded but functional extraction when the LLM is unavailable. Results are flagged with `source: "regex"` vs `source: "llm"` for observability.

---

## 4. Backend Recommendation Engine

### 4.1 Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Frontend   │────▶│   API Route  │────▶│  Recommendation   │
│  (Next.js)   │     │  /api/plan   │     │     Engine        │
│              │◀────│              │◀────│                   │
└──────────────┘     └──────────────┘     └────────┬─────────┘
                                                   │
                          ┌────────────────────────┼──────────────┐
                          │  Scoring & Ranking     │  Data Sources │
                          │  ┌───────────────┐     │               │
                          │  │ Venue Scorer   │────▶│  mockVenues[] │
                          │  │ Service Scorer │────▶│  mockServices[]│
                          │  │ Price Estimator│     │  mockVendors[] │
                          │  └───────────────┘     └───────────────┘
                          └────────────────────────────────────────┘
```

### 4.2 API Design

**Endpoint:** `POST /api/plan`

```typescript
// Request
POST /api/plan
Content-Type: application/json

{
  "prompt": "Wedding for 300 guests, halal catering, photography, RM50K budget",
  "refinements": {                          // optional — from inline chip edits
    "guestCount": { "min": 300 },
    "location": "Kuala Lumpur, Malaysia",
    "budget": { "amount": 50000, "currency": "RM" }
  }
}

// Response (200)
{
  "extraction": {
    "eventType": "Wedding",
    "guestCount": { "min": 300, "max": null },
    "location": null,
    "budget": { "amount": 50000, "currency": "RM" },
    "halalRequired": true,
    "services": ["catering", "photography"],
    "amenities": [],
    "preferredDate": null,
    "specialNotes": "",
    "confidence": { "eventType": 0.95, "guestCount": 0.90, ... }
  },
  "plan": {
    "totalEstimate": 46800,
    "currency": "RM",
    "budgetUtilization": 93.6,              // percentage
    "venues": [
      {
        "venue": { /* full Venue object */ },
        "score": 94.2,
        "matchReasons": [
          "Capacity (500) meets your 300-guest requirement",
          "JAKIM halal certified",
          "Supports Wedding events"
        ],
        "estimatedCost": 22800,             // venue rental estimate
        "isBestMatch": true
      },
      // ... up to 5
    ],
    "serviceRecommendations": {
      "catering": [
        {
          "service": { /* full Service object */ },
          "package": { /* best-matching package */ },
          "score": 97.5,
          "matchReasons": [
            "JAKIM halal certified catering",
            "Serves up to 500 guests (Platinum)"
          ],
          "estimatedCost": 18000
        }
      ],
      "photography": [
        {
          "service": { /* full Service object */ },
          "package": { /* best-matching package */ },
          "score": 85.0,
          "matchReasons": [
            "Specializes in Wedding photography",
            "Same-day edit available"
          ],
          "estimatedCost": 6000
        }
      ]
    },
    "warnings": [],                         // e.g., "No DJ services found in your area"
    "budgetGaps": []                        // items that would exceed budget
  },
  "ambiguities": [                          // what the model is unsure about
    { "field": "location", "message": "Location not specified. Showing all regions." }
  ]
}
```

### 4.3 Scoring Algorithm

#### 4.3.1 Venue Scoring

Each venue receives a score (0–100) based on weighted criteria:

```
Score = Σ (weightᵢ × match_factorᵢ)

Weights:
  capacityFit:      0.30   — how well guest count fits capacity
  halalMatch:       0.20   — halal requirement match (binary)
  eventTypeMatch:   0.15   — venue supports the event type
  amenityCoverage:  0.15   — percentage of requested amenities present
  locationMatch:    0.10   — location match quality
  dateAvailable:    0.05   — preferred date is not blocked
  qualityScore:     0.05   — rating × reviewCount factor
```

**Capacity Fit Formula:**

```typescript
function capacityScore(venueCapacity: number, guestMin: number, guestMax: number): number {
  const target = guestMax ?? guestMin * 1.1;
  if (venueCapacity < guestMin) return 0;                          // too small
  if (venueCapacity >= guestMin && venueCapacity <= target) return 1.0;  // perfect fit
  const ratio = target / venueCapacity;
  return Math.max(0.3, ratio);                                     // bigger is acceptable
}
```

#### 4.3.2 Service Scoring

```
Score = Σ (weightᵢ × match_factorᵢ)

Weights:
  categoryMatch:    0.35   — service matches requested category
  halalCompliance:  0.25   — halal cert if required
  capacityFit:      0.20   — package accommodates guest count
  qualityScore:     0.10   — rating × reviewCount
  priceFit:         0.10   — fits within remaining budget after venue
```

#### 4.3.3 Budget Allocation & Optimization

1. **Venue-first allocation:** Estimate venue cost as `avgHourlyRate × 6 hours × 1.1 buffer`
2. **Service allocation:** For each requested service category, select the package that: fits the guest count, matches halal requirement, and minimizes `(venueCost + serviceCosts) − budget`
3. **Total:** `totalEstimate = venueCost + Σ(all selected service packages)`
4. **Budget utilization:** `(totalEstimate / budget) × 100`
5. **Over-budget handling:** If total exceeds budget, mark cheapest service packages as "Over budget" with alternatives

#### 4.3.4 Match Reason Generation

Each match reason is a human-readable string generated deterministically from the scoring factors:

```typescript
function generateMatchReasons(venue: Venue, extraction: PlanExtraction): string[] {
  const reasons: string[] = [];
  if (venue.capacity >= extraction.guestCount?.min)
    reasons.push(`Capacity (${venue.capacity}) meets your ${extraction.guestCount.min}-guest requirement`);
  if (extraction.halalRequired && venue.halalVerified)
    reasons.push(`JAKIM halal certified`);
  if (extraction.eventType && venue.eventTypes.includes(extraction.eventType))
    reasons.push(`Supports ${extraction.eventType} events`);
  // ... more
  return reasons;
}
```

### 4.4 Ranking & Sorting

1. Calculate individual scores for venues and services
2. **Primary sort:** Best overall plan — combination with highest `(venueScore × 0.6 + avgServiceScore × 0.4)` and within budget
3. **Secondary sort:** Price ascending (among similar-scored plans)
4. **Deduplication:** Same venue cannot appear in multiple plan variants
5. **Diversity:** Ensure plan variants differ by at least 20% in total price or by location region
6. **Return top 3 plan variants** for display

### 4.5 Phase B Enhancements (with Real Backend)

1. **Real-time availability check** — query DB for blocked dates instead of `mockVenues.blockedDates`
2. **Price aggregation caching** — pre-calculate venue+service bundles for common patterns
3. **Collaborative filtering** — boost venues/services with high conversion rate for similar plans
4. **Location proximity** — boost services that have overlapping service areas with the venue's city
5. **Vendor response rate boost** — favor vendors with >90% response rate
6. **Seasonal pricing** — adjust estimates based on peak/off-peak periods

---

## 5. Implementation Phases

### 5.1 Phase M1: Mock LLM + Mock Engine (Weeks 1–2)

**Goal:** Working UI + mocked backend. No LLM integration yet.

| Task | Details |
|------|---------|
| Create `AIPlannerInput` component | Textarea with typing animation, placeholder cycling, character count, send button |
| Create `PlanResults` component | Card-based layout, budget summary bar, venue carousel, service cards |
| Create `PlanExtractionChips` component | Inline editable chips showing extracted params |
| Define types in `lib/types.ts` | `PlanExtraction`, `NormalizedPlan`, `PlanResult`, `MatchReason` |
| Create `lib/plan-engine.ts` | Mock recommendation engine using hardcoded logic (keyword → mockVenues filter) |
| Create API route `app/api/plan/route.ts` | Mock API: parse prompt with regex, call engine, return mock response |
| Update `app/page.tsx` | Add toggle between search bar and AI planner |
| Add loading/empty/error states | All edge states from §2.4 |

### 5.2 Phase M2: LLM Integration (Week 3)

| Task | Details |
|------|---------|
| Create `lib/nlp-extractor.ts` | Prompt construction, API call, response parsing, normalization layer |
| Integrate OpenRouter or Anthropic API | Environment variable `AI_API_KEY`, provider abstraction |
| Add regex fallback | `lib/nlp-fallback.ts` — patterns from §3.5 |
| Create `lib/normalize.ts` | Location mapping, event type mapping, guest count normalization |
| Connect extraction → engine | API route calls extractor → normalizer → recommendation engine |
| Add caching layer | Hash prompt → cache extraction results (in-memory for MVP, Redis for prod) |

### 5.3 Phase M3: Polish & Production (Week 4)

| Task | Details |
|------|---------|
| Add "Save Plan" | Save to localStorage under user account |
| Add "Share Plan" | Generate a shareable link with plan ID |
| Add "Send All Inquiries" bulk action | Create inquiries for all selected venue + service items |
| Add analytics tracking | Track: prompt submitted, plan generated, items clicked, inquiries sent |
| Rate limiting | 5 requests/minute per user for LLM endpoint |
| A/B test setup | Feature flag to show old search vs AI planner |
| Mobile responsiveness | Column stack for plan cards, full-width prompt on mobile |

---

## 6. Component Tree

```
app/page.tsx (HomePage)
├── StickyNav
├── main
│   ├── HeroSection (new wrapper — combines old HeroSearch + new AIPlanner)
│   │   ├── SearchModeToggle          (tabs: "Filters" | "AI Planner")
│   │   ├── [if Filters mode]
│   │   │   └── HeroSearch            (existing — unchanged)
│   │   └── [if AI Planner mode]
│   │       ├── AIPlannerInput         (prompt textarea + Generate button)
│   │       ├── PlanExtractionChips    (editable extracted params)
│   │       ├── PlanLoading            (animated loading states)
│   │       ├── PlanResults
│   │       │   ├── BudgetSummaryBar
│   │       │   ├── VenueRecommendationCard (×3-5)
│   │       │   ├── ServiceRecommendationCard (per category)
│   │       │   └── PlanActions        (Save, Share, Send All Inquiries)
│   │       └── PlanEmptyState
│   ├── VenueGridWithFilters           (existing — shown below if no plan active)
│   └── HowItWorks                     (existing)
└── Footer
```

---

## 7. Data Flow Diagram

```
User types prompt
       │
       ▼
AIPlannerInput [client]
       │ debounce 800ms or click "Generate"
       ▼
POST /api/plan { prompt, refinements }
       │
       ▼
API Route Handler [server]
       │
       ├──▶ NLP Extractor (LLM or Fallback)
       │       │
       │       ▼
       │    PlanExtraction JSON
       │       │
       │       ▼
       │    Normalization Layer
       │       │
       │       ▼
       │    NormalizedPlan
       │
       ├──▶ Recommendation Engine
       │       │
       │       ├──▶ Venue Scorer  ──▶ mockVenues[]  → ranked venues
       │       ├──▶ Service Scorer ──▶ mockServices[] → ranked services
       │       └──▶ Budget Allocator → calculate totals, flag gaps
       │
       └──▶ Response Builder
              │
              ▼
         PlanResponse JSON
              │
              ▼
         PlanResults [client render]
```

---

## 8. Open Questions & Decisions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| Q1 | Which LLM provider? | OpenRouter (multi-model), Anthropic (Claude), OpenAI (GPT-4o) | **OpenRouter** — no vendor lock-in, cheaper for simple extraction, easy to swap later |
| Q2 | Stream or batch response? | Stream tokens to UI for "live" feel, or batch and return at once | **Batch** for M1 — simpler. Add streaming in M3 |
| Q3 | Should the AI planner replace or complement the search bar? | Replace, toggle, or run as a secondary entry point | **Toggle** — power users keep filters, new users discover AI. A/B test later |
| Q4 | Where does plan state live? | Component state only, URL query params, or database | **Component + localStorage** for M1. DB when backend exists |
| Q5 | Should user be authenticated to use the planner? | Required, or open | **Open** — reduces friction. Save/share requires auth |
| Q6 | Multi-language support for NLP? | English only, or Bahasa Melayu + Chinese | **English only** for M1. Malay support added with backend in Phase 2 |

---

## 9. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM halts on malformed prompts | Medium | High | Regex fallback + prompt validation + rate limiting |
| LLM extraction hallucinates parameters | Medium | Medium | Confidence thresholds — if overall < 0.5, ask user to clarify |
| Slow LLM response (>3 seconds) | High | Low | Loading animation with progress steps, 10s timeout with fallback |
| Budget calculation inaccurate | High | Medium | Label as "Estimate" not "Quote", use venue's actual hourly rate × 6 |
| No matching venues found | Medium | Medium | Relax constraints algorithmically (drop amenities, expand location) |
| API costs at scale | Low (for M1) | Medium | Cache promt→extraction, use cheaper model for extraction, rate limit |

---

## 10. Appendix: Sample Engine Logic (Pseudocode)

```typescript
// lib/plan-engine.ts
export function generatePlan(
  extraction: NormalizedPlan,
  venues: Venue[],
  services: Service[]
): PlanResult {
  const { guestCount, budget, halalRequired, eventType, amenities, serviceCategories, location, preferredDate } = extraction;

  // 1. Filter venues
  let candidateVenues = venues.filter(v => {
    if (location && !v.location.includes(location)) return false;
    if (guestCount && v.capacity < guestCount.min) return false;
    if (halalRequired && !v.halalVerified) return false;
    if (eventType && !v.eventTypes.includes(eventType)) return false;
    if (preferredDate && v.blockedDates.includes(preferredDate)) return false;
    return true;
  });

  // 2. Score venues
  const scoredVenues = candidateVenues.map(v => ({
    venue: v,
    score: computeVenueScore(v, extraction),
    estimatedCost: estimateVenueCost(v),  // pricePerHour × 6 × 1.1
  })).sort((a, b) => b.score - a.score);

  // 3. Filter + score services
  const serviceRecs: Record<string, ScoredService[]> = {};
  for (const cat of serviceCategories) {
    let candidates = services.filter(s => s.category === cat);
    if (location) candidates = candidates.filter(s => s.location.includes(location));
    if (eventType) candidates = candidates.filter(s => s.eventTypes.includes(eventType));
    if (halalRequired) candidates = candidates.filter(s => s.halalCertified);
    // If no candidates, try without location filter
    if (candidates.length === 0 && location) {
      candidates = services.filter(s => s.category === cat && s.eventTypes.includes(eventType));
    }
    serviceRecs[cat] = candidates.map(s => ({
      service: s,
      package: selectBestPackage(s, guestCount, budget),
      score: computeServiceScore(s, extraction),
      estimatedCost: selectBestPackage(s, guestCount, budget)?.price ?? 0,
    })).sort((a, b) => b.score - a.score);
  }

  // 4. Build budget summary
  const topVenue = scoredVenues[0];
  const topServices = Object.values(serviceRecs).map(sr => ({ category: sr[0]?.service.category, cost: sr[0]?.estimatedCost ?? 0 }));
  const totalEstimate = (topVenue?.estimatedCost ?? 0) + topServices.reduce((sum, s) => sum + s.cost, 0);

  return {
    totalEstimate,
    currency: budget?.currency ?? "RM",
    budgetUtilization: budget ? (totalEstimate / budget.amount) * 100 : null,
    venues: scoredVenues.slice(0, 5),
    serviceRecommendations: serviceRecs,
    warnings: generateWarnings(scoredVenues, serviceRecs),
    budgetGaps: budget ? findBudgetGaps(totalEstimate, budget) : [],
  };
}
```
