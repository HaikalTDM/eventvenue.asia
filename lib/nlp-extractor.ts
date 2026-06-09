import type { PlanExtraction, ServiceCategory } from "@/lib/types";

interface ExtractionPattern {
  regex: RegExp;
  extract: (match: RegExpMatchArray, context: Partial<PlanExtraction>) => Partial<PlanExtraction>;
}

const GUEST_PATTERNS: ExtractionPattern[] = [
  {
    regex: /(\d+)\s*\+\s*(?:guests?|pax|people|attendees|persons)/i,
    extract: (m) => ({ guestCount: { min: parseInt(m[1], 10), max: 0 } }),
  },
  {
    regex: /at\s+least\s+(\d+)\s*(?:guests?|pax|people|attendees|persons)/i,
    extract: (m) => ({ guestCount: { min: parseInt(m[1], 10), max: 0 } }),
  },
  {
    regex: /(\d+)\s*-\s*(\d+)\s*(?:guests?|pax|people|attendees|persons)/i,
    extract: (m) => ({ guestCount: { min: parseInt(m[1], 10), max: parseInt(m[2], 10) } }),
  },
  {
    regex: /(?:for|of)\s+(\d+)\s*(?:guests?|pax|people|attendees|persons)/i,
    extract: (m) => ({ guestCount: { min: parseInt(m[1], 10), max: 0 } }),
  },
  {
    regex: /(\d{2,4})\s*(?:guests?|pax|people|attendees|persons)/i,
    extract: (m) => ({ guestCount: { min: parseInt(m[1], 10), max: 0 } }),
  },
];

const BUDGET_PATTERNS: ExtractionPattern[] = [
  {
    regex: /(?:under|max|budget|up\s+to)\s*(?:RM|MYR|S\$|SGD|THB|IDR|Rp)\s*(\d[\d,]*[kK]?)/i,
    extract: (m) => {
      const raw = m[1].replace(/,/g, "").replace(/k/i, "000");
      const currencyMatch = m[0].match(/RM|MYR|S\$|SGD|THB|IDR|Rp/i);
      const currency = currencyMatch
        ? currencyMatch[0].replace(/SGD/i, "S$").replace(/Rp/i, "IDR").replace(/MYR/i, "RM")
        : "RM";
      return { budget: { amount: parseInt(raw, 10), currency } };
    },
  },
  {
    regex: /(?:budget|around|approximately|about|~)\s*(?:RM|MYR|S\$|SGD|THB|IDR|Rp)\s*(\d[\d,]*[kK]?)/i,
    extract: (m) => {
      const raw = m[1].replace(/,/g, "").replace(/k/i, "000");
      const currencyMatch = m[0].match(/RM|MYR|S\$|SGD|THB|IDR|Rp/i);
      const currency = currencyMatch
        ? currencyMatch[0].replace(/SGD/i, "S$").replace(/Rp/i, "IDR").replace(/MYR/i, "RM")
        : "RM";
      return { budget: { amount: parseInt(raw, 10), currency } };
    },
  },
];

const HALAL_PATTERN = /\b(halal|muslim\s*friendly|jakim|mui|muis)\b/i;

const EVENT_TYPE_MAP: Record<string, string> = {
  wedding: "Wedding",
  nikah: "Wedding",
  akad: "Wedding",
  reception: "Wedding",
  corporate: "Corporate",
  company: "Corporate",
  gala: "Corporate",
  dinner: "Corporate",
  townhall: "Corporate",
  conference: "Corporate",
  birthday: "Birthday",
  bday: "Birthday",
  launch: "Launch",
  unveiling: "Launch",
  seminar: "Seminar",
  workshop: "Seminar",
  training: "Seminar",
  party: "Private Party",
  celebration: "Private Party",
  gathering: "Private Party",
};

const SERVICE_KEYWORD_MAP: Record<string, ServiceCategory> = {
  catering: "catering",
  food: "catering",
  cuisine: "catering",
  menu: "catering",
  buffet: "catering",
  meal: "catering",
  photographer: "photography",
  photo: "photography",
  photography: "photography",
  pictures: "photography",
  videographer: "videography",
  video: "videography",
  videography: "videography",
  film: "videography",
  dj: "dj_entertainment",
  music: "dj_entertainment",
  band: "dj_entertainment",
  entertainment: "dj_entertainment",
  mc: "dj_entertainment",
  decor: "decoration",
  decoration: "decoration",
  flower: "decoration",
  setup: "decoration",
  makeup: "makeup",
  styling: "makeup",
  hair: "makeup",
  grooming: "makeup",
  planner: "planning",
  coordinator: "planning",
  photobooth: "photobooth",
  "photo booth": "photobooth",
  selfie: "photobooth",
  "ice cream": "ice_cream",
  "ais krim": "ice_cream",
  gelato: "ice_cream",
  sundae: "ice_cream",
  florist: "florist",
  bouquet: "florist",
  "fresh flowers": "florist",
  hantaran: "florist",
  cake: "cake",
  dessert: "cake",
  pastry: "cake",
  "kek kahwin": "cake",
  transport: "transport",
  "bridal car": "transport",
  limo: "transport",
  limousine: "transport",
  chauffeur: "transport",
  emcee: "emcee",
  host: "emcee",
  compere: "emcee",
  "live band": "live_band",
  acoustic: "live_band",
  kompang: "live_band",
  orchestra: "live_band",
  lighting: "lighting",
  "sound system": "lighting",
  pa: "lighting",
  bridal: "bridal",
  gown: "bridal",
  baju: "bridal",
  "wedding dress": "bridal",
  songket: "bridal",
  henna: "henna",
  inai: "henna",
  mehndi: "henna",
};

const LOCATION_KEYWORDS: Record<string, string> = {
  "kuala lumpur": "Kuala Lumpur, Malaysia",
  kl: "Kuala Lumpur, Malaysia",
  klcc: "Kuala Lumpur, Malaysia",
  "petaling jaya": "Petaling Jaya, Selangor",
  pj: "Petaling Jaya, Selangor",
  damansara: "Petaling Jaya, Selangor",
  "johor bahru": "Johor Bahru, Malaysia",
  jb: "Johor Bahru, Malaysia",
  "johor": "Johor Bahru, Malaysia",
  penang: "Penang, Malaysia",
  "george town": "Penang, Malaysia",
  singapore: "Singapore",
  sg: "Singapore",
  bangkok: "Bangkok, Thailand",
  jakarta: "Jakarta, Indonesia",
  selangor: "Selangor, Malaysia",
};

const AMENITY_KEYWORD_MAP: Record<string, string> = {
  wifi: "WiFi",
  internet: "WiFi",
  av: "AV System",
  projector: "AV System",
  screen: "AV System",
  "sound system": "AV System",
  parking: "Free Parking",
  stage: "Stage",
  "dressing room": "Dressing Room",
  "changing room": "Dressing Room",
  bar: "Bar Service",
  "valet parking": "Valet Parking",
  valet: "Valet Parking",
  garden: "Garden",
  outdoor: "Outdoor Lighting",
  lighting: "Outdoor Lighting",
};

export function extractPlanFromPrompt(prompt: string): PlanExtraction {
  const lower = prompt.toLowerCase();
  const extraction: Partial<PlanExtraction> = {
    halalRequired: false,
    services: [],
    amenities: [],
    specialNotes: "",
    source: "regex",
  };

  const confidence: Record<string, number> = {
    eventType: 0,
    guestCount: 0,
    location: 0,
    budget: 0,
  };

  for (const pattern of GUEST_PATTERNS) {
    const match = lower.match(pattern.regex);
    if (match) {
      Object.assign(extraction, pattern.extract(match, extraction));
      confidence.guestCount = 0.85;
      break;
    }
  }

  for (const pattern of BUDGET_PATTERNS) {
    const match = lower.match(pattern.regex);
    if (match) {
      Object.assign(extraction, pattern.extract(match, extraction));
      confidence.budget = 0.9;
      break;
    }
  }

  if (HALAL_PATTERN.test(lower)) {
    extraction.halalRequired = true;
  }

  const foundEventTypes: string[] = [];
  for (const [keyword, eventType] of Object.entries(EVENT_TYPE_MAP)) {
    if (lower.includes(keyword) && !foundEventTypes.includes(eventType)) {
      foundEventTypes.push(eventType);
    }
  }
  if (foundEventTypes.length > 0) {
    extraction.eventType = foundEventTypes[0];
    confidence.eventType = 0.85;
  }

  const foundServices = new Set<ServiceCategory>();
  for (const [keyword, category] of Object.entries(SERVICE_KEYWORD_MAP)) {
    const serviceRegex = new RegExp(`\\b${keyword}\\b`, "i");
    if (serviceRegex.test(lower)) {
      foundServices.add(category);
    }
  }
  extraction.services = Array.from(foundServices);

  const foundAmenities = new Set<string>();
  for (const [keyword, amenity] of Object.entries(AMENITY_KEYWORD_MAP)) {
    // Use regex for multi-word keywords, simple includes for single-word
    const keywordRegex = new RegExp(keyword.replace(/\s+/g, "\\s+"), "i");
    if (keywordRegex.test(lower)) {
      foundAmenities.add(amenity);
    }
  }
  extraction.amenities = Array.from(foundAmenities);

  let foundLocation: string | null = null;
  for (const [keyword, location] of Object.entries(LOCATION_KEYWORDS)) {
    if (lower.includes(keyword) && !foundLocation) {
      foundLocation = location;
      confidence.location = 0.8;
      break;
    }
  }
  extraction.location = foundLocation;

  const overallConfidence = Object.values(confidence).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(confidence).filter(v => v > 0).length || 1);

  const result: PlanExtraction = {
    eventType: extraction.eventType ?? null,
    guestCount: extraction.guestCount ?? null,
    location: extraction.location ?? null,
    budget: extraction.budget ?? null,
    halalRequired: extraction.halalRequired ?? false,
    services: extraction.services ?? [],
    amenities: extraction.amenities ?? [],
    preferredDate: null,
    duration: null,
    specialNotes: extraction.specialNotes ?? "",
    confidence: {
      eventType: confidence.eventType,
      guestCount: confidence.guestCount,
      location: confidence.location,
      budget: confidence.budget,
      overall: overallConfidence || 0,
    },
    source: "regex",
  };

  return result;
}
