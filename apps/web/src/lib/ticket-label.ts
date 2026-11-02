export type TicketNameInput = {
  title: string | null;
  /** The label for a ticket without a title, e.g. "Ticket #41" or "#41". */
  fallback: string;
};

/** The ticket's title is its primary label everywhere; the reference only backs it up. */
export const ticketName = ({ title, fallback }: TicketNameInput): string => title ?? fallback;
