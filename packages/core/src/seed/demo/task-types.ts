/**
 * A demo task (ADR 0117, `docs/demo-seed.md`, Tasks): type, customer, item and people by name,
 * the linked order by its `ref` in the data files. The day is `day` (offset from the day of the
 * run) or the next `weekday` after today (ISO index, 0 = Monday); `from`/`to` are local times
 * (HH:MM) in the organization's zone, `to` only for a MEETING type.
 */
export type DemoTask = {
  type: string;
  customer: string;
  /** A contact person at the customer; left out = its first contact. */
  contact?: string;
  /** The order it is linked to, by `ref` (`task.linkOrder`); must be of the same customer. */
  order?: string;
  /** The item it names, e.g. the room to show. */
  item?: string;
  day?: number;
  weekday?: number;
  from: string;
  to?: string;
  /** The main assignee (ADR 0034), by user name, who is told. */
  assignee: string;
  note?: string;
  /** Marked done by the assignee (`task.complete`) on this day offset, at the task's end. */
  doneDay?: number;
};
