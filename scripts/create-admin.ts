/**
 * Bootstraps an admin user directly in the database.
 *
 * Usage:
 *   npm run create:admin -- --email you@example.com --name "Your Name"
 *
 * Password is read from the EV_ADMIN_PASSWORD env var, or prompted via stdin
 * if the env var is empty (so it never lands in shell history).
 *
 * Behaviour:
 *   - If the email already exists, the user is upgraded to role=admin and
 *     marked verified. The password is updated only when --reset-password
 *     is passed.
 *   - Otherwise a new user is inserted with role=admin, isVerified=true,
 *     authProvider=credentials, isMock=false.
 */
import "dotenv/config";

interface Args {
  email?: string;
  name?: string;
  resetPassword: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { resetPassword: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") out.email = argv[++i];
    else if (a === "--name") out.name = argv[++i];
    else if (a === "--reset-password") out.resetPassword = true;
  }
  return out;
}

async function promptHidden(prompt: string): Promise<string> {
  process.stdout.write(prompt);
  const readline = await import("readline");
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Mute echo
    const stdin = process.stdin as NodeJS.ReadStream & { isTTY?: boolean };
    if (stdin.isTTY) {
      const onData = (char: Buffer) => {
        const c = char.toString();
        if (c === "\r" || c === "\n" || c === "\u0004") {
          stdin.removeListener("data", onData);
        } else {
          process.stdout.write("*");
        }
      };
      stdin.on("data", onData);
    }
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.email) {
    console.error("Missing --email");
    process.exit(1);
  }
  if (!args.name) {
    console.error("Missing --name");
    process.exit(1);
  }

  const email = args.email.toLowerCase().trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error(`Invalid email: ${email}`);
    process.exit(1);
  }

  let password = process.env.EV_ADMIN_PASSWORD || "";
  if (!password) {
    password = await promptHidden("Admin password (min 8 chars): ");
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  const { db, schema } = await import("../lib/db");
  const bcrypt = await import("bcryptjs");
  const { eq } = await import("drizzle-orm");

  const existing = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.email, email),
  });

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    const updates: Partial<typeof schema.users.$inferInsert> = {
      role: "admin",
      isVerified: true,
      isSuspended: false,
      isMock: false,
      name: args.name,
      updatedAt: new Date(),
    };
    if (args.resetPassword) {
      updates.passwordHash = passwordHash;
    }
    const [updated] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, existing.id))
      .returning();
    console.log(`Updated existing user ${updated.email} -> role=admin, verified=true${args.resetPassword ? ", password reset" : ""}`);
    console.log(`  id: ${updated.id}`);
    return;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      name: args.name,
      email,
      passwordHash,
      role: "admin",
      authProvider: "credentials",
      isVerified: true,
      isMock: false,
    })
    .returning();
  console.log(`Created admin user ${created.email}`);
  console.log(`  id: ${created.id}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("create-admin failed:", err);
    process.exit(1);
  });
