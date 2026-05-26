import "dotenv/config";
import { db } from "./index";
import { sql } from "drizzle-orm";

const STATIC_CATALOGS = ["amenities", "event_types"] as const;

const DATA_TABLES = [
  "messages",
  "conversation_participants",
  "conversations",
  "plan_recommendations",
  "plan_sessions",
  "content_flags",
  "booking_services",
  "bookings",
  "reviews",
  "favorites",
  "inquiries",
  "availability_slots",
  "availability_blocks",
  "service_tags",
  "service_packages",
  "listing_amenities",
  "listing_event_types",
  "listing_photos",
  "listings",
  "vendor_documents",
  "vendor_profiles",
  "users",
] as const;

interface Options {
  mode: "full" | "mock-only";
  keepCatalogs: boolean;
  dryRun: boolean;
  confirm: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const flags = new Set(args.map((a) => a.toLowerCase()));

  return {
    mode: flags.has("--mock-only") ? "mock-only" : "full",
    keepCatalogs: flags.has("--keep-catalogs"),
    dryRun: flags.has("--dry-run"),
    confirm: flags.has("--confirm") || flags.has("-y"),
  };
}

function showHelp(): void {
  console.log(`
db:reset — Clear database for production transition

USAGE
  npx tsx lib/db/reset.ts [FLAGS]

MODES
  (default)     Full reset — truncate ALL data tables. Use for dev→prod transition.
  --mock-only   Delete only rows where is_mock = true. Preserves real user data.

FLAGS
  --keep-catalogs   Preserve amenities + event_types lookup tables (static catalog data).
                    By default these are also truncated in full mode.
  --dry-run         Print SQL that would execute, without actually running it.
  --confirm, -y     Skip confirmation prompt (use in CI/automation).

EXAMPLE
  npx tsx lib/db/reset.ts --full --keep-catalogs -y   # CI-safe full reset, keep catalogs
  npx tsx lib/db/reset.ts --mock-only                  # Remove only seed-generated mock data
  npx tsx lib/db/reset.ts --dry-run                    # Preview what will be deleted
`);
}

async function main() {
  const opts = parseArgs();

  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  console.log("╔══════════════════════════════════════════╗");
  console.log("║  EventVenue DB Reset — Production Prep  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const modeLabel =
    opts.mode === "full"
      ? `FULL — TRUNCATE all ${DATA_TABLES.length + (opts.keepCatalogs ? 0 : STATIC_CATALOGS.length)} data tables`
      : "MOCK-ONLY — DELETE rows where is_mock = true";

  console.log(`Mode:       ${modeLabel}`);
  console.log(`Catalogs:   ${opts.keepCatalogs ? "KEEP amenities + event_types" : "TRUNCATE everything"}`);
  console.log(`Dry run:    ${opts.dryRun ? "YES — no changes will be made" : "NO — changes WILL be applied"}`);
  console.log(`Database:   ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/.*@/, "//***@") : "NOT CONFIGURED"}\n`);

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL not set in environment.");
    process.exit(1);
  }

  if (!opts.dryRun && !opts.confirm) {
    console.log("⚠️  This will permanently delete data. Type 'YES' to confirm:");
    const readline = (await import("readline")).createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await new Promise<string>((resolve) => {
      readline.question("> ", resolve);
    });
    readline.close();
    if (answer.trim() !== "YES") {
      console.log("Aborted.");
      process.exit(0);
    }
    console.log();
  }

  if (opts.mode === "full") {
    await fullReset(opts);
  } else {
    await mockOnlyReset(opts);
  }

  console.log("\n✅ Reset complete.");
  console.log("   Next: npx tsx lib/db/seed.ts  (optional — to re-seed with known test data)\n");
}

async function fullReset(opts: Options): Promise<void> {
  // TRUNCATE with CASCADE from users — single statement handles entire FK chain.
  // The FK cascade covers ALL data tables through users → vendor_profiles → listings → ...
  const cascadeTables = DATA_TABLES[0]; // 'messages' — most child
  // Actually simpler: TRUNCATE users CASCADE reaches everything that references users with ON DELETE CASCADE.
  // That's: vendor_profiles → vendor_documents, listings → all listing_*, inquiries → bookings → booking_services,
  // reviews, favorites, conversations → participants, messages, plan_sessions → recommendations, content_flags.

  // For safety and explicitness, truncate each data table individually in FK-safe order.
  // Use CASCADE on each to handle any FK edges we might have missed.

  if (opts.dryRun) {
    console.log("-- DRY RUN — would execute: --\n");
    for (const table of DATA_TABLES) {
      console.log(`TRUNCATE TABLE ${table} CASCADE;`);
    }
    if (!opts.keepCatalogs) {
      for (const cat of STATIC_CATALOGS) {
        console.log(`TRUNCATE TABLE ${cat} CASCADE;`);
      }
    }
    console.log("\n-- Also reset identity sequences on catalog tables --");
    console.log("ALTER SEQUENCE amenities_id_seq RESTART WITH 1;");
    console.log("ALTER SEQUENCE event_types_id_seq RESTART WITH 1;");
    return;
  }

  for (const table of DATA_TABLES) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
      console.log(`  ✓ ${table}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${table}: ${message}`);
    }
  }

  if (!opts.keepCatalogs) {
    for (const cat of STATIC_CATALOGS) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE ${cat} CASCADE`));
        console.log(`  ✓ ${cat} (catalog)`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ ${cat}: ${message}`);
      }
    }
    try {
      await db.execute(sql.raw(`ALTER SEQUENCE IF EXISTS amenities_id_seq RESTART WITH 1`));
    } catch { /* sequence may not exist if not yet created */ }
    try {
      await db.execute(sql.raw(`ALTER SEQUENCE IF EXISTS event_types_id_seq RESTART WITH 1`));
    } catch { /* ditto */ }
  }
}

async function mockOnlyReset(opts: Options): Promise<void> {
  // Delete only rows tagged as mock data. Requires is_mock column (users, vendor_profiles, listings).
  // Cascade deletes via FK ON DELETE CASCADE will clean up related child rows automatically.

  const queries = [
    { sql: sql`DELETE FROM users WHERE is_mock = true`, label: "users (mock)" },
    { sql: sql`DELETE FROM vendor_profiles WHERE is_mock = true`, label: "vendor_profiles (mock)" },
    { sql: sql`DELETE FROM listings WHERE is_mock = true`, label: "listings (mock)" },
  ];

  if (opts.dryRun) {
    console.log("-- DRY RUN — would execute: --\n");
    for (const q of queries) {
      console.log(`DELETE FROM ${q.label.split(" (")[0]} WHERE is_mock = true;`);
    }
    console.log("\n-- Cascade deletes will propagate to child tables via FK ON DELETE CASCADE --");
    return;
  }

  for (const q of queries) {
    try {
      const result = await db.execute(q.sql);
      console.log(`  ✓ ${q.label}: ${result.rowCount ?? "?"} rows deleted`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${q.label}: ${message}`);
    }
  }
}

main().catch((err) => {
  console.error("Reset error:", err);
  process.exit(1);
});
