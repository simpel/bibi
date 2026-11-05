import { getEnv } from "@bibi/config";
import type { Locale } from "@bibi/i18n";
import { getCatalog } from "@bibi/i18n";

export function escapeHtml({ value }: { value: string }): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type EmailLayoutInput = {
  contentHtml: string;
  locale?: Locale;
  preheader?: string;
};

/**
 * Common HTML email shell for all Bibi emails.
 *
 * Adheres strictly to the Bibi Design System (DESIGN.md):
 * - Canvas background: #fdfcfa (Luminous alabaster / clean chalk)
 * - Brand logo: Full Bibi wordmark, positioned top-left, small (~24px height)
 * - Headings: Pitch black (#000000), Fraunces Light / serif
 * - Body copy: Espresso slate (#1c140e), Inter sans-serif
 * - Primary button: Nordic Spruce green (#1a4e30), linen ivory text (#fdfaf4)
 */
export function renderEmailLayout({
  contentHtml,
  locale = "sv",
  preheader,
}: EmailLayoutInput): string {
  const env = getEnv();
  const webUrl = env.WEB_URL.replace(/\/+$/, "");
  const logoUrl = `${webUrl}/wordmark.png`;
  const homeUrl = `${webUrl}/${locale}`;
  const catalog = getCatalog({ locale }) as unknown as { email?: { common?: Record<string, string> } };
  const common = catalog.email?.common ?? {};
  const automatedNotice =
    common.automatedNotice ??
    (locale === "en"
      ? "This is an automated message from Bibi."
      : "Detta är ett automatiskt meddelande från Bibi.");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bibi</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, span { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important; }
    h1, h2, h3 { font-family: Georgia, 'Times New Roman', serif !important; font-weight: normal !important; }
  </style>
  <![endif]-->
  <!--[if !mso]><!-->
  <style type="text/css">
    @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400&family=Inter:wght@400;500;600&display=swap");
  </style>
  <!--<![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #fdfcfa;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      text-decoration: none;
      display: block;
    }
    a {
      color: #1a4e30;
      text-decoration: underline;
    }
  </style>
</head>
<body bgcolor="#fdfcfa" style="margin: 0; padding: 0; background-color: #fdfcfa; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c140e;">
  ${
    preheader
      ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">${escapeHtml({ value: preheader })}</div>`
      : ""
  }
  <table role="presentation" width="100%" bgcolor="#fdfcfa" border="0" cellspacing="0" cellpadding="0" style="background-color: #fdfcfa;">
    <tr>
      <td align="center" style="padding: 40px 20px 48px 20px;">
        <!--[if (gte mso 9)|(IE)]>
        <table width="540" align="center" border="0" cellspacing="0" cellpadding="0">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; text-align: left;">
          <!-- Header with Logo up to the left (rendered once per email) -->
          <tr>
            <td align="left" style="padding-bottom: 36px;">
              <a href="${homeUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
                <img src="${logoUrl}" alt="Bibi" width="72" height="48" border="0" style="width: 72px; max-width: 72px; height: 48px; display: block; border: 0;" />
              </a>
            </td>
          </tr>
          <!-- Main Content Area (Option A: Full Bleed seamless canvas) -->
          <tr>
            <td align="left" style="padding-bottom: 40px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer (clean automated notice, no duplicate logo) -->
          <tr>
            <td align="left" style="border-top: 1px solid #e5e3de; padding-top: 24px; color: #5f564e; font-size: 13px; line-height: 20px;">
              <p style="margin: 0; color: #5f564e; font-size: 12px; line-height: 18px;">
                ${escapeHtml({ value: automatedNotice })}
              </p>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type RenderButtonInput = {
  href: string;
  label: string;
};

/** Primary action button matching Bibi design tokens (Nordic Spruce #1a4e30, linen ivory text). */
export function renderButton({ href, label }: RenderButtonInput): string {
  return `
<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 24px 0;">
  <tr>
    <td align="center" bgcolor="#1a4e30" style="border-radius: 6px; background-color: #1a4e30; padding: 12px 28px;">
      <a href="${escapeHtml({ value: href })}" target="_blank" style="display: inline-block; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 500; color: #fdfaf4; text-decoration: none; border-radius: 6px; letter-spacing: 0.01em;">
        ${escapeHtml({ value: label })}
      </a>
    </td>
  </tr>
</table>`;
}

export type RenderCodeBlockInput = {
  code: string;
  label?: string;
  caption?: string;
};

/** Clear design language for invite codes & one-time codes (tracked numerals in clean container). */
export function renderCodeBlock({ code, label, caption }: RenderCodeBlockInput): string {
  return `
<table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#f5f3f0" style="margin: 24px 0; background-color: #f5f3f0; border: 1px solid #e5e3de; border-radius: 8px;">
  <tr>
    <td align="center" bgcolor="#f5f3f0" style="padding: 20px 24px;">
      ${
        label
          ? `<div style="font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #5f564e; margin-bottom: 8px;">${escapeHtml({ value: label })}</div>`
          : ""
      }
      <div style="font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 28px; font-weight: 600; letter-spacing: 0.22em; color: #000000; text-indent: 0.22em; line-height: 1.2;">
        ${escapeHtml({ value: code })}
      </div>
      ${
        caption
          ? `<div style="font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; color: #5f564e; margin-top: 10px; line-height: 18px;">${escapeHtml({ value: caption })}</div>`
          : ""
      }
    </td>
  </tr>
</table>`;
}

export type RenderFallbackLinkInput = {
  url: string;
  label: string;
};

/** Muted fallback URL link when email client buttons cannot be clicked. */
export function renderFallbackLink({ url, label }: RenderFallbackLinkInput): string {
  return `
<div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e3de;">
  <p style="font-family: Inter, sans-serif; font-size: 12px; line-height: 18px; color: #5f564e; margin: 0 0 6px 0;">
    ${escapeHtml({ value: label })}
  </p>
  <p style="margin: 0; word-break: break-all; line-height: 18px;">
    <a href="${escapeHtml({ value: url })}" style="font-family: Inter, sans-serif; font-size: 12px; color: #1a4e30; text-decoration: underline;">
      ${escapeHtml({ value: url })}
    </a>
  </p>
</div>`;
}

export function renderHeading({ text }: { text: string }): string {
  return `<h1 style="font-family: Fraunces, Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 400; line-height: 1.25; color: #000000; letter-spacing: -0.02em; margin: 0 0 18px 0;">${escapeHtml({ value: text })}</h1>`;
}

export type RenderParagraphInput = { text: string; muted?: boolean };

export function renderParagraph({ text, muted = false }: RenderParagraphInput): string {
  return `<p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 24px; color: ${muted ? "#5f564e" : "#1c140e"}; margin: 0 0 16px 0;">${escapeHtml({ value: text })}</p>`;
}
