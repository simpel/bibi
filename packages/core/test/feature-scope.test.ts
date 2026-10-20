import { describe, expect, it } from "vitest";
import { applyPaymentAccountSignal } from "../src/features/payment-account/apply-signal-operation";
import {
  type AnyOperation,
  applyPaymentSignal,
  createCoreOperations,
  SEARCHABLE_ENTITIES,
} from "../src/index";
import { ENTITY_FEATURE } from "../src/permissions/entity-features";
import { fakeEmbed } from "./fake-embed";
import { outputKeys } from "./feature-scope-walk";

const OPERATIONS: readonly AnyOperation[] = [
  ...createCoreOperations({ embed: fakeEmbed }),
  applyPaymentSignal,
  applyPaymentAccountSignal,
];

const featureOf = ({ operation }: { operation: AnyOperation }) =>
  operation.permission.slice(0, operation.permission.lastIndexOf(":"));

/**
 * Operations whose permission feature deliberately differs from their entity type's owner
 * (ADR 0050). Keep this short; each needs a reason.
 */
const PERMISSION_EXCEPTIONS: Readonly<Record<string, string>> = {
  "skill.share":
    "copies the caller's own (self) skill into the organization's shared skills, which is " +
    "managing the organization's assistant (assistant:write)",
};

/** Key prefix → the feature that owns data named like that. */
const PREFIX_FEATURE: Readonly<Record<string, string>> = {
  customer: "customer",
  contact: "customer",
  item: "item",
  venue: "venue",
  quote: "quote",
  payment: "payment",
  pricelist: "priceList",
  program: "program",
  programitem: "program",
  ticket: "ticket",
  sheet: "sheet",
};

const FOREIGN_KEY =
  /^(customer|contact|item|venue|quote|payment|priceList|programItem|program|ticket|sheet)(Name|Email|Phone|Address|Total|Price|Amount)/i;

/**
 * `<operation entity>:<key>` pairs that look like another feature's data but are not, or are
 * snapshots the rule permits (the copy belongs to the copying feature, ADR 0050).
 */
const OUTPUT_EXCEPTIONS: Readonly<Record<string, string>> = {
  "venue:contactEmail": "the venue's own contact details, not a customer contact",
  "venue:contactPhone": "the venue's own contact details, not a customer contact",
  "sheet:itemName": "sheet rows are a snapshot copied with item:read at generate time",
  "sheet:programItemName": "sheet rows are a snapshot copied with program:read at generate time",
};

describe("feature scope guard (ADR 0050)", () => {
  it("gives every operation's and searchable entity type an owner in ENTITY_FEATURE", () => {
    const types = [
      ...OPERATIONS.map((operation) => operation.entityType),
      ...SEARCHABLE_ENTITIES.map((entity) => entity.entityType),
    ];
    expect(types.filter((type) => !(type in ENTITY_FEATURE))).toEqual([]);
  });

  it("permissions each operation by its entity type's owner, or self", () => {
    const wrong = OPERATIONS.filter((operation) => {
      const feature = featureOf({ operation });
      if (feature === "self" || operation.name in PERMISSION_EXCEPTIONS) return false;
      return ENTITY_FEATURE[operation.entityType] !== feature;
    }).map((op) => `${op.name} (${op.permission}, ${op.entityType})`);
    expect(wrong).toEqual([]);
  });

  it("never names another feature's data in an operation's output", () => {
    const leaks = OPERATIONS.flatMap((operation) => {
      const own = featureOf({ operation });
      return outputKeys({ schema: operation.output })
        .filter((key) => {
          const match = FOREIGN_KEY.exec(key);
          if (!match?.[1]) return false;
          if (`${operation.name.split(".")[0]}:${key}` in OUTPUT_EXCEPTIONS) return false;
          return PREFIX_FEATURE[match[1].toLowerCase()] !== own;
        })
        .map((key) => `${operation.name}:${key}`);
    });
    expect(leaks).toEqual([]);
  });
});
