import type { CalendarDetails } from "@bibi/core/schemas";
import type { AssetBooking, CalendarPerson } from "@bibi/ui";
import { fileUrl } from "@/lib/file-url";

/** Why the contact is the one to call: the line's own assignee, or the ticket's. */
export type ContactVia = { LINE: string; TICKET: string };

type Details = Pick<
  AssetBooking,
  "customer" | "client" | "headcount" | "value" | "notes" | "contact" | "staff" | "quantity"
>;

/** Our contact as a person: their profile is visible to colleagues (ADR 0072). */
const personOf = ({ contact }: { contact: NonNullable<CalendarDetails["contact"]> }) =>
  ({
    id: contact.userId,
    name: contact.name,
    role: "",
    ...(contact.phone ? { phone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.avatarKey ? { photoUrl: fileUrl({ key: contact.avatarKey }) } : {}),
  }) satisfies CalendarPerson;

const clientOf = ({ client }: Pick<CalendarDetails, "client">) =>
  client
    ? {
        name: client.name,
        ...(client.phone ? { phone: client.phone } : {}),
        ...(client.email ? { email: client.email } : {}),
      }
    : undefined;

/**
 * A block's details as the booking card reads them (ADR 0071 view read model): hidden fields stay
 * off the booking, so the card simply leaves their row out.
 */
export function bookingDetailsOf({
  details,
  via,
}: {
  details: CalendarDetails;
  via: ContactVia;
}): Details {
  const { contact, valueMinor, staff } = details;
  const client = clientOf(details);
  const people = staff.filter((unit) => unit.person);
  return {
    customer: details.customer,
    quantity: details.quantity ?? 1,
    ...(client ? { client } : {}),
    ...(details.headcount ? { headcount: details.headcount } : {}),
    ...(valueMinor !== null
      ? { value: { amount: valueMinor / 100, currency: details.currency } }
      : {}),
    ...(details.note ? { notes: details.note } : {}),
    ...(contact
      ? {
          contact: {
            person: personOf({ contact }),
            via: via[contact.via],
            ...(contact.via === "TICKET" ? { inherited: true } : {}),
          },
        }
      : {}),
    ...(people.length > 0
      ? { staff: people.map((unit) => ({ id: unit.itemId, name: unit.name, role: unit.type })) }
      : {}),
  };
}
