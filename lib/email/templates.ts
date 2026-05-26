/**
 * Plain-HTML email templates. Kept as functions (no JSX framework dep) so they
 * can be rendered server-side without bringing in `react-email`. Style is
 * inline because most clients still strip <style> blocks.
 */

const BRAND = "#EB4D4B";
const BRAND_DARK = "#dc2626";

function shell(opts: {
  preheader: string;
  headline: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `
      <tr>
        <td style="padding:24px 32px 8px">
          <a href="${opts.ctaUrl}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">
            ${escapeHtml(opts.ctaLabel)}
          </a>
        </td>
      </tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(opts.headline)}</title>
</head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${escapeHtml(opts.preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
          <tr>
            <td style="background:${BRAND};padding:18px 32px;color:#fff;font-weight:700;font-size:18px">
              EventVenue<span style="opacity:.85">.Asia</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;font-size:20px;font-weight:700;color:#111">
              ${escapeHtml(opts.headline)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;font-size:14px;line-height:1.65;color:#374151">
              ${opts.bodyHtml}
            </td>
          </tr>
          ${cta}
          <tr>
            <td style="padding:24px 32px 32px;font-size:12px;color:#6b7280">
              ${opts.footerNote ? escapeHtml(opts.footerNote) + "<br/><br/>" : ""}
              &copy; ${new Date().getFullYear()} EventVenue.Asia
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Suppress unused-var lint for BRAND_DARK (kept for future hover styles).
void BRAND_DARK;

export interface VerifyEmailArgs {
  name: string;
  verifyUrl: string;
  expiresInHours: number;
}

export function buildVerifyEmail(args: VerifyEmailArgs): { subject: string; html: string; text: string } {
  const subject = "Verify your EventVenue.Asia account";
  const html = shell({
    preheader: "Confirm your email to finish creating your account.",
    headline: `Hi ${args.name}, confirm your email`,
    bodyHtml: `
      <p>Welcome to EventVenue.Asia. Please confirm your email so you can sign in and start booking venues.</p>
      <p style="color:#6b7280;font-size:13px">This link expires in ${args.expiresInHours} hours. If you didn't sign up, you can safely ignore this email.</p>
    `,
    ctaLabel: "Verify email",
    ctaUrl: args.verifyUrl,
    footerNote: "If the button doesn't work, paste this link into your browser:\n" + args.verifyUrl,
  });
  const text = `Hi ${args.name},\n\nConfirm your EventVenue.Asia email by visiting:\n${args.verifyUrl}\n\nThis link expires in ${args.expiresInHours} hours.\n`;
  return { subject, html, text };
}

export interface ResetPasswordEmailArgs {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function buildResetPasswordEmail(args: ResetPasswordEmailArgs): { subject: string; html: string; text: string } {
  const subject = "Reset your EventVenue.Asia password";
  const html = shell({
    preheader: "Reset your password using the link inside.",
    headline: `Hi ${args.name}, reset your password`,
    bodyHtml: `
      <p>We received a request to reset the password on your EventVenue.Asia account.</p>
      <p style="color:#6b7280;font-size:13px">This link expires in ${args.expiresInMinutes} minutes. If you didn't request this, you can ignore this email — your password will stay the same.</p>
    `,
    ctaLabel: "Choose a new password",
    ctaUrl: args.resetUrl,
    footerNote: "If the button doesn't work, paste this link into your browser:\n" + args.resetUrl,
  });
  const text = `Hi ${args.name},\n\nReset your EventVenue.Asia password by visiting:\n${args.resetUrl}\n\nThis link expires in ${args.expiresInMinutes} minutes. If you didn't request this, ignore this email.\n`;
  return { subject, html, text };
}

export interface WelcomeEmailArgs {
  name: string;
  appUrl: string;
}

export function buildWelcomeEmail(args: WelcomeEmailArgs): { subject: string; html: string; text: string } {
  const subject = "Welcome to EventVenue.Asia";
  const html = shell({
    preheader: "Your account is ready. Start exploring venues.",
    headline: `Welcome, ${args.name}`,
    bodyHtml: `
      <p>Your EventVenue.Asia account is ready. Browse halal-certified venues across Southeast Asia, save favourites, and book directly with verified vendors.</p>
    `,
    ctaLabel: "Browse venues",
    ctaUrl: args.appUrl,
  });
  const text = `Welcome to EventVenue.Asia, ${args.name}!\n\nVisit ${args.appUrl} to start browsing venues.\n`;
  return { subject, html, text };
}
