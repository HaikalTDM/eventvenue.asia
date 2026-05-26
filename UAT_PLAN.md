# EventVenue.Asia — User Acceptance Testing (UAT) Plan

## 1. Overview

| Field | Detail |
|-------|--------|
| **Project** | EventVenue.Asia — AI-powered event venue marketplace for Southeast Asia |
| **Version** | v0.1.0 (Frontend Prototype — Mock Data / localStorage) |
| **Target Users** | Customers (event planners), Venue Owners, Service Providers, Platform Admins |
| **Test Environment** | Local dev server (`npm run dev`, `http://localhost:3000`) |
| **Browser Scope** | Chrome (primary), Firefox, Safari, Edge |
| **Responsive Breakpoints** | Mobile (375px), Tablet (768px), Desktop (1280px) |
| **Test Data** | 8 mock venues, 5 mock vendor accounts, 8 mock inquiries, 6 mock bookings |

### Test Accounts

| Role | Email | Notes |
|------|-------|-------|
| Vendor — Venue | `lim@grandballroom.com` | Pre-loaded with venue-001 |
| Vendor — Venue | `sarah@skyline.com` | Pre-loaded with venue-003 |
| Vendor — Service | `fiza@halalkitchen.com` | Catering provider |
| Vendor — Service | `maya@studiobliss.com` | Photography provider |
| Vendor — Service | `alex@spinmasters.com` | DJ provider |
| Admin | `admin@eventvenue.asia` | Full admin access |
| Customer | Any valid email | Created via sign-up |

---

## 2. Test Execution Workflow

All test cases must be executed **in order**. A failure in any `CRITICAL` test case blocks progression to subsequent test suites until resolved.

```
Phase 1: Foundation (Auth + Navigation)
    └─ Phase 2: Customer Core (Browse + Inquire + Book)
        └─ Phase 3: Customer Dashboard (Inquiries + Favorites + Messaging)
            └─ Phase 4: Vendor Portal (Registration + Listings + Inquiries + Calendar + Analytics + Messaging)
                └─ Phase 5: Admin Panel (Vendors + Users + Documents + Moderation + Analytics)
                    └─ Phase 6: AI Smart Planner
                        └─ Phase 7: Edge Cases + Validation + Responsive
```

---

## 3. Phase 1 — Foundation (Auth + Navigation)

### 1.1 — Landing Page Rendering

| Attribute | Value |
|-----------|-------|
| **Precondition** | Fresh browser session (incognito) |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.1.1 | Navigate to `/` | Homepage loads within 3 seconds with hero section visible | / |
| 1.1.2 | Verify "Filters" and "AI Planner" tabs exist in hero | Both tabs visible, "Filters" tab active by default | / |
| 1.1.3 | Verify search inputs are present | Location, date, capacity inputs and halal toggle visible | X | - The "All Location" dropdown is not using the custom design, and the date picker card is cut off at the bottom.
| 1.1.4 | Scroll to "How It Works" section | Section renders with step cards | / |
| 1.1.5 | Scroll to venue grid | At least 6 venue cards displayed with images, titles, prices, ratings | / |
| 1.1.6 | Verify Footer renders | Footer visible with links | X | - The footer link is not updated yet. When "Browse Venues" is clicked, it redirects to `http://localhost:3000/list-venue#venues`, and the list venue page is still present.

### 1.2 — Navigation Bar

| Attribute | Value |
|-----------|-------|
| **Precondition** | On any page |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.2.1 | Verify sticky nav is visible | Nav bar sticks to top on scroll | / |
| 1.2.2 | Click logo/brand name | Redirects to `/` | / |
| 1.2.3 | Click "Sign in" button | Redirects to `/sign-in` | / |
| 1.2.4 | Click "List Venue" button | Redirects to `/list-venue` | X | - There is no list-venue page anymore; I removed it.
| 1.2.5 | Click "Compare" link | Redirects to `/compare` | / |
| 1.2.6 | Resize to mobile width (375px) | Nav collapses into hamburger menu | / | - But it needs a smooth animation for expand and collapse.
| 1.2.7 | Click hamburger menu | Mobile nav slides in with all links | / |

### 1.3 — Customer Sign In

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/sign-in`, logged out |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.3.1 | Enter any valid email + any password | Sign-in succeeds, user redirected to `/` | / |
| 1.3.2 | Verify "Remember me" checkbox | Toggleable without error | / |
| 1.3.3 | Toggle password visibility | Password text shown/hidden | / |
| 1.3.4 | Click "Forgot password" | Redirects to `/forgot-password` | / |
| 1.3.5 | Click Google/Apple social buttons | Buttons are non-functional (UI only) — no error | / |
| 1.3.6 | Sign in, then reload page | User session persists (auth state retained) | / |

### 1.4 — Customer Sign Up

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/sign-up`, logged out |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.4.1 | Default role shows "Customer" | Customer form visible with all fields | / |
| 1.4.2 | Switch role to "Vendor" | Redirects to `/vendor/register` | / |
| 1.4.3 | Switch back to Customer, fill all fields | Form accepts input | / |
| 1.4.4 | Enter mismatched password/confirm | Error message shown, submission blocked | / |
| 1.4.5 | Uncheck "Terms" checkbox | Submission blocked | / |
| 1.4.6 | Match passwords + check terms + submit | Account created, redirected to `/` | / |
| 1.4.7 | Verify nav shows user name | User's name/profile link visible in nav | / |

### 1.5 — Forgot Password

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/forgot-password` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.5.1 | Enter any email + submit | Success state shows "sent" message | / |
| 1.5.2 | Click "Try a different email" | Form resets to input state | / |

### 1.6 — Auth Redirects

| Attribute | Value |
|-----------|-------|
| **Precondition** | Not signed in |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.6.1 | Navigate to `/dashboard` | Redirected to `/sign-in` | ✓ | - Fixed: Added sync localStorage check with useLayoutEffect in app/dashboard/layout.tsx. Now immediately redirects unauthenticated users.
| 1.6.2 | Navigate to `/vendor/dashboard` | Redirected to `/vendor/login` | ✓ | - Fixed: Added sync localStorage check with useLayoutEffect in components/VendorPortalLayout.tsx. White screen replaced with proper redirect.
| 1.6.3 | Navigate to `/admin/dashboard` | Redirected to `/admin/login` | ✓ | - Fixed: Added sync localStorage check + useLayoutEffect + pageshow event listener in app/admin/layout.tsx. Catches back-button navigation after sign-out.

### 1.7 — Sign Out

| Attribute | Value |
|-----------|-------|
| **Precondition** | Signed in as customer |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.7.1 | Click sign-out (via nav link) | User logged out, redirected to `/`, nav shows "Sign in" | / |
| 1.7.2 | Navigate to `/dashboard` after sign-out | Redirected to `/sign-in` | ✓ | - Fixed: Same auth guard fix as 1.6.1 (app/dashboard/layout.tsx).

---

## 4. Phase 2 — Customer Core

### 2.1 — Venue Discovery & Filtering

| Attribute | Value |
|-----------|-------|
| **Precondition** | On homepage `/` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.1.1 | View venue grid in "Filters" tab | All 8 venues displayed | / |
| 2.1.2 | Select "Kuala Lumpur" location filter | Grid filters to KL venues only | / |
| 2.1.3 | Enter capacity "200" | Grid shows venues with capacity >= 200 only | / |
| 2.1.4 | Toggle "Halal-certified only" | Grid shows halal-certified venues only | / |
| 2.1.5 | Select amenity "WiFi" | Grid filters to venues with WiFi | / |
| 2.1.6 | Select event type "Wedding" | Grid filters to wedding-suitable venues | / |
| 2.1.7 | Combine multiple filters | Grid applies AND logic across all active filters | / |
| 2.1.8 | Reset/clear all filters | All 8 venues shown again | / |

### 2.2 — Venue Detail Page

| Attribute | Value |
|-----------|-------|
| **Precondition** | Click any venue card from grid |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.2.1 | Venue detail page loads | URL matches `/venues/[id]` or `/venues/venue-001` | / |
| 2.2.2 | Image gallery visible | Main image displayed with thumbnails | / |
| 2.2.3 | Click gallery thumbnail | Main image switches to clicked image | / |
| 2.2.4 | Venue header info correct | Title, location, price per hour, rating, capacity shown | / |
| 2.2.5 | Halal badge visible (if applicable) | Halal badge displayed for certified venues | / |
| 2.2.6 | Amenities grid renders | All venue amenities shown as icons/labels | / |
| 2.2.7 | Reviews section renders | 3 reviews displayed with names, ratings, text | / |
| 2.2.8 | FAQ accordion renders | FAQ items clickable, expands/collapses on click | / |
| 2.2.9 | Booking card visible | Date picker, time picker, guest count input, venue inquiry modal button | / | - Improvement: Instead of a slider, consider using a text box to make it easier. If not, keep the slider.
| 2.2.10 | Availability calendar visible | Calendar shows dates, blocked dates marked | / |
| 2.2.11 | Location map visible | Map component renders (static/hardcoded) | / |
| 2.2.12 | Related venues section | At least 2 related venue cards shown | / |

### 2.3 — Favorites (Wishlist)

| Attribute | Value |
|-----------|-------|
| **Precondition** | On venue detail page, signed in |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.3.1 | Click heart icon on venue card (from grid) | Heart fills, venue added to favorites | / | - Right now, even when not signed in, users can heart it. Ensure unauthenticated users cannot heart venues. When they try, open a modal prompting them to sign in.
| 2.3.2 | Click heart icon on detail page | Heart toggles fill state | / |
| 2.3.3 | Navigate to `/dashboard/favorites` | Previously favorited venue appears in grid | / |
| 2.3.4 | Click remove/delete on favorite | Venue removed from favorites list | / |
| 2.3.5 | Refresh page | Favorites persist (localStorage) | / |
| 2.3.6 | "Compare Saved Venues" button visible | Button appears when 2+ favorites exist | ✓ | - Fixed: Compare page (app/compare/page.tsx) now initializes from useFavorites() and reads saved venues from localStorage. Stale removed favorites no longer appear.

### 2.4 — Venue Comparison

| Attribute | Value |
|-----------|-------|
| **Precondition** | Navigate to `/compare` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.4.1 | Page loads with first 3 venues pre-selected | Comparison table displayed side-by-side | / |
| 2.4.2 | Verify "Best" badges | Lowest price, highest capacity, highest rating each highlighted | / |
| 2.4.3 | Click remove chip on one venue | Venue removed, comparison updates | / |
| 2.4.4 | Use search dropdown to add a 4th venue | Venue added to comparison (max 3 — oldest removed) | / |
| 2.4.5 | Click "Send Inquiry" on a venue | Opens inquiry modal | / | - The modal is cut off at the top and is overlapping with the navbar. 
| 2.4.6 | Click "Book Now" on a venue | Redirects to booking flow | / |

### 2.5 — Inquiry Submission

| Attribute | Value |
|-----------|-------|
| **Precondition** | Signed in, on venue detail page |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.5.1 | Click "Venue Inquiry Modal" or inquiry form | Modal opens (or inline form expands) | / |
| 2.5.2 | Select event date | Date picker accepts future dates | / |
| 2.5.3 | Select event time | Time picker accepts input | / |
| 2.5.4 | Enter guest count "150" | Field accepts value | / |
| 2.5.5 | Select event type (e.g. "Wedding") | Event type selectable | / | - Make the dropdown use a custom design.
| 2.5.6 | Enter special requirements text | Textarea accepts input | / |
| 2.5.7 | Submit inquiry | Success message shown, inquiry appears in dashboard | ✓ | - Fixed: InquiryFormModal now saves to localStorage after POST. Dashboard inquiries reads from both API + localStorage. Survives page refresh.
| 2.5.8 | Submit inquiry on behalf of a 2nd venue | Second inquiry appears in dashboard | ✓ | - Fixed: Same fix as 2.5.7 — all inquiries persist via localStorage.

---

## 5. Phase 3 — Customer Dashboard

### 3.1 — Dashboard Overview

| Attribute | Value |
|-----------|-------|
| **Precondition** | Signed in, navigate to `/dashboard` | - There is no /dashboard link in the nav bar. (Can we add a dashboard nav with "My Inquiries" and "Favorites" as a dropdown, so it reads: My Dashboard / My Inquiries / Favorites?)
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.1.1 | Dashboard loads within 3s | Overview page renders | / |
| 3.1.2 | Stats cards visible | Total inquiries, in progress, completed, saved venues counts | / |
| 3.1.3 | Recent inquiries list | Latest inquiries displayed | / |
| 3.1.4 | Quick action buttons | "Browse Venues", "Compare", "Favorites", "Settings" all clickable | / |
| 3.1.5 | Navigate to `/dashboard/inquiries` via link | Inquiries page loads | / |

### 3.2 — My Inquiries

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/dashboard/inquiries`, with submitted inquiries from Phase 2 |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.2.1 | All inquiries displayed | Each shows venue, date, time, guests, status badge | / |
| 3.2.2 | Default filter = "All" | All status inquiries shown | / |
| 3.2.3 | Click "Accept" filter | Only accepted-status inquiries shown | / |
| 3.2.4 | Click "Approve" filter | Only approved-status inquiries shown | / |
| 3.2.5 | Click "Proceed" filter | Only proceed-status inquiries shown | / |
| 3.2.6 | Click "Ongoing" filter | Only ongoing-status inquiries shown | / |
| 3.2.7 | Click "Completed" filter | Only completed-status inquiries shown | / |
| 3.2.8 | Click "Cancelled" filter | Only cancelled-status inquiries shown | / |
| 3.2.9 | Click "View Venue" link on inquiry | Redirects to venue detail page | / |
| 3.2.10 | Count badges on each filter tab | Counts match actual inquiry data | / |

### 3.3 — Profile Settings

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/dashboard/settings` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.3.1 | Profile tab: Edit name + phone | Changes accepted in input fields | / |
| 3.3.2 | Click "Save" | Success feedback shown | / |
| 3.3.3 | Password tab: Enter wrong current password | Error message shown | / |
| 3.3.4 | Password tab: Enter matching new passwords | Success feedback shown | / |
| 3.3.5 | Notifications tab: Toggle email/SMS switches | Switches toggle on/off with visual feedback | / |
| 3.3.6 | Click "Save" on Notifications | Success message shown | / |

### 3.4 — Booking Confirmation Flow

| Attribute | Value |
|-----------|-------|
| **Precondition** | Navigate to `/dashboard/booking-confirmation` | - ✓ Fixed: Removed redundant "Review Quote" title. Kept dedicated "Back to Inquiries" button as top-of-page navigation.
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.4.1 | Step 1 — Quote review displayed | Price breakdown visible | / |
| 3.4.2 | Click "Accept & Confirm Booking" | Advances to next step | / |
| 3.4.3 | Step 2 — Service add-ons displayed | Catering, Photography, DJ, Decoration checkboxes visible | / |
| 3.4.4 | Check "Catering" and "Photography" | Checkboxes toggle on | / |
| 3.4.5 | Click "Continue" with selections | Advances to final step | / |
| 3.4.6 | Click "Skip for now" | Advances without selections | / |
| 3.4.7 | Step 3 — Confirmation summary displayed | Booking details + group chat summary shown | / |
| 3.4.8 | Click "Open Group Chat" | Redirects to messages | ✓ | - Fixed: Removed vendor card + "Message" link from booking-confirmation page (app/dashboard/booking-confirmation/page.tsx). Group chat summary no longer present.
| 3.4.9 | Click "Go to Dashboard" | Redirects to `/dashboard` | / |

### 3.5 — Customer Messaging — There is no messaging page right now

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/dashboard/messages`, signed in |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.5.1 | Messages page loads | Conversation list on left, empty/default chat pane on right | ☐ |
| 3.5.2 | Filter tabs visible | All / Group / Venues / Services tabs | ☐ |
| 3.5.3 | Click each filter tab | Conversation list updates accordingly | ☐ |
| 3.5.4 | Click a conversation | Chat pane updates with message history | ☐ |
| 3.5.5 | Type a message in text input | Input accepts text | ☐ |
| 3.5.6 | Press Enter or click Send | Message appears as sent bubble | ☐ |
| 3.5.7 | Unread badge decreases | Badge count updates when message read | ☐ |

---

## 6. Phase 4 — Vendor Portal

### 4.1 — Vendor Login

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/login` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.1.1 | Click demo account button (e.g., Grand Ballroom) | Email/password fields auto-fill | / |
| 4.1.2 | Click "Login" | Redirects to `/vendor/dashboard` | / |
| 4.1.3 | Enter invalid email + password | Error message shown | / |
| 4.1.4 | Toggle password visibility | Password shown/hidden | / |
| 4.1.5 | Verify sidebar shows vendor info | Business name, vendor type, sign-out link | / |

### 4.2 — Vendor Registration

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/register` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.2.1 | Step 1 — Select "Venue Owner" | Selection highlighted, "Next" enabled | / |
| 4.2.2 | Click "Next" | Advances to Step 2 | / |
| 4.2.3 | Step 2 — Fill business info | Name, location, description fields accept input | / | - I want the location field to use a dropdown of Malaysian places.
| 4.2.4 | Click "Next" | Advances to Step 3 | / |
| 4.2.5 | Step 3 — Fill personal details | Name, email, phone, password, confirm fields | / |
| 4.2.6 | Mismatched passwords | Error shown, blocked from proceeding | / |
| 4.2.7 | Match passwords, click "Next" | Advances to Step 4 | / |
| 4.2.8 | Step 4 — Upload documents | Drag-and-drop zone visible, file list + remove | / |
| 4.2.9 | Click "Back" on Step 4 | Returns to Step 3 with data preserved | / |
| 4.2.10 | Advance to Step 4 again, click "Complete Registration" | Success state shown | / |
| 4.2.11 | Select "Service Provider" on Step 1 | Service category dropdown appears on Step 2 | / | - The "Select Category" field needs to use a custom design. 

### 4.3 — Vendor Dashboard

| Attribute | Value |
|-----------|-------|
| **Precondition** | Logged in as vendor |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.3.1 | Dashboard loads | Stats cards visible (active listings, pending inquiries, confirmed bookings, revenue) | / |
| 4.3.2 | Venue owner view | Stats show venue-specific metrics | / |
| 4.3.3 | Verification badge displayed | Badge shown based on vendor status | / |
| 4.3.4 | Quick tips section | Tips list visible | / |
| 4.3.5 | Sign out | Redirects to `/vendor/login`, auth cleared | ✓ | - Fixed: Same auth guard fix as 1.6.2 (components/VendorPortalLayout.tsx). handleLogout now properly clears session and redirects.

### 4.4 — Vendor Listings Management

| Attribute | Value |
|-----------|-------|
| **Precondition** | Logged in as venue vendor, on `/vendor/listings` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.4.1 | Existing listing(s) displayed | Listing cards with images, status badges (Active/Paused) | / |
| 4.4.2 | Click "Pause" on active listing | Status changes to Paused, visual update | / |
| 4.4.3 | Click "Unpause" on paused listing | Status changes back to Active | / |
| 4.4.4 | Click "Edit" on a listing | Redirects to edit form with pre-filled data | / | - But it says "venue not found."
| 4.4.5 | Click "Manage Availability" (venue only) | Redirects to availability calendar | / |
| 4.4.6 | Navigate to `/vendor/listings/new` | Add Venue form loads | /chargbab |

### 4.5 — Add/Edit Venue Listing

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/listings/new` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.5.1 | Fill venue name, description, address | All text inputs accept data | / |
| 4.5.2 | Select location from dropdown | Selection highlighted | / | - The location field is not a dropdown; fix it.
| 4.5.3 | Enter capacity "300" | Numeric input accepted | / |
| 4.5.4 | Enter price "5000" + select currency | Values accepted | / |
| 4.5.5 | Toggle event types (Wedding, Corporate, etc.) | Buttons toggle on/off | / |
| 4.5.6 | Check amenity checkboxes | Checkboxes toggle | / |
| 4.5.7 | Toggle "Halal Verified" | Checkbox toggles | / | - For "Halal Verified," the user needs to upload proof documents.
| 4.5.8 | Upload photos via file picker | Photo thumbnails appear in preview grid, remove button works | ✓ | - Fixed: Added fileInputRef to reset input value after upload/removal in app/vendor/listings/new/page.tsx. Same file can now be re-uploaded after removal.
| 4.5.9 | Fill contact info | Email + phone fields accept input | / |
| 4.5.10 | Click "Cancel" | Redirects back to listings list | / |
| 4.5.11 | Click "Submit" | Success confirmation shown | / |
| 4.5.12 | Navigate to `/vendor/listings/[id]/edit` | Edit form loads with pre-populated data | / |
| 4.5.13 | Modify a field + click "Save Changes" | "Changes saved" feedback shown | ✓ | - ✓ Fixed: Toast repositioned to fixed bottom-right corner (app/vendor/listings/[id]/edit/page.tsx). No longer stuck at scroll-top.

### 4.6 — Add Service Listing

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/listings/new-service` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.6.1 | Fill service name, select category | Fields accept input | / |
| 4.6.2 | Add description | Textarea accepts input | / |
| 4.6.3 | Select availability options | Toggle buttons work | / |
| 4.6.4 | Toggle "Halal" | Checkbox works | / |
| 4.6.5 | Toggle event types | Buttons toggle | / |
| 4.6.6 | Click "Add Package" in Package Builder | New package form appears with name/price/unit/description | / |
| 4.6.7 | Fill package details + click "Remove" | Package removed from list | / |
| 4.6.8 | Add 2 packages with different pricing | Both packages display in list | / |
| 4.6.9 | Type tag + press Enter | Tag added as chip | / |
| 4.6.10 | Upload portfolio photos | Photos displayed in grid, removable | / |
| 4.6.11 | Click "Submit" | Success confirmation shown | / |

### 4.7 — Vendor Inquiries

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/inquiries`, logged in as vendor with mock data |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.7.1 | Inquiries list loads | Inquiry cards with customer info, venue, date, guests, status | / |
| 4.7.2 | Status filters visible | All filter tabs functional | / |
| 4.7.3 | Customer contact info displayed | Email visible, WhatsApp link present | / |
| 4.7.4 | Click "Accept" on an inquiry | Status advances to "Approved" | / |
| 4.7.5 | Click "Approve" on approved inquiry | Status advances to "Proceed" | / |
| 4.7.6 | Click "Proceed" | Status advances to "Ongoing" | / |
| 4.7.7 | Click "Ongoing" | Status advances to "Completed" | / |
| 4.7.8 | Click "Cancel" at any stage | Status changes to "Cancelled" | / |

### 4.8 — Vendor Bookings

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/bookings` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.8.1 | Bookings list loads | Booking cards with thumbnails, customer, date, guests, amount | / |
| 4.8.2 | Grouped by status | Pending, Confirmed, In Progress, Completed, Cancelled sections | / |
| 4.8.3 | Status badge correct per booking | Badge color matches status | / |

### 4.9 — Availability Management

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/listings/[id]/availability` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.9.1 | Calendar renders | Interactive grid of dates displayed | / |
| 4.9.2 | Month navigation | Previous/Next arrows change displayed month | / |
| 4.9.3 | Click an available date | Date becomes blocked (color change) | / | - Allow the vendor to add details: name, date, time, and source (Facebook, WhatsApp, etc.).
| 4.9.4 | Click a blocked date | Date becomes unblocked | / |
| 4.9.5 | Click "Add Appointment" | Modal opens with date/time/customer/event fields | / | - Same as above.
| 4.9.6 | Fill appointment details + save | Appointment appears in sidebar list | / | 
| 4.9.7 | Stats cards update | Confirmed / Inquiries / Blocked / Available counts reflect data | / |
| 4.9.8 | Click "Save Availability" | Success feedback shown | ✓ | - ✓ Fixed: Toast repositioned to fixed bottom-right corner (app/vendor/listings/[id]/availability/page.tsx). Same pattern as 4.5.13.

### 4.10 — Vendor Calendar (Multi-Venue)

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/calendar` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.10.1 | Calendar renders with color-coded dots | Dots appear on dates with events per venue | / |
| 4.10.2 | Month navigation | Previous/Next arrows work | / |
| 4.10.3 | Click a date with appointments | Detail modal opens with appointments | / |
| 4.10.4 | Venue legend displayed | Color-coded venue legend visible | / |
| 4.10.5 | "This Month" sidebar | Sidebar shows month's events | / |
| 4.10.6 | "This Month" — buttons | Today/Previous/Next buttons functional | / |

### 4.11 — Vendor Analytics

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/analytics` |
| **Priority** | MEDIUM |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.11.1 | Time period dropdown | Options selectable | / |
| 4.11.2 | Change time period | Metrics update | / |
| 4.11.3 | Metric cards display | Values + change indicators visible | / |
| 4.11.4 | Traffic sources section | Bar chart/bar indicators displayed | / |
| 4.11.5 | Recent activity feed | Activity items listed | / |

### 4.12 — Vendor Settings

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/settings` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.12.1 | Profile tab: Upload photo preview | Photo preview shown | / |
| 4.12.2 | Edit business name/bio/website/location | All fields editable | / |
| 4.12.3 | Click "Save Changes" | Success feedback | / |
| 4.12.4 | Password tab: Change password | Current/new/confirm fields + success on match | / |
| 4.12.5 | Notifications tab: Toggle checkboxes | Inquiry/quote/booking/review/marketing checkboxes toggle | / |
| 4.12.6 | Click "Save Preferences" on Notifications | Success feedback | / |

### 4.13 — Vendor Messaging — This section was hidden already

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/vendor/messages` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.13.1 | Conversation list loads | Filter tabs (All/1:1/Group) visible | ☐ |
| 4.13.2 | Click filter tabs | List updates per filter | ☐ |
| 4.13.3 | Click a conversation | Chat pane opens with message history | ☐ |
| 4.13.4 | Type and send message | Message appears in chat | ☐ |
| 4.13.5 | Event brief card in group chat | Event brief pinned card visible | ☐ |

---

## 7. Phase 5 — Admin Panel

### 5.1 — Admin Login

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/admin/login` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.1.1 | Click demo admin button | Email/password auto-fill | / |
| 5.1.2 | Click "Login" | Redirects to `/admin/dashboard` | / |
| 5.1.3 | Enter invalid credentials | Error message shown | / |
| 5.1.4 | Verify dark-themed UI | Admin pages render with dark theme | / |

### 5.2 — Admin Dashboard

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/admin/dashboard` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.2.1 | Stats cards visible | Total users, vendors, bookings, revenue counts | / |
| 5.2.2 | Pending action links | "Vendor Approval", "Document Review", "Flagged Content" links present | / |
| 5.2.3 | Recent activity feed | Activity items listed | / |
| 5.2.4 | Sidebar navigation | All admin sections listed in sidebar | / |

### 5.3 — Vendor Approval

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/admin/vendors` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.3.1 | Vendor list loads | Vendor cards with names, types, status | / |
| 5.3.2 | Status filter tabs | All / Pending / Approved / Rejected tabs functional | / |
| 5.3.3 | Click vendor card to expand | Details panel shows business info + documents | / |
| 5.3.4 | Click "Approve" | Vendor status changes to Approved | / |
| 5.3.5 | Click "Reject" | Vendor status changes to Rejected | / |

### 5.4 — User Management

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/admin/users` |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.4.1 | User table loads | Users listed with name, email, role, status | / |
| 5.4.2 | Role filter tabs | All / Customer / Vendor / Suspended tabs functional | / |
| 5.4.3 | Enter search query | Table filters to matching users | / |
| 5.4.4 | Click "Suspend" on active user | User status changes to Suspended | / |
| 5.4.5 | Click "Reactivate" on suspended user | User status changes to Active | / |

### 5.5 — Document Verification

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/admin/documents` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.5.1 | Document list loads | Document cards with type badges | / |
| 5.5.2 | Status filter tabs | All / Pending / Approved / Rejected tabs functional | / |
| 5.5.3 | Click "View" on document | Document preview/thumbnail displayed | / |
| 5.5.4 | Click "Approve" | Document status changes to Approved | / |
| 5.5.5 | Click "Reject" + enter reason | Reject reason textarea appears, status changes to Rejected | / |

### 5.6 — Platform Analytics

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/admin/analytics` |
| **Priority** | MEDIUM |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.6.1 | Metric cards display | Values with change indicators | / |
| 5.6.2 | Monthly bookings chart | Visual bar chart renders | / |
| 5.6.3 | Event type distribution | Distribution bars render | / |
| 5.6.4 | Top venues table | Rankings with columns displayed | / |

### 5.7 — Content Moderation

| Attribute | Value |
|-----------|-------|
| **Precondition** | On `/admin/moderation` |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.7.1 | Flagged items list loads | Review/listing/message cards with flag reason | / |
| 5.7.2 | Status filter tabs | All / Pending / Resolved tabs functional | / |
| 5.7.3 | Click "Remove" | Content removed, status updated | / |
| 5.7.4 | Click "Dismiss" | Flagged item dismissed, status updated | / |

---

## 8. Phase 6 — AI Smart Planner

### 6.1 — AI Plan Input & Execution

| Attribute | Value |
|-----------|-------|
| **Precondition** | On homepage `/`, signed in |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 6.1.1 | Click "AI Planner" hero tab | AI text input displayed | / |
| 6.1.2 | Type: "I need a halal wedding venue in KL for 200 guests next month with catering and photography within budget RM15000" | Text accepted in input | / |
| 6.1.3 | Click "Generate Plan" | Loading animation displays with step-by-step progress | / |
| 6.1.4 | Plan results page loads | Extraction chips show parsed parameters (event type, guests, location, budget, halal, services) | / |
| 6.1.5 | Venue recommendations displayed | Scored venue cards with match reasons, estimated cost, "Best" badge | / |
| 6.1.6 | Service recommendations displayed | Service cards with packages, scores, estimated costs | / |
| 6.1.7 | Budget summary bar visible | Total estimate, budget utilization percentage shown | / |
| 6.1.8 | Warnings section (if applicable) | Budget gaps or warnings displayed | / |
| 6.1.9 | Enter HALF-FILLED prompt — "Birthday party for 50" | System infers missing params with confidence scores | / |
| 6.1.10 | Enter vague prompt — "Need a venue" | System provides broad/generic recommendations with low confidence indicators | / |

---

## 9. Phase 7 — Edge Cases, Validation & Responsive

### 7.1 — 404 Handling

| Attribute | Value |
|-----------|-------|
| **Precondition** | Any |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.1.1 | Navigate to `/venues/invalid-id-999` | Custom 404 page renders with "Back to Home" and "Browse Venues" links | / |
| 7.1.2 | Navigate to `/nonexistent-page` | Custom 404 page renders | / |
| 7.1.3 | Click "Back to Home" on 404 | Redirects to `/` | / |
| 7.1.4 | Click "Browse Venues" on 404 | Redirects to `/` (venue grid visible) | / |

### 7.2 — Loading States

| Attribute | Value |
|-----------|-------|
| **Precondition** | Any |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.2.1 | Reload homepage with Slow 3G throttled | Custom loading animation visible | / |
| 7.2.2 | Navigate to `/dashboard` (signed in) | Dashboard loading skeleton/screen displays | / |
| 7.2.3 | Navigate to `/vendor/dashboard` (logged in) | Vendor loading skeleton displays | / |
| 7.2.4 | Navigate to `/venues/[id]` | Venue detail loading state displays | / |

### 7.3 — Empty States

| Attribute | Value |
|-----------|-------|
| **Precondition** | Varies |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.3.1 | New customer (no inquiries) → `/dashboard/inquiries` | Empty state message/illustration | / |
| 7.3.2 | Clear all favorites → `/dashboard/favorites` | Empty state message/illustration | / |
| 7.3.3 | Apply impossible filters (e.g., KL + capacity 5000) | "No venues found" empty state | / |
| 7.3.4 | No bookings vendor → `/vendor/bookings` | Empty state | / |

### 7.4 — Responsive Layout — Mobile (375px)

| Attribute | Value |
|-----------|-------|
| **Precondition** | DevTools — iPhone SE viewport |
| **Priority** | CRITICAL |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.4.1 | Homepage — Hero section | Single column, text readable, search inputs stacked | / | - Right now the filters take up too much vertical space in mobile view. I want them to be collapsible.
| 7.4.2 | Homepage — Venue grid | Cards in single column, no horizontal overflow | / |
| 7.4.3 | Venue detail — Image gallery | Full-width, swipeable | / | - For mobile view, I want the images below the banner image, as right now they look cramped and are cut off.
| 7.4.4 | Venue detail — Booking card | Fixed at bottom or accessible inline | / |
| 7.4.5 | Compare page | Cards stack vertically or scroll horizontally | / |
| 7.4.6 | Dashboard — Settings | Tabs accessible, inputs usable | / |
| 7.4.7 | Vendor portal — Sidebar | Collapses into overlay or bottom bar | X | - The vendor portal has no sidebar or navigation; it only shows the dashboard.
| 7.4.8 | Admin panel — Sidebar | Collapses into hamburger menu | ✓ | - ✓ Fixed: Added hamburger toggle with slide-in sidebar, overlay backdrop, and responsive ml-0 lg:ml-64 margin in app/admin/layout.tsx. No more horizontal overflow.

### 7.5 — Responsive Layout — Tablet (768px)

| Attribute | Value |
|-----------|-------|
| **Precondition** | DevTools — iPad viewport |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.5.1 | Homepage — Venue grid | 2-column grid | / |
| 7.5.2 | Venue detail — Layout | Key sections stack or 2-column | / |
| 7.5.3 | Compare page | 2-3 cards visible without overflow | / |
| 7.5.4 | Vendor dashboard | Stats cards in 2x2 grid | / |

### 7.6 — Responsive Layout — Desktop (1280px)

| Attribute | Value |
|-----------|-------|
| **Precondition** | DevTools — Desktop viewport |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.6.1 | Homepage — Venue grid | 3-4 cards per row | / |
| 7.6.2 | Venue detail — Page layout | Sidebar + main content, calendar + map side by side | / |
| 7.6.3 | Compare page | Up to 3 venues visible simultaneously | / |
| 7.6.4 | Vendor dashboard | Full sidebar visible, stats in 1x4 row | / |
| 7.6.5 | Admin dashboard | Full sidebar visible, full-width content | / |

### 7.7 — Browser Compatibility

| Attribute | Value |
|-----------|-------|
| **Precondition** | All core test cases |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.7.1 | Execute Phase 2 test cases in Chrome | All pass | / |
| 7.7.2 | Execute Phase 2 test cases in Firefox | All pass | / |
| 7.7.3 | Execute Phase 2 test cases in Safari | All pass | / |
| 7.7.4 | Execute Phase 2 test cases in Edge | All pass | / |

### 7.8 — Data Persistence

| Attribute | Value |
|-----------|-------|
| **Precondition** | Signed in, with data |
| **Priority** | HIGH |

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.8.1 | Add favorite → reload page | Favorite persists | / |
| 7.8.2 | Submit inquiry → reload → check dashboard | Inquiry persists | / |
| 7.8.3 | Add vendor listing → reload → check listings | Listing persists (within session) | / |

---

## 10. Test Summary Matrix

| Phase | Test Count | Critical | High | Medium | Status |
|-------|:----------:|:--------:|:----:|:------:|:------:|
| 1 — Foundation (Auth + Navigation) | 24 | 10 | 3 | — | ☐ Not Started |
| 2 — Customer Core | 26 | 13 | 6 | — | ☐ Not Started |
| 3 — Customer Dashboard | 37 | 11 | 12 | — | ☐ Not Started |
| 4 — Vendor Portal | 60 | 20 | 20 | 4 | ☐ Not Started |
| 5 — Admin Panel | 24 | 8 | 8 | 2 | ☐ Not Started |
| 6 — AI Smart Planner | 10 | 5 | 2 | — | ☐ Not Started |
| 7 — Edge Cases + Responsive | 28 | 6 | 14 | — | ☐ Not Started |
| **TOTAL** | **209** | **73** | **65** | **6** | |

---

## 11. Defect Severity Definitions

| Severity | Label | Description | Action |
|----------|-------|-------------|--------|
| **S1** | Blocker | Core feature completely broken; no workaround | Fix before any further testing |
| **S2** | Critical | Major feature impaired; difficult workaround | Fix before release |
| **S3** | Major | Feature partially broken; easy workaround | Fix in current sprint |
| **S4** | Minor | Cosmetic issue or minor inconvenience | Fix in next sprint |
| **S5** | Trivial | Typos, pixel misalignment, suggestions | Backlog |

---

## 12. Entry & Exit Criteria

### Entry Criteria

| # | Criterion | Verified |
|---|-----------|:--------:|
| E1 | Dev server runs without errors (`npm run dev`) | / |
| E2 | All mock data loads without console errors | / |
| E3 | Vendor demo accounts functional | / |
| E4 | Admin demo account functional | / |
| E5 | All routes resolve (no build errors) | / |

### Exit Criteria

| # | Criterion | Verified |
|---|-----------|:--------:|
| X1 | 100% of CRITICAL test cases pass | / |
| X2 | ≥ 90% of HIGH test cases pass | / |
| X3 | Zero S1 (Blocker) defects open | / |
| X4 | Zero S2 (Critical) defects open | / |
| X5 | All S3 defects documented with workarounds | / |
| X6 | Responsive tests pass at 375px, 768px, 1280px | / |

---

## 13. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Test Lead | | | |
| Product Owner | | | |
| Tech Lead | | | |
