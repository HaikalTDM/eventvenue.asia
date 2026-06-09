#!/usr/bin/env python3
"""
seed_kl_halls.py — Populate the EventVenue.Asia database with 10 realistic
Kuala Lumpur event halls for a client demonstration.

WHAT THIS DOES
--------------
The records are *representative demo data* (not live-scraped): believable KL
venues with proper locations, RM pricing, capacities, contact details, amenities,
event types, and freely-licensed Unsplash images. Every row is tagged
`is_mock = true` so it can be removed in one pass with `--clean`.

WHY REST INSTEAD OF DIRECT SQL
------------------------------
The schema's foreign-key chain is:

    listings.vendor_id -> vendor_profiles.id -> users.id -> auth.users.id

`auth.users` is owned by Supabase Auth, and a database trigger
(`handle_new_auth_user`) automatically inserts the matching `public.users` row
whenever an auth identity is created. So we cannot just INSERT a user — we must
create the auth identity through the Supabase Admin API. Everything else is
written through the PostgREST data API. Both use the SERVICE ROLE key, which
bypasses RLS, and require only the `requests` library (no psycopg / supabase-py).

USAGE
-----
    python3 scripts/seed_kl_halls.py            # insert the 10 demo halls
    python3 scripts/seed_kl_halls.py --clean     # remove everything this script created
    python3 scripts/seed_kl_halls.py --dry-run   # validate config + dataset, write nothing

Environment (read from .env.local then .env):
    NEXT_PUBLIC_SUPABASE_URL      e.g. https://<ref>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY     service_role secret (NEVER ship to a browser)
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Optional

try:
    import requests
except ImportError:  # pragma: no cover
    sys.exit("This script needs the 'requests' package: pip install requests")


# ─── Configuration / environment ────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent
# Tag stamped onto every demo email/business so --clean can find our rows.
MOCK_TAG = "klhalls-demo"


def _parse_env_file(path: Path) -> dict[str, str]:
    """Minimal .env parser — handles KEY=VALUE, ignores comments/blank lines.

    Values may be wrapped in single or double quotes. We deliberately avoid a
    dependency on python-dotenv so the script runs on a bare interpreter.
    """
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            out[key] = value
    return out


def load_env() -> dict[str, str]:
    """Merge .env then .env.local (local overrides), like Next.js precedence."""
    env: dict[str, str] = {}
    env.update(_parse_env_file(PROJECT_ROOT / ".env"))
    env.update(_parse_env_file(PROJECT_ROOT / ".env.local"))
    return env


class SupabaseClient:
    """Thin wrapper over the Supabase Admin (Auth) and PostgREST (data) APIs.

    Only the service-role key is used, so all calls bypass Row Level Security.
    Keep this server-side only — the key grants full database access.
    """

    def __init__(self, base_url: str, service_key: str):
        self.base_url = base_url.rstrip("/")
        self.service_key = service_key
        self.session = requests.Session()
        self.session.headers.update({
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
        })

    # ── Auth Admin API ──────────────────────────────────────────────────────

    def create_auth_user(self, email: str, password: str, metadata: dict[str, Any]) -> str:
        """Create a confirmed auth identity and return its UUID.

        The DB trigger fires on insert and creates the matching public.users row,
        so by the time this returns we can reference the id as a vendor's user_id.
        """
        url = f"{self.base_url}/auth/v1/admin/users"
        body = {
            "email": email,
            "password": password,
            "email_confirm": True,          # skip the verification email for demo data
            "user_metadata": metadata,       # name/phone/role consumed by the trigger
        }
        resp = self.session.post(url, data=json.dumps(body), timeout=30)
        if resp.status_code in (200, 201):
            return resp.json()["id"]
        # Idempotency: if the demo user already exists, look it up instead of failing.
        if resp.status_code in (422, 400, 409) and "already" in resp.text.lower():
            existing = self._find_auth_user_by_email(email)
            if existing:
                return existing
        raise RuntimeError(f"create_auth_user failed [{resp.status_code}]: {resp.text[:300]}")

    def _find_auth_user_by_email(self, email: str) -> Optional[str]:
        url = f"{self.base_url}/auth/v1/admin/users"
        resp = self.session.get(url, params={"page": 1, "per_page": 200}, timeout=30)
        if resp.status_code != 200:
            return None
        for u in resp.json().get("users", []):
            if u.get("email", "").lower() == email.lower():
                return u["id"]
        return None

    def delete_auth_user(self, user_id: str) -> None:
        url = f"{self.base_url}/auth/v1/admin/users/{user_id}"
        self.session.delete(url, timeout=30)

    # ── PostgREST data API ────────────────────────────────────────────────────

    def insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        """Insert one row and return it (Prefer: return=representation)."""
        url = f"{self.base_url}/rest/v1/{table}"
        headers = {"Prefer": "return=representation"}
        resp = self.session.post(url, headers=headers, data=json.dumps(row), timeout=30)
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"insert {table} failed [{resp.status_code}]: {resp.text[:300]}")
        data = resp.json()
        return data[0] if isinstance(data, list) and data else data

    def insert_many(self, table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not rows:
            return []
        url = f"{self.base_url}/rest/v1/{table}"
        headers = {"Prefer": "return=representation"}
        resp = self.session.post(url, headers=headers, data=json.dumps(rows), timeout=30)
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"insert_many {table} failed [{resp.status_code}]: {resp.text[:300]}")
        return resp.json()

    def select(self, table: str, params: dict[str, str]) -> list[dict[str, Any]]:
        url = f"{self.base_url}/rest/v1/{table}"
        resp = self.session.get(url, params=params, timeout=30)
        if resp.status_code != 200:
            raise RuntimeError(f"select {table} failed [{resp.status_code}]: {resp.text[:300]}")
        return resp.json()

    def delete_where(self, table: str, params: dict[str, str]) -> None:
        url = f"{self.base_url}/rest/v1/{table}"
        resp = self.session.delete(url, params=params, timeout=30)
        if resp.status_code not in (200, 204):
            raise RuntimeError(f"delete {table} failed [{resp.status_code}]: {resp.text[:300]}")


# ─── Demo asset pools ────────────────────────────────────────────────────────
# Unsplash images are free to use under the Unsplash License (commercial use,
# no attribution required). We pin specific photo IDs of event/ballroom spaces
# and request a sized render so the gallery loads fast in the demo.

def _img(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=1200&q=80"

# Each hall gets 4 photos: the first is primary (hero), the rest fill the gallery.
HALL_IMAGE_SETS: list[list[str]] = [
    ["1519167758481-83f550bb49b3", "1464366400600-7168b8af9bc3", "1511795409834-ef04bbd61622", "1492684223066-81342ee5ff30"],
    ["1505236858219-8359eb29e329", "1519225421980-715cb0215aed", "1530103862676-de8c9debad1d", "1464366400600-7168b8af9bc3"],
    ["1467810563316-b5476525c0f9", "1519167758481-83f550bb49b3", "1505236858219-8359eb29e329", "1511795409834-ef04bbd61622"],
    ["1492684223066-81342ee5ff30", "1530103862676-de8c9debad1d", "1467810563316-b5476525c0f9", "1519225421980-715cb0215aed"],
    ["1464366400600-7168b8af9bc3", "1505236858219-8359eb29e329", "1492684223066-81342ee5ff30", "1519167758481-83f550bb49b3"],
    ["1519225421980-715cb0215aed", "1511795409834-ef04bbd61622", "1530103862676-de8c9debad1d", "1467810563316-b5476525c0f9"],
    ["1530103862676-de8c9debad1d", "1492684223066-81342ee5ff30", "1464366400600-7168b8af9bc3", "1505236858219-8359eb29e329"],
    ["1511795409834-ef04bbd61622", "1467810563316-b5476525c0f9", "1519167758481-83f550bb49b3", "1519225421980-715cb0215aed"],
    ["1505236858219-8359eb29e329", "1530103862676-de8c9debad1d", "1511795409834-ef04bbd61622", "1492684223066-81342ee5ff30"],
    ["1519167758481-83f550bb49b3", "1519225421980-715cb0215aed", "1467810563316-b5476525c0f9", "1464366400600-7168b8af9bc3"],
]

# Amenity / event-type names must match rows already seeded in the reference
# tables. We resolve names -> ids at runtime and skip any that don't exist.
DEFAULT_AMENITIES = ["WiFi", "AV System", "Free Parking", "Stage", "Bar Service"]
DEFAULT_EVENT_TYPES = ["Wedding", "Corporate", "Private Party"]


# ─── Hall dataset ────────────────────────────────────────────────────────────

def _slugify(name: str, suffix: str) -> str:
    base = "".join(c if c.isalnum() else "-" for c in name.lower())
    while "--" in base:
        base = base.replace("--", "-")
    return f"{base.strip('-')}-{suffix}"


def collect_halls() -> list[dict[str, Any]]:
    """Return 10 representative KL event halls.

    Each record bundles everything needed downstream: the business/contact info
    (-> vendor_profiles), the listing fields (name, location, capacity, pricing
    -> listings), and an image set (-> listing_photos). Pricing is per-hour in
    MYR to match `listings.price_per_hour`; the demo blurb notes typical
    full-event packages where relevant.
    """
    raw = [
        ("Grand Ballroom at Saujana", "Saujana", "Petaling Jaya", 1200, 850.00, True,
         "+603-7846 1234", "events@saujanaballroom.com.my",
         "Pillarless 1,200-pax grand ballroom with crystal chandeliers, ideal for Malay weddings and gala dinners. Halal kitchen on-site."),
        ("KLCC Convention Hall", "KLCC", "Kuala Lumpur", 3000, 1500.00, True,
         "+603-2333 2888", "booking@klcchall.com.my",
         "Flagship 3,000-pax convention hall steps from the Petronas Towers. Modular partitions, full AV, dedicated loading bay."),
        ("Bangsar Glass House", "Bangsar", "Kuala Lumpur", 350, 450.00, False,
         "+603-2284 5566", "hello@bangsarglasshouse.com",
         "Light-filled garden glasshouse for intimate weddings and product launches. Floor-to-ceiling glass with city-fringe greenery."),
        ("Mont Kiara Sky Pavilion", "Mont Kiara", "Kuala Lumpur", 500, 680.00, True,
         "+603-6201 7788", "events@skypavilionmk.com",
         "Rooftop pavilion on level 28 with panoramic KL skyline views. Popular for corporate townhalls and engagement receptions."),
        ("Setia Alam Grand Hall", "Setia Alam", "Shah Alam", 800, 520.00, True,
         "+603-3358 9001", "enquiry@setiaalamhall.com.my",
         "Spacious 800-pax community grand hall with ample free parking. Halal certified, well-suited to large kenduri and dinners."),
        ("Damansara Heights Atrium", "Damansara Heights", "Kuala Lumpur", 250, 600.00, False,
         "+603-2095 4400", "atrium@dheights.com.my",
         "Boutique double-volume atrium for premium private parties and intimate corporate mixers in an upscale enclave."),
        ("Cyberjaya Tech Auditorium", "Cyberjaya", "Cyberjaya", 600, 720.00, False,
         "+603-8312 6600", "venue@cyberjayaauditorium.my",
         "Tiered 600-seat auditorium wired for conferences and product keynotes. Stage, dual projection, livestream-ready."),
        ("Putrajaya Lakeside Marquee", "Putrajaya", "Putrajaya", 1000, 950.00, True,
         "+603-8888 2020", "events@putrajayamarquee.gov.my",
         "Waterfront marquee overlooking Putrajaya lake for grand weddings and state dinners. Halal kitchen, valet, jetty access."),
        ("Subang Jaya Crystal Hall", "Subang Jaya", "Subang Jaya", 450, 480.00, True,
         "+603-5621 3344", "book@subangcrystalhall.com",
         "Versatile 450-pax hall with crystal-themed lighting and in-house catering. Convenient access off the LDP highway."),
        ("Ampang Heritage Mansion", "Ampang", "Kuala Lumpur", 180, 550.00, False,
         "+603-4256 7799", "events@ampangheritage.com.my",
         "Restored colonial mansion with manicured lawn for boutique weddings and exclusive private celebrations of up to 180 guests."),
    ]

    halls: list[dict[str, Any]] = []
    for idx, (name, district, city, capacity, price, halal, phone, email, desc) in enumerate(raw):
        images = HALL_IMAGE_SETS[idx % len(HALL_IMAGE_SETS)]
        halls.append({
            "name": name,
            "district": district,
            "city": city,
            "state": "Federal Territory" if city in ("Kuala Lumpur", "Putrajaya") else "Selangor",
            "location": f"{district}, {city}",
            "address": f"{name}, Jalan {district}, {city}, Malaysia",
            "capacity": capacity,
            "price_per_hour": price,
            "halal": halal,
            "phone": phone,
            "email_public": email,
            "description": desc,
            "images": [_img(p) for p in images],
            "slug": _slugify(name, MOCK_TAG),
        })
    return halls


# ─── Insertion pipeline ──────────────────────────────────────────────────────

def resolve_lookup_ids(client: SupabaseClient, table: str, names: list[str]) -> list[int]:
    """Resolve amenity/event_type names to their smallint ids, skipping unknowns."""
    ids: list[int] = []
    for name in names:
        rows = client.select(table, {"name": f"eq.{name}", "select": "id"})
        if rows:
            ids.append(rows[0]["id"])
    return ids


def insert_hall(client: SupabaseClient, hall: dict[str, Any],
                amenity_ids: list[int], event_type_ids: list[int]) -> dict[str, str]:
    """Insert one hall across the full FK chain. Returns created ids for logging."""
    # 1) Auth identity -> trigger creates public.users automatically.
    email = f"{hall['slug']}@{MOCK_TAG}.eventvenue.asia"
    user_id = client.create_auth_user(
        email=email,
        password=uuid.uuid4().hex,  # random; demo logins aren't needed for these owners
        metadata={"name": hall["name"], "phone": hall["phone"], "role": "vendor"},
    )

    # 2) Vendor profile — carries the business + contact information.
    vendor = client.insert("vendor_profiles", {
        "user_id": user_id,
        "vendor_type": "venue_owner",
        "business_name": hall["name"],
        "business_description": hall["description"],
        "business_location": hall["location"],
        "verification_status": "approved",
        "verification_badge": "verified",
        "is_mock": True,
    })

    # 3) Listing — the venue itself (name, location, capacity, pricing).
    listing = client.insert("listings", {
        "vendor_id": vendor["id"],
        "listing_type": "venue",
        "title": hall["name"],
        "slug": hall["slug"],
        "description": hall["description"],
        "location": hall["location"],
        "state": hall["state"],
        "city": hall["city"],
        "district": hall["district"],
        "address": hall["address"],
        "capacity": hall["capacity"],
        "price_per_hour": hall["price_per_hour"],
        "currency": "MYR",
        "halal_certified": hall["halal"],
        "status": "active",
        "is_verified": True,
        "is_mock": True,
    })
    listing_id = listing["id"]

    # 4) Photos — first image is primary (hero), rest fill the gallery.
    photo_rows = [{
        "listing_id": listing_id,
        "url": url,
        "alt_text": f"{hall['name']} — photo {i + 1}",
        "sort_order": i,
        "is_primary": i == 0,
    } for i, url in enumerate(hall["images"])]
    client.insert_many("listing_photos", photo_rows)

    # 5) Amenity + event-type links (composite-PK join tables).
    if amenity_ids:
        client.insert_many("listing_amenities",
                           [{"listing_id": listing_id, "amenity_id": a} for a in amenity_ids])
    if event_type_ids:
        client.insert_many("listing_event_types",
                           [{"listing_id": listing_id, "event_type_id": e} for e in event_type_ids])

    return {"user_id": user_id, "vendor_id": vendor["id"], "listing_id": listing_id}


# ─── Service vendor dataset ──────────────────────────────────────────────────
# Diverse wedding/event services spanning the expanded category list. Each maps
# to listing_type="service"; the category is stored on the vendor profile
# (vendor_profiles.service_category), which the listings API now joins in.

SERVICE_IMAGES = {
    "photography": "1519741497674-611481863552",
    "photobooth": "1511795409834-ef04bbd61622",
    "ice_cream": "1501443762994-82bd5dab0a4a",
    "florist": "1465495976277-4387d4b0b4c6",
    "cake": "1535254973040-607b474cb50d",
    "transport": "1503376780353-7e6692767b70",
    "emcee": "1505236858219-8359eb29e329",
    "live_band": "1501612780327-45045538702b",
    "makeup": "1487412947147-5cebf100ffc2",
    "henna": "1595433707802-6b2626ef1c91",
    "catering": "1555244162-803834f70033",
    "decoration": "1519225421980-715cb0215aed",
}


def _svc_img(cat: str) -> str:
    pid = SERVICE_IMAGES.get(cat, "1492684223066-81342ee5ff30")
    return f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&w=1200&q=80"


def collect_services() -> list[dict[str, Any]]:
    """Return 12 representative KL wedding/event service vendors."""
    raw = [
        ("Lensa Cahaya Photography", "photography", "Bangsar", "Kuala Lumpur", 2500.00, "per_event", True,
         "+603-2201 4567", "Award-winning wedding & pre-wedding photography with same-day edits."),
        ("SnapPod Photobooth Rentals", "photobooth", "Mont Kiara", "Kuala Lumpur", 900.00, "per_event", False,
         "+603-6203 8899", "360 spinner and classic enclosed photobooths with instant prints and props."),
        ("Scoops & Smiles Ice Cream Cart", "ice_cream", "Petaling Jaya", "Petaling Jaya", 1200.00, "per_event", True,
         "+603-7865 2211", "Live ice cream and gelato carts — halal, 12 flavours, unlimited servings."),
        ("Bloom & Bouquet Florist", "florist", "Damansara", "Petaling Jaya", 1800.00, "per_event", False,
         "+603-7710 3344", "Fresh floral arches, hantaran arrangements, and bridal bouquets."),
        ("Sweet Tier Cake Studio", "cake", "Subang Jaya", "Subang Jaya", 750.00, "per_package", True,
         "+603-5612 7788", "Custom multi-tier wedding cakes and dessert tables, halal-certified."),
        ("Prestige Bridal Car & Limo", "transport", "KLCC", "Kuala Lumpur", 1500.00, "per_event", False,
         "+603-2166 9090", "Luxury bridal cars — Mercedes, vintage, and stretch limousines with chauffeur."),
        ("Suara Emcee & Hosting", "emcee", "Ampang", "Kuala Lumpur", 1300.00, "per_event", True,
         "+603-4251 6677", "Bilingual emcees (BM/English) for weddings, corporate galas, and launches."),
        ("Harmoni Live Band", "live_band", "Cheras", "Kuala Lumpur", 3500.00, "per_event", True,
         "+603-9133 4422", "5-piece live band and acoustic sets, plus traditional kompang on request."),
        ("Anggun Makeup Artistry", "makeup", "Shah Alam", "Shah Alam", 1600.00, "per_event", True,
         "+603-5511 2200", "Bridal makeup and styling, including akad nikah and reception looks."),
        ("Inai Seni Henna Art", "henna", "Gombak", "Kuala Lumpur", 500.00, "per_event", True,
         "+603-6188 7711", "Intricate bridal henna and inai for the bride and bridal party."),
        ("Selera Catering Services", "catering", "Klang", "Klang", 8000.00, "per_event", True,
         "+603-3344 5566", "Full halal buffet and set-menu catering for 200–1,000 guests."),
        ("Dekorasi Impian", "decoration", "Putrajaya", "Putrajaya", 4500.00, "per_event", False,
         "+603-8899 1212", "Stage, pelamin, and full venue decoration with themed lighting."),
    ]
    services: list[dict[str, Any]] = []
    for name, cat, district, city, price, unit, halal, phone, desc in raw:
        services.append({
            "name": name,
            "category": cat,
            "district": district,
            "city": city,
            "state": "Federal Territory" if city in ("Kuala Lumpur", "Putrajaya") else "Selangor",
            "location": f"{district}, {city}",
            "address": f"{name}, Jalan {district}, {city}, Malaysia",
            "price": price,
            "unit": unit,
            "halal": halal,
            "phone": phone,
            "description": desc,
            "image": _svc_img(cat),
            "slug": _slugify(name, MOCK_TAG),
        })
    return services


def insert_service(client: SupabaseClient, svc: dict[str, Any],
                   event_type_ids: list[int]) -> dict[str, str]:
    """Insert one service vendor + listing across the FK chain."""
    email = f"{svc['slug']}@{MOCK_TAG}.eventvenue.asia"
    user_id = client.create_auth_user(
        email=email,
        password=uuid.uuid4().hex,
        metadata={"name": svc["name"], "phone": svc["phone"], "role": "vendor"},
    )

    # Vendor profile carries the service_category that the listings API joins in.
    vendor = client.insert("vendor_profiles", {
        "user_id": user_id,
        "vendor_type": "service_provider",
        "business_name": svc["name"],
        "business_description": svc["description"],
        "business_location": svc["location"],
        "service_category": svc["category"],
        "verification_status": "approved",
        "verification_badge": "verified",
        "is_mock": True,
    })

    listing = client.insert("listings", {
        "vendor_id": vendor["id"],
        "listing_type": "service",
        "title": svc["name"],
        "slug": svc["slug"],
        "description": svc["description"],
        "location": svc["location"],
        "state": svc["state"],
        "city": svc["city"],
        "district": svc["district"],
        "address": svc["address"],
        "currency": "MYR",
        "halal_certified": svc["halal"],
        "status": "active",
        "is_verified": True,
        "is_mock": True,
    })
    listing_id = listing["id"]

    # Single hero photo for the card; services price via packages, not per-hour.
    client.insert("listing_photos", {
        "listing_id": listing_id,
        "url": svc["image"],
        "alt_text": f"{svc['name']} — {svc['category']}",
        "sort_order": 0,
        "is_primary": True,
    })

    # One service package so the detail page has pricing.
    client.insert("service_packages", {
        "listing_id": listing_id,
        "name": "Standard Package",
        "description": svc["description"],
        "price": svc["price"],
        "unit": svc["unit"],
    })

    if event_type_ids:
        client.insert_many("listing_event_types",
                           [{"listing_id": listing_id, "event_type_id": e} for e in event_type_ids])

    return {"user_id": user_id, "vendor_id": vendor["id"], "listing_id": listing_id}


def run_seed(client: SupabaseClient) -> None:
    halls = collect_halls()
    amenity_ids = resolve_lookup_ids(client, "amenities", DEFAULT_AMENITIES)
    event_type_ids = resolve_lookup_ids(client, "event_types", DEFAULT_EVENT_TYPES)
    print(f"Resolved {len(amenity_ids)} amenities, {len(event_type_ids)} event types.\n")

    ok = 0
    for i, hall in enumerate(halls, 1):
        try:
            ids = insert_hall(client, hall, amenity_ids, event_type_ids)
            ok += 1
            print(f"  [{i:>2}/10] OK  {hall['name']:<32} listing={ids['listing_id'][:8]} "
                  f"({hall['capacity']} pax, RM{hall['price_per_hour']:.0f}/hr, "
                  f"{len(hall['images'])} photos)")
        except Exception as exc:  # keep going so one bad row doesn't abort the demo
            print(f"  [{i:>2}/10] FAIL {hall['name']:<32} {exc}")
        time.sleep(0.15)  # be gentle on the Auth admin endpoint
    print(f"\nVenues: inserted {ok}/{len(halls)} halls (tagged is_mock=true).\n")

    # ── Service vendors ──────────────────────────────────────────────────────
    services = collect_services()
    svc_ok = 0
    for i, svc in enumerate(services, 1):
        try:
            ids = insert_service(client, svc, event_type_ids)
            svc_ok += 1
            print(f"  [{i:>2}/{len(services)}] OK  {svc['name']:<32} "
                  f"listing={ids['listing_id'][:8]} ({svc['category']}, "
                  f"RM{svc['price']:.0f}/{svc['unit']})")
        except Exception as exc:
            print(f"  [{i:>2}/{len(services)}] FAIL {svc['name']:<32} {exc}")
        time.sleep(0.15)
    print(f"\nServices: inserted {svc_ok}/{len(services)} vendors (tagged is_mock=true).")


def run_clean(client: SupabaseClient) -> None:
    """Remove everything this script created.

    Deleting the auth user cascades through public.users -> vendor_profiles ->
    listings -> listing_photos / join rows, so we only need to find and delete
    the auth identities by their @<MOCK_TAG> email suffix.
    """
    url = f"{client.base_url}/auth/v1/admin/users"
    removed = 0
    resp = client.session.get(url, params={"page": 1, "per_page": 200}, timeout=30)
    resp.raise_for_status()
    for u in resp.json().get("users", []):
        if f"@{MOCK_TAG}.eventvenue.asia" in u.get("email", ""):
            client.delete_auth_user(u["id"])
            removed += 1
            print(f"  removed {u['email']}")
    print(f"\nCleanup complete. Removed {removed} demo hall owner(s) and cascaded rows.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed 10 KL event halls for a client demo.")
    parser.add_argument("--clean", action="store_true", help="remove previously-seeded demo halls")
    parser.add_argument("--dry-run", action="store_true", help="validate config + dataset, write nothing")
    args = parser.parse_args()

    env = load_env()
    base_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if args.dry_run:
        halls = collect_halls()
        print(f"DRY RUN — {len(halls)} halls ready, Supabase URL "
              f"{'set' if base_url else 'MISSING'}, service key "
              f"{'set' if service_key else 'MISSING'}.")
        for h in halls:
            print(f"  - {h['name']:<32} {h['location']:<28} {h['capacity']:>5} pax  "
                  f"RM{h['price_per_hour']:.0f}/hr  {len(h['images'])} imgs")
        return 0

    if not base_url or not service_key:
        print("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
              "in .env.local or .env.", file=sys.stderr)
        return 1

    client = SupabaseClient(base_url, service_key)
    if args.clean:
        run_clean(client)
    else:
        run_seed(client)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())



