import { getCatalog } from "@bibi/i18n";
import {
  renderButton,
  renderEmailLayout,
  renderFallbackLink,
  renderHeading,
  renderParagraph,
} from "./layout";
import type { PasswordResetEmailInput, RenderedEmail } from "./types";

export function renderPasswordResetEmail({
  url,
  locale = "sv",
}: PasswordResetEmailInput): RenderedEmail {
  const catalog = getCatalog({ locale }) as unknown as {
    email?: {
      passwordReset?: {
        subject: string;
        heading: string;
        body: string;
        button: string;
        fallback: string;
        footer: string;
      };
    };
  };

  const copy = catalog.email?.passwordReset ?? {
    subject: locale === "en" ? "Reset your password" : "Återställ ditt lösenord",
    heading: locale === "en" ? "Reset your password" : "Återställ ditt lösenord",
    body:
      locale === "en"
        ? "Click the button below to choose a new password for your Bibi account."
        : "Klicka på knappen nedan för att välja ett nytt lösenord för ditt Bibi-konto.",
    button: locale === "en" ? "Reset password" : "Återställ lösenord",
    fallback:
      locale === "en"
        ? "If the button does not work, copy and paste this link into your browser:"
        : "Om knappen inte fungerar kan du kopiera och klistra in länken i din webbläsare:",
    footer:
      locale === "en"
        ? "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged."
        : "Om du inte har begärt att återställa lösenordet kan du ignorera detta meddelande. Ditt lösenord förblir oförändrat.",
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
