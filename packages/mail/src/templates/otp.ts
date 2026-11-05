import { getCatalog } from "@bibi/i18n";
import {
  renderCodeBlock,
  renderEmailLayout,
  renderHeading,
  renderParagraph,
} from "./layout";
import type { OtpEmailInput, RenderedEmail } from "./types";

export function renderOtpEmail({ otp, locale = "sv" }: OtpEmailInput): RenderedEmail {
  const catalog = getCatalog({ locale }) as unknown as {
    email?: {
      otp?: {
        subject: string;
        heading: string;
        body: string;
        badge: string;
        footer: string;
      };
    };
  };

  const copy = catalog.email?.otp ?? {
    subject: locale === "en" ? "Your Bibi sign-in code" : "Din inloggningskod för Bibi",
    heading: locale === "en" ? "Your sign-in code" : "Din inloggningskod",
    body:
      locale === "en"
        ? "Use this one-time code to complete your sign-in to Bibi:"
        : "Använd denna engångskod för att slutföra din inloggning i Bibi:",
    badge: locale === "en" ? "Valid for 10 minutes" : "Giltig i 10 minuter",
    footer:
      locale === "en"
        ? "If you did not request this code, someone else may have entered your email by mistake."
        : "Om du inte har begärt denna kod kan någon ha angett din e-postadress av misstag.",
  };

  const contentHtml = `
${renderHeading({ text: copy.heading })}
${renderParagraph({ text: copy.body })}
${renderCodeBlock({ code: otp, caption: copy.badge })}
${renderParagraph({ text: copy.footer, muted: true })}
`.trim();

  const html = renderEmailLayout({
    contentHtml,
    locale,
    preheader: `${copy.heading}: ${otp}`,
  });

  const text = `${copy.body}\n\n${otp}\n\n${copy.badge}\n\n${copy.footer}`;

  return {
    subject: copy.subject,
    text,
    html,
  };
}
