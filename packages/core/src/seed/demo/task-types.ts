/** A room on a demo task (ADR 0120): named only, or held for its own window. */
export type DemoTaskItem = {
  /** The item by name; a room of a BOOKABLE type. */
  item: string;
  hold: "RELATED" | "PREBOOK" | "BOOK";
  /** PREBOOK and BOOK: the window's day offset and local times (HH:MM). */
  day?: number;
  from?: string;
  to?: string;
};

/**
 * A demo task (ADR 0117, 0120, `docs/demo-seed.md`, Tasks): type, customer, rooms and people by
 * name, the linked order by its `ref` in the data files. Only the type and the assignee are
 * required. The due day is `day` (offset from the day of the run) or the next `weekday` after
 * today (ISO index, 0 = Monday) and `due` is the local due time (HH:MM) in the organization's
 * zone; without `due` the task has no due time.
 */
export type DemoTask = {
  type: string;
  /** Left out = a task without a customer (then no contact and no order). */
  customer?: string;
  /** A contact person at the customer; left out = its first contact. */
  contact?: string;
  /** The order it is linked to, by `ref` (`task.linkOrder`); must be of the same customer. */
  order?: string;
  items?: readonly DemoTaskItem[];
  day?: number;
  weekday?: number;
  due?: string;
  /** The main assignee (ADR 0034), by user name, who is told. */
  assignee: string;
  note?: string;
  /**
   * The pipeline status (ADR 0121) of a task without an order, by name, moved there with
   * `task.move`; left out = the status it starts in.
   */
  status?: string;
  /** Marked done by the assignee (`task.complete`) on this day offset, at the due time. */
  doneDay?: number;
};
