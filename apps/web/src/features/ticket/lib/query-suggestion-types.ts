import type { TicketQualifier } from "@bibi/core/schemas";

/** Icons of the rows: a qualifier's own, or a special people row. */
export type QueryIcon = TicketQualifier | "none" | "some" | "me" | "exclude";

export type QueryVisual =
  | { kind: "icon"; icon: QueryIcon }
  | { kind: "avatar"; name: string; photoUrl: string | null };

/** One row of the search's dropdown and the text it puts in place of the word under the caret. */
export type QuerySuggestion = {
  id: string;
  label: string;
  /** Muted text after the label: a qualifier's hint, a member's email. */
  detail?: string;
  visual: QueryVisual;
  text: string;
  /** The text ends in a qualifier (`assignee:`): no space after it, its values come next. */
  open?: boolean;
};

/** Texts of the rows, from `ticket.query` in the UI language. */
export type QueryTexts = {
  labels: Record<TicketQualifier, string>;
  hints: Record<TicketQualifier, string>;
  noAssignee: string;
  hasAssignee: string;
  me: string;
  exclude: Record<"assignee" | "follower", string>;
};

/** Values offered per qualifier (names the caller may view), prepared on the server. */
export type QueryCatalog = Partial<Record<TicketQualifier, string[]>>;

/** What the server search found for the word being typed. */
export type QueryRemote = {
  members: { userId: string; name: string; email: string; photoUrl: string | null }[];
  customers: { id: string; name: string }[];
};
