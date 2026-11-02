import { getTicket } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import { ticketName } from "@/lib/ticket-label";
import { runOperation } from "@/server/run-operation";

/** The ticket the message is attached to, by its title; a generic link when it cannot be read. */
export async function AttachedTicket({ ticketId }: { ticketId: string }) {
  const t = await getTranslations("inbox");
  const ticket = await runOperation({ operation: getTicket, input: { id: ticketId } });
  const href = ticketRoute({ id: ticketId });
  if (!ticket.ok) {
    return (
      <p className="text-sm">
        <Link href={href} className="underline">
          {t("attachedTo")}
        </Link>
      </p>
    );
  }
  const { title, reference } = ticket.value;
  const name = ticketName({ title, fallback: `#${reference}` });
  return (
    <p className="text-sm">
      {t.rich("attachedToTicket", {
        ticket: () => (
          <Link href={href} className="font-medium underline">
            {name}
          </Link>
        ),
      })}
    </p>
  );
}
