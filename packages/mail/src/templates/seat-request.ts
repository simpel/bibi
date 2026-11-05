import { getCatalog } from "@bibi/i18n";
import {
  renderButton,
  renderEmailLayout,
  renderFallbackLink,
  renderHeading,
  renderParagraph,
} from "./layout";
import type { RenderedEmail, SeatRequestEmailInput } from "./types";

export function renderSeatRequestEmail({
  who,
  organization,
  inviteeEmail,
  url,
  adminName,
  locale = "sv",
}: SeatRequestEmailInput): RenderedEmail {
  const catalog = getCatalog({ locale }) as unknown as {
    email?: {
      seatRequest?: {
        subject: string;
        heading: string;
        greeting: string;
        greetingDefault: string;
        bodyRequested: string;
        bodyInvited: string;
        button: string;
        note: string;
      };
    };
  };

  const copy = catalog.email?.seatRequest ?? {
    subject:
      locale === "en"
        ? `A seat is waiting for your approval in ${organization}`
        : `En användarplats väntar på ditt godkännande i ${organization}`,
    heading:
      locale === "en" ? "Seat approval needed" : "Ny användarplats behöver godkännas",
    greeting: locale === "en" ? "Hi {name}," : "Hej {name},",
    greetingDefault: locale === "en" ? "Hi," : "Hej,",
    bodyRequested:
      locale === "en"
        ? `${who} asked to join ${organization} on Bibi, but all seats are taken.`
        : `${who} har bett om att få gå med i ${organization} i Bibi, men alla platser är upptagna.`,
    bodyInvited:
      locale === "en"
        ? `${who} invited ${inviteeEmail ?? "someone"} to ${organization} on Bibi, but all seats are taken.`
        : `${who} har bjudit in ${inviteeEmail ?? "någon"} till ${organization} i Bibi, men alla platser är upptagna.`,
    button: locale === "en" ? "Review seat request" : "Hantera förfrågan",
    note:
      locale === "en"
        ? "Approve it to add a seat (49 SEK a month), or decline the request."
        : "Ett godkännande lägger till en plats på er prenumeration (49 kr/månad). Du kan även avböja förfrågan.",
  };

  const subject = copy.subject.replace("{organization}", organization);
  const greeting = adminName?.trim()
    ? copy.greeting.replace("{name}", adminName.trim())
    : copy.greetingDefault;
  const description = inviteeEmail
    ? copy.bodyInvited
        .replace("{who}", who)
        .replace("{invitee}", inviteeEmail)
        .replace("{organization}", organization)
    : copy.bodyRequested.replace("{who}", who).replace("{organization}", organization);

  const fallbackText =
    locale === "en"
      ? "If the button does not work, review the request at:"
      : "Om knappen inte fungerar kan du granska förfrågan på:";

  const contentHtml = `
${renderHeading({ text: copy.heading })}
${renderParagraph({ text: greeting })}
${renderParagraph({ text: description })}
${renderParagraph({ text: copy.note, muted: true })}
${renderButton({ href: url, label: copy.button })}
${renderFallbackLink({ url, label: fallbackText })}
`.trim();

  const html = renderEmailLayout({
    contentHtml,
    locale,
    preheader: description,
  });

  const text = [
    greeting,
    description,
    `${copy.note}\n${url}`,
    "— Bibi",
  ].join("\n\n");

  return {
    subject,
    text,
    html,
  };
}
