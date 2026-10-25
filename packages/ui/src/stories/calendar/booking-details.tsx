import { SquareArrowOutUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../../components/button/button";
import { PersonContact } from "../../components/person-contact/person-contact";
import type { AssetBooking } from "./calendar-types";
import { formatMoney } from "./money";

export type BookingDetailsProps = {
  booking: AssetBooking;
  /** Opens the booking's ticket: the card's one action. */
  onOpen?: () => void;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="pt-1 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

/** Who to call on each side: the customer's contact, then ours. */
function Contacts({ booking }: { booking: AssetBooking }) {
  const { client, contact } = booking;
  if (!client && !contact) return null;
  return (
    <dl className="grid grid-cols-[3.75rem_1fr] gap-x-3 gap-y-2.5 border-t pt-2.5">
      {client ? (
        <Row label="Client">
          <PersonContact
            size="compact"
            avatar={false}
            name={client.name}
            phone={client.phone}
            email={client.email}
          />
        </Row>
      ) : null}
      {contact ? (
        <Row label="Internal">
          <PersonContact
            size="compact"
            name={contact.person.name}
            phone={contact.person.phone}
            photoUrl={contact.person.photoUrl}
          />
        </Row>
      ) : null}
    </dl>
  );
}

/** Guests and what the booking is worth; a block says it is not sold. */
function subtitle({ booking }: { booking: AssetBooking }) {
  if (!booking.customer) return "Blocked, not sold";
  const guests = booking.headcount ? `${booking.headcount} guests` : booking.name;
  const value = booking.value ? `${formatMoney({ money: booking.value })} excl. VAT` : "";
  return [guests, value].filter(Boolean).join(" · ");
}

/** The client's name opens the ticket, like the icon beside it: two ways in, one place. */
function Title({ booking, onOpen }: BookingDetailsProps) {
  const title = booking.customer ?? booking.name;
  if (!onOpen || !booking.ticket) return <p className="font-medium">{title}</p>;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left font-medium underline-offset-2 outline-none hover:underline focus-visible:underline"
    >
      {title}
    </button>
  );
}

/**
 * A booking in the overview: the client, guests and value, notes, the way into the ticket, and
 * who to call on either side. Time and state are already on the block.
 */
export function BookingDetails({ booking, onOpen }: BookingDetailsProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid min-w-0">
          <Title booking={booking} onOpen={onOpen} />
          <p className="text-xs text-muted-foreground tabular-nums">{subtitle({ booking })}</p>
        </div>
        {onOpen && booking.ticket ? (
          <Button
            size="icon"
            variant="ghost"
            className="-my-1 -mr-1.5 size-8 shrink-0"
            onClick={onOpen}
            aria-label={`Open ${booking.ticket}`}
            title={`Open ${booking.ticket}`}
          >
            <SquareArrowOutUpRightIcon aria-hidden />
          </Button>
        ) : null}
      </div>
      {booking.notes ? <p className="text-xs leading-relaxed">{booking.notes}</p> : null}
      <Contacts booking={booking} />
    </div>
  );
}
