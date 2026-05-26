import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

async function verify(token: string, origin: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${origin}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
      cache: "no-store",
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => null);
    return { ok: false, message: data?.error?.message || "This verification link is invalid or has expired." };
  } catch {
    return { ok: false, message: "Could not reach the verification service. Please try again." };
  }
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card
        title="Verification link missing"
        body="The link you opened doesn't include a verification token. Please use the most recent email we sent you."
        cta={{ href: "/sign-in", label: "Go to sign in" }}
      />
    );
  }

  // Use a relative URL so this works in any environment without an env var.
  // Server Components can fetch relative paths in dev/prod alike when invoked
  // through Next's built-in fetch.
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const result = await verify(token, origin);

  if (!result.ok) {
    return (
      <Card
        title="Verification failed"
        body={result.message}
        cta={{ href: "/sign-in", label: "Back to sign in" }}
      />
    );
  }

  return (
    <Card
      title="Email verified"
      body="Your email is confirmed. You can now sign in to your account."
      cta={{ href: "/sign-in", label: "Sign in" }}
      success
    />
  );
}

function Card(props: {
  title: string;
  body: string;
  cta: { href: string; label: string };
  success?: boolean;
}) {
  return (
    <div className="space-y-6 text-center">
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
          props.success ? "bg-emerald-50" : "bg-amber-50"
        }`}
      >
        <svg
          className={`h-7 w-7 ${props.success ? "text-emerald-600" : "text-amber-600"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {props.success ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3l-6.93-12a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z" />
          )}
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{props.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{props.body}</p>
      </div>
      <Link
        href={props.cta.href}
        className="inline-flex items-center justify-center rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626]"
      >
        {props.cta.label}
      </Link>
    </div>
  );
}
