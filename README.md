# EventVenue.Asia

> The premier event venue and service marketplace for Southeast Asia.

EventVenue.Asia connects event planners with verified venues, caterers, photographers, decorators, and entertainment providers across Malaysia, Singapore, Thailand, and Indonesia. Built with Next.js 15, PostgreSQL, and an AI-powered Smart Planner, the platform streamlines the entire event-booking journey — from discovery to confirmation — with first-class support for halal-certified vendors.

---

## Overview

EventVenue.Asia is a full-stack marketplace built for the Southeast Asian event industry. The platform serves three primary audiences:

- **Customers** browse, compare, and book venues and services for weddings, corporate events, private parties, and seminars.
- **Vendors** (venue owners and service providers) manage listings, respond to inquiries, track bookings, and grow their business.
- **Administrators** verify vendors, moderate listings, and oversee platform health.

The application supports both a **mock mode** (localStorage-only, ideal for demos and offline development) and a **live mode** (full backend with PostgreSQL via Supabase, JWT authentication, and a real-time messaging layer).

---

## Key Features

### For Customers
- **Smart Search** — filter venues by location, capacity, amenities, event type, halal certification, and price range.
- **AI Smart Planner** — describe your event in natural language and receive scored venue and service recommendations with budget analysis.
- **Inquiry Pipeline** — submit inquiries, track status (`pending → accepted → approved → proceed → ongoing → completed`), and book events with confirmed vendors.
- **Wishlist & Compare** — save favorite venues and compare side-by-side.
- **Reviews & Ratings** — rate completed bookings and read verified guest reviews.

### For Vendors
- **Multi-Step Registration** — onboard with business details, service category, and document verification.
- **Listing Management** — create, edit, pause, and publish venue or service listings with photo galleries and amenities.
- **Availability Calendar** — block dates, schedule appointments, and track bookings from multiple sources (website, WhatsApp, walk-in).
- **Booking Workflow** — accept inquiries, send quotes, and manage confirmed bookings end-to-end.
- **Analytics Dashboard** — view listing performance, response rate, and revenue trends.

### For Administrators
- **Vendor Verification** — approve or reject vendor applications with document review.
- **User Management** — search, suspend, or reactivate user accounts.
- **Content Moderation** — resolve flagged listings, reviews, or messages.
- **Platform Analytics** — aggregate stats on users, vendors, listings, and bookings.

### Platform-Wide
- **Halal-First Filtering** — first-class support for JAKIM, MUIS, and MUI certification with verified document uploads.
- **Multi-Currency Support** — MYR, SGD, IDR, THB.
- **Real-Time Messaging** — direct and group conversations between customers, vendors, and service providers (Pusher Channels).
- **Mock/Live Toggle** — switch between localStorage demo data and the live API at any time via the `/kael` control panel.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 16 (hosted on Supabase) |
| ORM | Drizzle ORM |
| Authentication | JWT (jose) + bcrypt password hashing |
| Validation | Zod |
| Real-Time | Pusher Channels |
| File Storage | Cloudflare R2 (S3-compatible) |
| AI | OpenAI GPT-4o-mini (Smart Planner) |
| Email | Resend |

---

## Getting Started

### Prerequisites

- Node.js 22 LTS or higher
- npm 10+ (or pnpm/yarn)
- A PostgreSQL database — recommended: free Supabase project
- Optional: Cloudflare R2, Pusher, OpenAI, and Resend accounts for full feature parity

### Installation

```bash
# Clone the repository
git clone https://github.com/HaikalTDM/eventvenue.asia.git
cd eventvenue.asia

# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL` (Supabase pooler URL recommended for IPv4 networks):

```env
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
JWT_SECRET=<at-least-32-character-random-string>
REFRESH_TOKEN_SECRET=<at-least-32-character-random-string>
```

### Database Setup

Push the Drizzle schema to your database:

```bash
npx drizzle-kit push
```

Seed the database with demo data (1 admin, 10 vendors, 8 venues, 3 services):

```bash
npx tsx lib/db/seed.ts
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@eventvenue.asia` | `admin123` |
| Venue Vendor | `aisha@majestic-kl.com` | `password123` |
| Service Vendor | `info@hassancatering.my` | `password123` |
| Customer | _Sign up via_ `/sign-up` | _Choose your own_ |

### Switching Between Mock and Live Modes

Visit `/kael` for the developer control panel:

- **Mock** — uses localStorage, no backend required. Ideal for demos and offline work.
- **Live** — connects to the API and Supabase database for full functionality.

The selected mode persists across sessions via localStorage.

### Common Workflows

**Browse and book a venue (customer):**
1. Visit `/` and use the search bar or filters.
2. Click any venue card to view photos, amenities, reviews, and availability.
3. Click "Inquire" to submit a date and guest count.
4. Track inquiry status under `/dashboard/inquiries`.

**Onboard as a vendor:**
1. Visit `/vendor/register` and complete the four-step registration.
2. Upload verification documents.
3. Wait for admin approval.
4. After approval, create listings at `/vendor/listings/new`.

**Use the AI Smart Planner:**
1. On the homepage, switch to the "AI Planner" tab.
2. Describe your event in natural language: _"I need a halal wedding venue in KL for 200 guests next month with catering and photography, budget RM15,000."_
3. Review parsed parameters and scored recommendations with budget breakdown.

---

## Project Structure

```
eventvenue.asia/
├── app/                    Next.js App Router pages
│   ├── (auth)/            Customer auth pages
│   ├── admin/             Admin portal
│   ├── vendor/            Vendor portal
│   ├── dashboard/         Customer dashboard
│   ├── venues/            Venue browse & detail
│   ├── kael/              Developer control panel
│   └── api/v1/            REST API endpoints
├── components/            Reusable React components
├── lib/
│   ├── db/                Drizzle schema, migrations, seed
│   ├── auth/              JWT signing, middleware, role guards
│   ├── validators/        Zod schemas for API inputs
│   ├── utils/             Errors, pagination, slug helpers
│   ├── api.ts             Frontend API client
│   ├── auth.tsx           Customer auth context
│   ├── vendor-auth.tsx    Vendor auth context
│   ├── data-mode.tsx      Mock/live toggle context
│   ├── mock-data.ts       Demo venues and inquiries
│   └── plan-engine.ts     AI Smart Planner scoring
└── document/              Product requirements & design docs
```

---

## API Reference

The REST API is served at `/api/v1/*`. Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/sign-up` | Customer registration |
| `POST` | `/auth/sign-in` | Login (returns JWT) |
| `GET` | `/auth/session` | Current user |
| `GET` | `/listings` | Search and filter listings |
| `GET` | `/listings/:id` | Listing detail with photos, reviews |
| `POST` | `/listings` | Create listing (vendor) |
| `POST` | `/inquiries` | Submit booking inquiry |
| `PUT` | `/inquiries/:id/status` | Update inquiry status (vendor) |
| `POST` | `/bookings` | Confirm booking |
| `GET`/`POST`/`DELETE` | `/favorites` | Wishlist management |
| `POST` | `/reviews` | Submit a review |
| `GET` | `/admin/dashboard` | Platform statistics |

See `lib/db/schema/index.ts` for the full data model.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Apply schema changes to database |
| `npx tsx lib/db/seed.ts` | Seed database with demo data |
| `npx tsc --noEmit` | TypeScript type-check |

---

## Contributing

Contributions are welcome. To propose changes:

1. **Fork** the repository and create a feature branch from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** following the existing code style and conventions:
   - TypeScript strict mode is enabled — keep it that way.
   - Run `npx tsc --noEmit` before committing.
   - Use Zod schemas for new API input validation.
   - Match the existing service-layer pattern for new endpoints.
3. **Test** your changes against both mock and live modes when applicable.
4. **Commit** with clear, conventional messages:
   ```
   feat: add wishlist sharing
   fix: prevent double-booking on overlapping times
   docs: clarify Supabase pooler setup
   ```
5. **Open a pull request** against `master` describing your changes, motivation, and any breaking changes.

### Code of Conduct

Be respectful, constructive, and inclusive. Discussions stay focused on the technical merits of proposals.

### Reporting Issues

When reporting a bug, please include:
- Steps to reproduce
- Expected vs. actual behavior
- Browser, OS, and Node.js version
- Whether the issue occurs in mock mode, live mode, or both

---

## License

This project is currently private. License terms will be added before public release.

---

## Acknowledgments

- Demo venue imagery courtesy of [Unsplash](https://unsplash.com).
- Avatar images via [Pravatar](https://pravatar.cc).
- Built with [Next.js](https://nextjs.org), [Drizzle ORM](https://orm.drizzle.team), and [Tailwind CSS](https://tailwindcss.com).
