import type { Locale } from "@bibi/i18n";
import {
  escapeHtml,
  renderButton,
  renderEmailLayout,
  renderFallbackLink,
  renderHeading,
  renderParagraph,
} from "./layout";
import { getReservationCopy, type ReservationMailKind } from "./reservation-copy";
import type { RenderedEmail } from "./types";

export type { ReservationMailKind };

/** Everything a table-reservation mail needs; times arrive already formatted in the venue's zone. */
export type ReservationMailInput = {
  kind: ReservationMailKind;
  locale: Locale;
  to: string;
  restaurant: {
    name: string;
    logoUrl?: string | null;
    accentColor?: string | null;
    phone?: string | null;
    email?: string | null;
    policy?: string | null;
  };
  reservation: {
    dateLabel: string;
    timeLabel: string;
    partySize: number;
    bookerName: string;
    note?: string | null;
  };
  manageUrl: string;
  bookUrl: string;
};

export type RenderReservationEmailInput = Omit<ReservationMailInput, "to">;

const oneLine = ({ value }: { value: string }) => value.replace(/\s+/g, " ").trim();

function detailRow({ label, value }: { label: string; value: string }): string {
  return `<tr>
  <td style="padding: 6px 16px 6px 0; font-family: Inter, sans-serif; font-size: 13px; color: #5f564e; vertical-align: top; white-space: nowrap;">${escapeHtml({ value: label })}</td>
  <td style="padding: 6px 0; font-family: Inter, sans-serif; font-size: 15px; color: #1c140e; white-space: pre-line;">${escapeHtml({ value })}</td>
</tr>`;
}

/** Pure render of one of the four guest mails about a table reservation (subject, html, text). */
export function renderReservationEmail({
  kind,
  locale,
  restaurant,
  reservation,
  manageUrl,
  bookUrl,
}: RenderReservationEmailInput): RenderedEmail {
  const copy = getReservationCopy({ locale });
  const kindCopy = copy.kinds[kind];
  const restaurantName = oneLine({ value: restaurant.name });
  const fill = ({ template }: { template: string }) =>
    template.replace("{restaurant}", restaurantName);
  const subject = fill({ template: kindCopy.subject });
  const greeting = copy.greeting.replace("{name}", oneLine({ value: reservation.bookerName }));
  const intro = fill({ template: kindCopy.intro });
  const party = (reservation.partySize === 1 ? copy.partyOne : copy.partyMany).replace(
    "{count}",
    String(reservation.partySize),
  );
  const note = reservation.note?.trim();
  const rows = [
    { label: copy.date, value: reservation.dateLabel },
    { label: copy.time, value: reservation.timeLabel },
    { label: copy.party, value: party },
    { label: copy.name, value: reservation.bookerName },
    ...(note ? [{ label: copy.note, value: note }] : []),
  ];
  const contact = [restaurant.phone?.trim(), restaurant.email?.trim()].filter(
    (part): part is string => Boolean(part),
  );
  const policy = restaurant.policy?.trim();
  const isCancelled = kind === "cancelled";
  const actionUrl = isCancelled ? bookUrl : manageUrl;
  const actionLabel = isCancelled ? copy.bookButton : copy.manageButton;

  const contentHtml = `
${renderHeading({ text: copy.kinds[kind].heading })}
${renderParagraph({ text: greeting })}
${renderParagraph({ text: intro })}
<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 8px 0 16px 0;">
${rows.map(detailRow).join("\n")}
</table>
${renderButton({ href: actionUrl, label: actionLabel, accentColor: restaurant.accentColor })}
${renderParagraph({ text: kindCopy.manageNote, muted: true })}
${contact.length > 0 ? renderParagraph({ text: `${copy.contact}: ${contact.join(" · ")}`, muted: true }) : ""}
${policy ? `${renderParagraph({ text: copy.policy, muted: true })}${renderParagraph({ text: policy, muted: true })}` : ""}
${renderFallbackLink({ url: actionUrl, label: copy.fallback })}
`.trim();

  const html = renderEmailLayout({
    contentHtml,
    locale,
    preheader: `${intro} ${reservation.dateLabel} ${reservation.timeLabel}`,
    branding: {
      name: restaurantName,
      logoUrl: restaurant.logoUrl,
      accentColor: restaurant.accentColor,
      poweredBy: copy.poweredBy,
    },
  });

  const text = [
    copy.kinds[kind].heading,
    greeting,
    intro,
    rows.map(({ label, value }) => `${label}: ${value}`).join("\n"),
    `${actionLabel}: ${actionUrl}`,
    kindCopy.manageNote,
    ...(contact.length > 0 ? [`${copy.contact}: ${contact.join(" · ")}`] : []),
    ...(policy ? [`${copy.policy}:\n${policy}`] : []),
    `— ${restaurantName}`,
  ].join("\n\n");

  return { subject, html, text };
}
