import type { Feature } from "./features";

/**
 * Which feature owns each entity type (the `entityType` of audit rows, search hits and change
 * previews), ADR 0050 "Feature scope". Data of an entity is only shown to callers who may view
 * its feature; `self` entities belong to their owner and are filtered by core rules instead.
 * New entity type: add it here (the guard test fails otherwise).
 */
export const ENTITY_FEATURE: Readonly<Record<string, Feature | "self">> = {
  order: "order",
  occupancy: "order",
  orderStatusChange: "order",
  assignment: "order",
  inboundEmail: "order",
  inboundMessage: "inbox",
  inboundEndpoint: "configuration",
  programItem: "program",
  requirement: "program",
  line: "program",
  lineAllocation: "program",
  alternativeGroup: "program",
  lineStateChange: "program",
  customer: "customer",
  contact: "customer",
  quote: "quote",
  payment: "payment",
  deposit: "payment",
  invoice: "payment",
  finance: "finance",
  accountingSettings: "finance",
  accountingExport: "finance",
  paymentAccount: "paymentAccount",
  paymentSettings: "paymentAccount",
  integrationConnection: "integration",
  billingAccount: "billing",
  runSheet: "runSheet",
  item: "item",
  itemDemand: "item",
  memberProfile: "item",
  venue: "venue",
  priceList: "priceList",
  configuration: "configuration",
  entityType: "configuration",
  fieldDefinition: "configuration",
  vocabulary: "configuration",
  vocabularyValue: "configuration",
  setup: "configuration",
  organizationProfile: "configuration",
  orderStatus: "pipeline",
  board: "board",
  boardPhase: "board",
  itemState: "pipeline",
  statusGrid: "pipeline",
  statusStateRule: "pipeline",
  pipelineSetup: "pipeline",
  orderTemplate: "template",
  runSheetDefinition: "template",
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
  notification: "self",
  notificationPreference: "self",
  userSettings: "self",
  profile: "self",
  workingHours: "self",
  file: "self",
  changeSet: "self",
  search: "self",
};

export type EntityFeatureInput = { entityType: string };

/** The feature that owns `entityType`, or `null` for an unknown type (fail closed). */
export function entityFeature({ entityType }: EntityFeatureInput): Feature | "self" | null {
  return ENTITY_FEATURE[entityType] ?? null;
}
