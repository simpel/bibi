import { getCatalog } from "@bibi/i18n";
import {
  renderButton,
  renderEmailLayout,
  renderFallbackLink,
  renderHeading,
  renderParagraph,
} from "./layout";
import type { ReminderEmailInput, RenderedEmail } from "./types";

export function renderReminderEmail({
  who,
  organization,
  url,
  adminName,
  locale = "sv",
}: ReminderEmailInput): RenderedEmail {
  const catalog = getCatalog({ locale }) as unknown as {
    email?: {
      reminder?: {
        subject: string;
        heading: string;
        greeting: string;
        greetingDefault: string;
        body: string;
        button: string;
        note: string;
      };
    };
  };

  const copy = catalog.email?.reminder ?? {
    subject:
      locale === "en"
        ? "Your team is waiting to get back into Bibi"
        : "Ditt team väntar på att komma tillbaka in i Bibi",
    heading:
      locale === "en"
        ? "Keep your team up and running"
        : "Håll igång teamet i Bibi",
    greeting: locale === "en" ? "Hi {name}," : "Hej {name},",
    greetingDefault: locale === "en" ? "Hi," : "Hej,",
    body:
      locale === "en"
        ? `${who} just tried to open Bibi for ${organization}. The free trial is over, so Bibi is waiting for payment details before the team can carry on.`
        : `${who} försökte precis öppna Bibi för ${organization}. Provperioden har löpt ut, och Bibi väntar på betalningsuppgifter så att teamet kan fortsätta.`,
    button: locale === "en" ? "Add payment details" : "Lägg till betalningsuppgifter",
    note:
      locale === "en"
        ? "It only takes a minute to get everyone back up and running."
        : "Det tar bara en minut att komma igång igen.",
  };

  const subject = copy.subject;
  const greeting = adminName?.trim()
    ? copy.greeting.replace("{name}", adminName.trim())
    : copy.greetingDefault;
  const description = copy.body
    .replace("{who}", who)
    .replace("{organization}", organization);

  const fallbackText =
    locale === "en"
      ? "If the button does not work, add details directly at:"
      : "Om knappen inte fungerar kan du ange uppgifter på:";

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
