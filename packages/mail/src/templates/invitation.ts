import { getCatalog } from "@bibi/i18n";
import {
  renderButton,
  renderCodeBlock,
  renderEmailLayout,
  renderFallbackLink,
  renderHeading,
  renderParagraph,
} from "./layout";
import type { InvitationEmailInput, RenderedEmail } from "./types";

export function renderInvitationEmail({
  inviter,
  organization,
  url,
  code,
  locale = "sv",
}: InvitationEmailInput): RenderedEmail {
  const catalog = getCatalog({ locale }) as unknown as {
    email?: {
      invitation?: {
        subject: string;
        heading: string;
        body: string;
        button: string;
        codePrompt: string;
        codeInstructions: string;
        fallback: string;
      };
    };
  };

  const template = catalog.email?.invitation ?? {
    subject:
      locale === "en"
        ? `Invitation to ${organization} on Bibi`
        : `Inbjudan till ${organization} i Bibi`,
    heading:
      locale === "en"
        ? `${inviter} invited you to ${organization}`
        : `${inviter} har bjudit in dig till ${organization}`,
    body:
      locale === "en"
        ? `You have been invited to join ${organization} on Bibi.`
        : `Du har blivit inbjuden att gå med i ${organization} i Bibi.`,
    button: locale === "en" ? "Accept invitation" : "Acceptera inbjudan",
    codePrompt: locale === "en" ? "Or join with invite code:" : "Eller gå med med inbjudningskod:",
    codeInstructions:
      locale === "en"
        ? 'Sign in to Bibi, select "Join a different organization" and enter the code below:'
        : 'Logga in i Bibi, välj "Gå med i en annan organisation" och ange koden nedan:',
    fallback:
      locale === "en"
        ? "If the button does not work, copy and paste this link into your browser:"
        : "Om knappen inte fungerar kan du kopiera och klistra in länken i din webbläsare:",
  };

  const subject = template.subject.replace("{organization}", organization);
  const heading = template.heading
    .replace("{inviter}", inviter)
    .replace("{organization}", organization);
  const body = template.body.replace("{organization}", organization);

  const codeHtml = code
    ? renderCodeBlock({
        code,
        label: template.codePrompt,
        caption: template.codeInstructions,
      })
    : "";

  const contentHtml = `
${renderHeading({ text: heading })}
${renderParagraph({ text: body })}
${renderButton({ href: url, label: template.button })}
${codeHtml}
${renderFallbackLink({ url, label: template.fallback })}
`.trim();

  const html = renderEmailLayout({
    contentHtml,
    locale,
    preheader: `${inviter} invited you to ${organization} on Bibi`,
  });

  const acceptLine =
    locale === "en"
      ? `${inviter} has invited you to ${organization}.\n\nAccept: ${url}`
      : `${inviter} har bjudit in dig till ${organization}.\n\nAcceptera: ${url}`;
  const codeLine = code
    ? locale === "en"
      ? `\n\nOr sign in to Bibi, choose "Join a different organization" and enter the code ${code}.`
      : `\n\nEller logga in i Bibi, välj "Gå med i en annan organisation" och ange koden ${code}.`
    : "";
  const text = `${acceptLine}${codeLine}`;

  return {
    subject,
    text,
    html,
  };
}
