/** Stripe statuses a subscription never leaves: it no longer pays and needs a new checkout. */
const TERMINAL = new Set(["canceled", "incomplete_expired"]);

export const isTerminalStatus = ({ status }: { status: string | null | undefined }) =>
  !status || TERMINAL.has(status);
