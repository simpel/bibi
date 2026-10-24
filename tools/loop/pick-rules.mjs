// Pure selection rules for pick.mjs, kept apart so they are tested without GitHub.
// A ticket is ready when it is open in Todo, has no open blockers, is no source:agent ticket, is not claimed or
// already in a pull request, and shares no area label with work in flight. Only one schema change is in flight at once.

const PRIORITY = ["P0", "P1", "P2"];
const SIZE = ["XS", "S", "M", "L", "XL"];
const rankOf = ({ list, value }) => (list.includes(value) ? list.indexOf(value) : list.length);

export const areasOf = ({ labels }) => labels.filter((l) => l.startsWith("area:"));
export const touchesSchema = ({ labels }) => labels.includes("area:db");

// Highest priority first, then the smallest, then the oldest.
export function rank({ tickets }) {
  return [...tickets].sort(
    (a, b) =>
      rankOf({ list: PRIORITY, value: a.priority }) -
        rankOf({ list: PRIORITY, value: b.priority }) ||
      rankOf({ list: SIZE, value: a.size }) - rankOf({ list: SIZE, value: b.size }) ||
      a.number - b.number,
  );
}

// inflight: [{ number, labels, schema }] from claims and open ticket/* pull requests.
export function whyNot({ ticket, inflight }) {
  if (ticket.status !== "Todo") return "not in Todo";
  if (ticket.labels.includes("source:agent")) return "source:agent";
  if (ticket.openBlockers.length) return `blocked by #${ticket.openBlockers.join(", #")}`;
  if (inflight.some((w) => w.number === ticket.number)) return "claimed or in a pull request";
  const areas = areasOf({ labels: ticket.labels });
  const clash = inflight.find((w) => areasOf({ labels: w.labels }).some((a) => areas.includes(a)));
  if (clash) return `shares an area with #${clash.number}`;
  if (touchesSchema({ labels: ticket.labels }) && inflight.some((w) => w.schema))
    return "another schema change is in flight";
  return null;
}

export function choose({ tickets, inflight }) {
  const skipped = [];
  for (const ticket of rank({ tickets })) {
    const reason = whyNot({ ticket, inflight });
    if (!reason) return { ticket, skipped };
    skipped.push({ number: ticket.number, reason });
  }
  return { ticket: null, skipped };
}
