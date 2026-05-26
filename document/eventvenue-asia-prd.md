# EventVenue.Asia — Product Requirements Document

> **Version:** 1.0 | **Date:** 2026-05-18 | **Status:** Draft  
> **Tagline:** The AI-powered event venue marketplace for Southeast Asia

---

## 1. Problem Statement

| Who | Pain Point | Current State |
|-----|-----------|---------------|
| **Customers** | Can't compare venues easily, no pricing transparency, manual inquiry process | Weeks of Google searches, phone calls, spreadsheets |
| **Vendors** | No centralized platform, manual inquiry management, no CRM tools | Word-of-mouth, social media, ad-hoc follow-ups |
| **No Trust Layer** | Can't verify venue quality, halal compliance, or pricing accuracy | Blind bookings, inconsistent experiences |

**Solution:** A rock-solid management system first, then AI-powered features to make planning 10x faster.

---

## 2. Target Users

| Role | Who | Key Needs |
|------|-----|-----------|
| **Customer** | Individuals or corporate teams planning events | Search, compare, inquire, book venues easily |
| **Vendor** | Hall owners, hotel managers, venue operators | Digital presence, inquiry management, booking calendar, payments |
| **Admin** | EventVenue.Asia team | Verify vendors, moderate content, track analytics, manage disputes |

---

## 3. Feature Requirements

### 3.1 Customer Portal

| Feature | Description | Priority | Phase |
|---------|-------------|----------|-------|
| Account Creation | Email/phone signup, social login (Google, Apple) | 🔴 P0 | 1 |
| Search & Filter | Location, date, capacity, price, event type, amenities | 🔴 P0 | 1 |
| Venue Browsing | Grid/list view with photos, ratings, price, key details | 🔴 P0 | 1 |
| Venue Detail Page | Gallery, amenities, pricing, availability calendar, reviews, map | 🔴 P0 | 1 |
| Venue Comparison | Side-by-side compare up to 3 venues | 🔴 P0 | 1 |
| Send Inquiry | Form: date, time, guest count, special requirements | 🔴 P0 | 1 |
| Inquiry Tracking | Status: sent → viewed → responded → quoted → booked → paid | 🔴 P0 | 1 |
| Favorites | Save venues to wishlist | 🟡 P1 | 1 |
| Reviews & Ratings | Leave reviews after completed bookings (verified only) | 🟡 P1 | 2 |
| Instant Booking | Book and pay directly with instant confirmation | 🟡 P1 | 2 |
| Payment Gateway | FPX, credit card, e-wallets (GrabPay, TnG) | 🟡 P1 | 2 |
| Messaging | Real-time chat with vendors (text, image sharing) | 🟡 P1 | 2 |
| Booking Management | View, modify, cancel bookings with refund policies | 🟡 P1 | 2 |

**AI Features (Phase 3):**
- Smart Recommendations — personalized venue suggestions
- AI Inquiry Assistant — draft professional inquiry messages
- Budget Estimator — realistic cost breakdowns
- Quote Comparison — AI analyzes multiple vendor quotes
- Dynamic Pricing Insights — market rate comparisons

### 3.2 Vendor Portal

| Feature | Description | Priority | Phase |
|---------|-------------|----------|-------|
| Vendor Registration | Multi-step onboarding: business info, documents, venue details | 🔴 P0 | 1 |
| Document Verification | Upload business license, halal cert, insurance, photos | 🔴 P0 | 1 |
| Profile Builder | Edit venue info: name, description, photos, amenities, capacity, pricing | 🔴 P0 | 1 |
| Availability Calendar | Set available/blocked dates, recurring patterns | 🔴 P0 | 1 |
| Inquiry Dashboard | View all incoming inquiries with status tracking | 🔴 P0 | 1 |
| Respond to Inquiries | Reply with custom messages, attach quotes/proposals | 🔴 P0 | 1 |
| Booking Management | Accept/reject bookings, manage calendar, view history | 🔴 P0 | 1 |
| Basic Analytics | Profile views, inquiry count, response rate, conversion rate | 🟡 P1 | 1 |
| Quote Builder | Create professional quotes with line items, taxes, terms | 🟡 P1 | 2 |
| Payment Collection | Accept deposits, milestone payments, final payments | 🟡 P1 | 2 |
| Customer CRM | View customer history, tag customers, follow-up reminders | 🟡 P1 | 2 |
| Promotions | Discount codes, seasonal offers, featured listing boosts | 🟢 P2 | 2 |
| Multi-Venue Management | Manage multiple venues under one vendor account | 🟢 P2 | 2 |
| Team Members | Add staff accounts with role-based permissions | 🟢 P2 | 2 |

**AI Features (Phase 3):**
- Auto-Respond Drafts — AI generates inquiry responses
- Pricing Suggestions — market rate recommendations
- Occupancy Optimization — pricing adjustments for low-demand periods
- Review Sentiment Analysis — customer feedback insights

### 3.3 Admin Dashboard

| Feature | Description | Priority | Phase |
|---------|-------------|----------|-------|
| Vendor Approval Queue | Review and approve/reject vendor registrations | 🔴 P0 | 1 |
| User Management | View, search, edit, suspend customer and vendor accounts | 🔴 P0 | 1 |
| Venue Moderation | Edit, flag, or remove venue listings violating guidelines | 🔴 P0 | 1 |
| Platform Analytics | Total users, active venues, inquiries, bookings, revenue | 🔴 P0 | 1 |
| Category Management | Add/edit/remove event categories, venue types, amenities | 🟡 P1 | 1 |
| Featured Content | Pin venues to homepage, manage "Most Viewed" and trending | 🟡 P1 | 1 |
| Content Management | Edit guides, blog posts, FAQ, terms of service | 🟡 P1 | 1 |
| Dispute Management | Handle booking disputes, refund requests, vendor complaints | 🟡 P1 | 2 |
| Commission Management | Set and track platform commission rates per vendor/booking | 🟡 P1 | 2 |
| Report Dashboard | Export data: bookings, revenue, user growth, vendor performance | 🟢 P2 | 2 |
| Email Campaigns | Send platform-wide announcements, targeted promotions | 🟢 P2 | 2 |
| Audit Logs | Track all admin actions for compliance | 🟢 P2 | 2 |

**AI Features (Phase 3):**
- Fraud Detection — flag suspicious registrations or booking patterns
- Content Moderation — auto-flag inappropriate images or text
- Predictive Analytics — booking trend forecasts

---

## 4. Technical Architecture

### 4.1 System Overview

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Frontend** | Next.js (App Router) | SSR for SEO, unified framework, great DX |
| **Backend** | FastAPI (Python) or Node.js/Express | FastAPI for AI readiness, Express for JS ecosystem |
| **Database** | PostgreSQL | ACID compliance, relational data, proven at scale |
| **Search** | MeiliSearch → Elasticsearch | MeiliSearch for MVP, Elasticsearch for scale |
| **Cache** | Redis | Session management, rate limiting, real-time features |
| **Storage** | S3-compatible (Cloudflare R2) | Cheap CDN for venue images |
| **Auth** | NextAuth.js / JWT | Multi-role support, session management |
| **Payments** | Billplz / ToyyibPay | Malaysia-first, FPX support |
| **Hosting** | Vercel (frontend) + Railway/Render (backend) | Fast deploy, scales with usage |
| **AI** | OpenRouter / Anthropic API | Flexible, no vendor lock-in, ready for Phase 3 |

### 4.2 Data Model (Core Entities)

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| **User** | id, email, phone, password_hash, role, profile | Has one: Vendor or Customer |
| **Vendor** | id, user_id, business_name, registration_number, status, documents | Has many: Venues |
| **Venue** | id, vendor_id, name, description, location, capacity, pricing, amenities, is_halal_verified | Belongs to: Vendor |
| **Inquiry** | id, customer_id, venue_id, event_date, guest_count, message, status | Links: Customer → Venue |
| **Booking** | id, inquiry_id, customer_id, vendor_id, venue_id, event_date, total_amount, payment_status | Created from: Inquiry |
| **Review** | id, booking_id, customer_id, venue_id, rating, comment, is_verified | Created after: Completed Booking |
| **Message** | id, sender_id, receiver_id, inquiry_id, content, type, is_read | Links: Customer ↔ Vendor |

---

## 5. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Page load time (FCP) | < 2 seconds |
| **Performance** | API response time (p95) | < 500ms |
| **Performance** | Search response time | < 200ms |
| **Scalability** | Concurrent users | 10,000+ (Phase 1) |
| **Scalability** | Venue listings | 10,000+ |
| **Availability** | Uptime SLA | 99.9% |
| **Security** | Data encryption | TLS in transit, AES-256 at rest |
| **Security** | Authentication | JWT with refresh tokens, MFA optional |
| **Security** | Authorization | Role-based access control (RBAC) |
| **Compliance** | PDPA (Malaysia) | Full compliance for personal data |
| **Compliance** | Payment security | PCI-DSS compliant gateway integration |
| **Accessibility** | WCAG | 2.1 AA compliance |
| **Localization** | Languages | English (Phase 1), Bahasa Melayu (Phase 2) |
| **Localization** | Currency | MYR (RM) |

---

## 6. Phase Roadmap

### Phase 1: Foundation (Weeks 1-6)

**Goal:** MVP with core marketplace functionality

| Deliverable | Description |
|-------------|-------------|
| ✅ Vendor registration & approval workflow | Multi-step onboarding with document verification |
| ✅ Venue listing management (CRUD) | Create, edit, publish venue profiles |
| ✅ Customer search, browse, and inquiry system | Filter, compare, send inquiries |
| ✅ Admin dashboard | Approval queue, analytics, content management |
| ✅ Basic user authentication | 3 roles: customer, vendor, admin |
| ✅ Mobile-responsive design | Works on all devices |

**Outcome:** A functional marketplace where customers can discover venues and send inquiries, vendors can manage profiles and respond, and admins can moderate everything.

### Phase 2: Transactions (Weeks 7-12)

**Goal:** Enable end-to-end booking and payment

| Deliverable | Description |
|-------------|-------------|
| ✅ Booking system with calendar management | Accept/reject bookings, manage availability |
| ✅ Payment gateway integration | FPX, cards, e-wallets |
| ✅ Real-time messaging | Customer-vendor chat |
| ✅ Reviews and ratings system | Verified post-booking reviews |
| ✅ Vendor analytics dashboard | Performance insights |
| ✅ Multi-venue support | Manage multiple venues per vendor |

**Outcome:** Customers can book and pay directly. Vendors have full CRM tools. Platform earns commission on bookings.

### Phase 3: AI Features (Weeks 13-18)

**Goal:** AI-powered differentiation

| Deliverable | Description |
|-------------|-------------|
| ✅ Smart venue recommendations | Collaborative filtering |
| ✅ AI inquiry assistant | Draft professional messages |
| ✅ Budget estimator | Cost prediction |
| ✅ Quote comparison AI | Analyze vendor quotes |
| ✅ Dynamic pricing insights | Market rate suggestions |
| ✅ Admin fraud detection | Suspicious pattern flagging |

**Outcome:** The "Nowadays.ai" experience — AI makes planning 10x faster and smarter.

### Phase 4: Scale (Weeks 19-24)

**Goal:** Platform growth and optimization

| Deliverable | Description |
|-------------|-------------|
| ✅ Multi-region support | Singapore, Thailand, Indonesia |
| ✅ Advanced search | Semantic search, voice input |
| ✅ Vendor promotions | Featured listings, discount codes |
| ✅ Customer loyalty program | Repeat booking incentives |
| ✅ API for third-party integrations | External tool connectivity |
| ✅ Advanced analytics | Comprehensive reporting |

---

## 7. Success Metrics

### Customer Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Time to first inquiry | < 5 minutes from signup | Phase 1 |
| Inquiry-to-booking conversion rate | > 15% | Phase 2 |
| Customer satisfaction (CSAT) | > 4.5/5 | Phase 2 |
| Repeat booking rate | > 25% | Phase 3 |

### Vendor Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Vendor onboarding completion rate | > 70% | Phase 1 |
| Inquiry response rate | > 80% within 24 hours | Phase 1 |
| Vendor retention (6-month) | > 85% | Phase 2 |
| Average revenue per vendor | Growing month-over-month | Phase 2 |

### Platform Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Monthly active users (MAU) | 10,000+ | Month 6 |
| Total bookings | 1,000+ | Month 6 |
| Gross merchandise value (GMV) | RM 500,000+ | Month 6 |
| Platform commission revenue | 10-15% of GMV | Phase 2 |

---

## 8. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low vendor supply | High | Medium | Manual outreach, free listing for first 6 months |
| Payment gateway delays | Medium | Medium | Start with bank transfer, integrate gateway in Phase 2 |
| AI features underperform | Medium | High | Build solid management system first, AI is enhancement |
| Regulatory compliance (PDPA) | High | Low | Legal review, data minimization, clear privacy policy |
| Marketplace chicken-and-egg | High | High | Focus on one city (KL), seed with 50+ verified venues |
| Competitor response | Medium | Medium | First-mover advantage, halal verification as moat |

---

## 9. Open Questions

1. **Commission model:** Percentage per booking (10-15%), flat fee, or subscription for vendors?
2. **Halal verification:** Who verifies? Platform team or third-party certifier?
3. **Payment flow:** Escrow (platform holds funds) or direct (vendor receives directly)?
4. **Dispute resolution:** What's the refund/cancellation policy? Who arbitrates?
5. **Multi-language:** When to add Bahasa Melayu? Phase 2 or later?
6. **Corporate accounts:** Separate onboarding flow for corporate event planners?
7. **Venue photography:** Platform-provided or vendor-uploaded? Quality standards?

---

## 10. Out of Scope (Phase 1)

- Payment processing
- Real-time messaging
- AI features
- Mobile app (responsive web only)
- Multi-region support
- Vendor promotions/ads
- Corporate account management
- Event planning tools (checklists, timelines)

---

> **Next Step:** Once this PRD is approved, I'll create detailed implementation plans for each phase — bite-sized tasks with exact code, file paths, and test cases.
