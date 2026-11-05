import { getCatalog } from "@bibi/i18n";
import {
  renderButton,
  renderEmailLayout,
  renderFallbackLink,
  renderHeading,
  renderParagraph,
} from "./layout";
import type { MagicLinkEmailInput, RenderedEmail } from "./types";

export function renderMagicLinkEmail({ url, locale = "sv" }: MagicLinkEmailInput): RenderedEmail {
  const catalog = getCatalog({ locale }) as unknown as {
    email?: {
      magicLink?: {
        subject: string;
        heading: string;
        body: string;
        button: string;
        fallback: string;
        footer: string;
      };
    };
  };

  const copy = catalog.email?.magicLink ?? {
    subject: locale === "en" ? "Sign in to Bibi" : "Logga in i Bibi",
    heading: locale === "en" ? "Sign in to Bibi" : "Logga in i Bibi",
    body:
      locale === "en"
        ? "Click the button below to sign in to Bibi. The link is valid for 15 minutes."
        : "Klicka på knappen nedan för att logga in i Bibi. Länken är giltig i 15 minuter.",
    button: locale === "en" ? "Sign in to Bibi" : "Logga in i Bibi",
    fallback:
      locale === "en"
        ? "If the button does not work, copy and paste this link into your browser:"
        : "Om knappen inte fungerar kan du kopiera och klistra in länken i din webbläsare:",
    footer:
      locale === "en"
        ? "If you did not request this link, you can safely ignore this email."
        : "Om du inte har begärt den här länken kan du ignorera detta meddelande.",
  };

  const contentHtml = `
${renderHeading({ text: copy.heading })}
${renderParagraph({ text: copy.body })}
${renderButton({ href: url, label: copy.button })}
${renderParagraph({ text: copy.footer, muted: true })}
${renderFallbackLink({ url, label: copy.fallback })}
`.trim();

  const html = renderEmailLayout({
    contentHtml,
    locale,
    preheader: copy.body,
  });

  const text = `${copy.body}\n\n${url}\n\n${copy.footer}`;

  return {
    subject: copy.subject,
    text,
    html,
  };
}
