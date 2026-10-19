import type { Feature } from "./features";

/**
 * Which feature owns each entity type (the `entityType` of audit rows, search hits and change
 * previews), ADR 0050 "Feature scope". Data of an entity is only shown to callers who may view
 * its feature; `self` entities belong to their owner and are filtered by core rules instead.
 * New entity type: add it here (the guard test fails otherwise).
 */
export const ENTITY_FEATURE: Readonly<Record<string, Feature | "self">> = {
  ticket: "ticket",
  occupancy: "ticket",
  assignment: "ticket",
  inboundEmail: "ticket",
  programItem: "program",
  requirement: "program",
  line: "program",
  customer: "customer",
  contact: "customer",
  quote: "quote",
  payment: "payment",
  paymentAccount: "paymentAccount",
  sheet: "sheet",
  item: "item",
  venue: "venue",
  priceList: "priceList",
  configuration: "configuration",
  entityType: "configuration",
  fieldDefinition: "configuration",
  vocabulary: "configuration",
  vocabularyValue: "configuration",
  setup: "configuration",
  ticketPhase: "pipeline",
  itemState: "pipeline",
  phaseGrid: "pipeline",
  phaseStateRule: "pipeline",
  pipelineSetup: "pipeline",
  ticketTemplate: "template",
  sheetDefinition: "template",
  responsibility: "responsibility",
  member: "member",
  invitation: "member",
  permission: "member",
  apiKey: "apiKey",
  auditLog: "audit",
  conversation: "self",
  message: "self",
  skill: "self",
  oauthGrant: "self",
  userPreference: "self",
  userSettings: "self",
  changeSet: "self",
  search: "self",
};

export type EntityFeatureInput = { entityType: string };

/** The feature that owns `entityType`, or `null` for an unknown type (fail closed). */
export function entityFeature({ entityType }: EntityFeatureInput): Feature | "self" | null {
  return ENTITY_FEATURE[entityType] ?? null;
}
