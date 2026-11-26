/** The kinds of record with their own page that are restored and deleted (ADR 0118). */
export const LIFECYCLE_KINDS = [
  "task",
  "customer",
  "item",
  "venue",
  "order",
  "orderTemplate",
  "priceList",
  "entityType",
  "vocabulary",
  "responsibility",
  "runSheetDefinition",
  "skill",
  "orderStatus",
  "itemTypeGroup",
] as const;

export type LifecycleKind = (typeof LIFECYCLE_KINDS)[number];

type ToLifecycleKindInput = { kind: string };

/** The kind as a `LifecycleKind`, or null for one the web app has no restore and delete for. */
export function toLifecycleKind({ kind }: ToLifecycleKindInput): LifecycleKind | null {
  return LIFECYCLE_KINDS.find((known) => known === kind) ?? null;
}
