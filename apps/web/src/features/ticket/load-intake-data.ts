import "server-only";
import {
  type EntityTypeDto,
  listCustomers,
  listEntityTypes,
  listTicketTemplates,
  type Result,
  type TicketTemplateDto,
} from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";
import { getSessionState } from "@/server/session";
import type { CustomerOption } from "../customer/actions";
import type { IntakeCatalog } from "./intake/catalog";
import { draftKey } from "./intake/intake-draft";
import type { PackageOption } from "./intake/package-groups";
import { loadIntakeCatalog } from "./load-intake-catalog";

/** What the intake page needs before its first step (ADR 0081). */
export type IntakeData = {
  /** The 5 customers with the latest tickets, shown while the search is empty. */
  recent: CustomerOption[];
  customerTypes: NamedOption[];
  contactTypes: NamedOption[];
  /** Every active package, for step 3; empty without `template:read`. */
  packages: PackageOption[];
  /** `template:write`: step 3 offers Create package. */
  canCreatePackage: boolean;
  /** Where this member's draft for this organization is kept in the browser. */
  draftKey: string;
  /** Items, types, need values and members for step 4 and the line dialog. */
  catalog: IntakeCatalog;
};

const typesOf = ({ base }: { base: "CUSTOMER" | "CONTACT" }) =>
  runOperation({ operation: listEntityTypes, input: { base, limit: 100 } });

const named = ({ types }: { types: EntityTypeDto[] }): NamedOption[] =>
  types.filter(({ status }) => status === "ACTIVE").map(({ id, name }) => ({ id, name }));

const toPackage = ({ template }: { template: TicketTemplateDto }): PackageOption => ({
  id: template.id,
  name: template.name,
  minGuests: template.minGuests,
  maxGuests: template.maxGuests,
  entityTypeId: template.entityTypeId,
  fields: template.fields,
  lineNames: template.lines.map(({ name }) => name),
});

/** A refusal for a list the page can work without counts as an empty list. */
const itemsOr = <T>({ result }: { result: Result<{ items: T[] }> }): T[] =>
  result.ok ? result.value.items : [];

export async function loadIntakeData(): Promise<Result<IntakeData>> {
  const [recent, customerTypes, contactTypes, templates, session, abilities] = await Promise.all([
    runOperation({ operation: listCustomers, input: { recent: true, limit: 5 } }),
    typesOf({ base: "CUSTOMER" }),
    typesOf({ base: "CONTACT" }),
    runOperation({ operation: listTicketTemplates, input: { limit: 100 } }),
    getSessionState(),
    getCallerAbilities(),
  ]);
  const catalog = await loadIntakeCatalog({ userId: abilities.userId });
  if (!catalog.ok) return catalog;
  if (!customerTypes.ok) return customerTypes;
  if (!contactTypes.ok) return contactTypes;
  const organizationId = session.status === "ready" ? session.organizationId : "";
  return {
    ok: true,
    value: {
      recent: itemsOr({ result: recent }).map(({ id, name }) => ({ id, name })),
      customerTypes: named({ types: customerTypes.value.items }),
      contactTypes: named({ types: contactTypes.value.items }),
      packages: itemsOr({ result: templates })
        .filter(({ status }) => status === "ACTIVE")
        .map((template) => toPackage({ template })),
      canCreatePackage: can({ abilities, permission: "template:write" }),
      draftKey: draftKey({ organizationId, userId: abilities.userId ?? "" }),
      catalog: catalog.value,
    },
  };
}
