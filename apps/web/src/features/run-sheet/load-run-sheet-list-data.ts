import "server-only";
import {
  listContacts,
  listCustomers,
  listOrderStatuses,
  listResponsibilities,
  listRunSheetDefinitions,
} from "@bibi/core";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { runOperation } from "@/server/run-operation";

const LIMIT = 100;

type Named = { id: string; name: string };

const rowsOf = <T extends { items: Named[] }>({
  result,
}: {
  result: { ok: boolean; value?: T };
}) => (result.ok && result.value ? result.value.items.map(({ id, name }) => ({ id, name })) : []);

export type RunSheetListData = {
  definitions: Named[];
  responsibilities: Named[];
  statuses: Named[];
  types: Named[];
  contacts: Named[];
  /** The caller may not view customers: no contact names (ADR 0071). */
  customersHidden: boolean;
};

/**
 * What the list names and the search suggests: run sheet definitions, responsibilities, order
 * statuses, types and contacts. Only what the caller may read; anything else is left out, not an
 * error.
 */
export async function loadRunSheetListData(): Promise<RunSheetListData> {
  const [definitions, responsibilities, statuses, types, contacts, customers] = await Promise.all([
    runOperation({ operation: listRunSheetDefinitions, input: { limit: LIMIT } }),
    runOperation({ operation: listResponsibilities, input: { limit: LIMIT } }),
    runOperation({ operation: listOrderStatuses, input: { limit: LIMIT } }),
    loadEntityTypesOf({ base: "ORDER" }),
    runOperation({ operation: listContacts, input: { limit: LIMIT } }),
    runOperation({ operation: listCustomers, input: { limit: 1 } }),
  ]);
  return {
    definitions: rowsOf({ result: definitions }),
    responsibilities: rowsOf({ result: responsibilities }),
    statuses: rowsOf({ result: statuses }),
    types: rowsOf({ result: types }),
    contacts: rowsOf({ result: contacts }),
    customersHidden: !customers.ok,
  };
}
