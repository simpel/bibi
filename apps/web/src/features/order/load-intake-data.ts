import "server-only";
import {
  type EntityTypeDto,
  listCustomers,
  listOrderTemplates,
  type OrderTemplateDto,
  type Result,
} from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import { fileUrl } from "@/lib/file-url";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { runOperation } from "@/server/run-operation";
import { getSessionState } from "@/server/session";
import type { CustomerOption } from "../customer/actions";
import type { CatalogItem, IntakeCatalog } from "./intake/catalog";
import type { CustomerTypeOption } from "./intake/customer-type-option";
import { draftKey } from "./intake/intake-draft";
import type { IntakeSlot } from "./intake/intake-slot";
import type { PackageOption } from "./intake/package-groups";
import { loadIntakeCatalog } from "./load-intake-catalog";

/** What the intake page needs before its first step (ADR 0081). */
export type IntakeData = {
  /** The 5 customers with the latest orders, shown while the search is empty. */
  recent: CustomerOption[];
  customerTypes: CustomerTypeOption[];
  contactTypes: NamedOption[];
  /** Every active package, for step 3; empty without `orderTemplate:read`. */
  packages: PackageOption[];
  /** `orderTemplate:write`: step 3 offers Create package. */
  canCreatePackage: boolean;
  /** Where this member's draft for this organization is kept in the browser. */
  draftKey: string;
  /** Items, types, need values and members for step 4 and the line dialog. */
  catalog: IntakeCatalog;
  /** The calendar slot the intake starts from, or null (spec "Starting from the calendar"). */
  slot: IntakeSlot | null;
};

const typesOf = ({ base }: { base: "CUSTOMER" | "CONTACT" }) => loadEntityTypesOf({ base });

const active = ({ types }: { types: EntityTypeDto[] }) =>
  types.filter(({ status }) => status === "ACTIVE");

const named = ({ types }: { types: EntityTypeDto[] }): NamedOption[] =>
  active({ types }).map(({ id, name }) => ({ id, name }));

const customerTypeOptions = ({ types }: { types: EntityTypeDto[] }): CustomerTypeOption[] =>
  active({ types }).map(({ id, name, buyerKind }) => ({
    ...{ id, name },
    buyerKind: buyerKind ?? "BUSINESS",
  }));

type ToPackageInput = { template: OrderTemplateDto; items: ReadonlyMap<string, CatalogItem> };

/** A package with its lines' pictures from the catalog it already loaded (no extra read). */
const toPackage = ({ template, items }: ToPackageInput): PackageOption => ({
  id: template.id,
  name: template.name,
  minGuests: template.minGuests,
  maxGuests: template.maxGuests,
  entityTypeId: template.entityTypeId,
  fields: template.fields,
  imageUrl: template.imageKey ? fileUrl({ key: template.imageKey }) : null,
  lines: template.lines.map(({ name, itemId }) => {
    const item = itemId ? items.get(itemId) : undefined;
    return { name, icon: item?.icon ?? null, imageUrl: item?.imageUrl ?? null };
  }),
  itemIds: template.lines.flatMap(({ itemId }) => (itemId ? [itemId] : [])),
});

/** A refusal for a list the page can work without counts as an empty list. */
const itemsOr = <T>({ result }: { result: Result<{ items: T[] }> }): T[] =>
  result.ok ? result.value.items : [];

export async function loadIntakeData(): Promise<Result<IntakeData>> {
  // The layout already resolved the caller, so this read is free and gives the catalog its user.
  const abilities = await getCallerAbilities();
  const [recent, customerTypes, contactTypes, templates, session, catalog] = await Promise.all([
    runOperation({ operation: listCustomers, input: { recent: true, limit: 5 } }),
    typesOf({ base: "CUSTOMER" }),
    typesOf({ base: "CONTACT" }),
    runOperation({ operation: listOrderTemplates, input: { limit: 100 } }),
    getSessionState(),
    loadIntakeCatalog({ userId: abilities.userId }),
  ]);
  if (!catalog.ok) return catalog;
  if (!customerTypes.ok) return customerTypes;
  if (!contactTypes.ok) return contactTypes;
  const itemsById = new Map(catalog.value.items.map((item) => [item.id, item]));
  const organizationId = session.status === "ready" ? session.organizationId : "";
  return {
    ok: true,
    value: {
      recent: itemsOr({ result: recent }).map(({ id, name }) => ({ id, name })),
      customerTypes: customerTypeOptions({ types: customerTypes.value.items }),
      contactTypes: named({ types: contactTypes.value.items }),
      packages: itemsOr({ result: templates })
        .filter(({ status }) => status === "ACTIVE")
        .map((template) => toPackage({ template, items: itemsById })),
      canCreatePackage: can({ abilities, permission: "orderTemplate:write" }),
      draftKey: draftKey({ organizationId, userId: abilities.userId ?? "" }),
      catalog: catalog.value,
      slot: null,
    },
  };
}
