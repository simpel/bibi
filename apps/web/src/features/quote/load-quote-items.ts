import "server-only";
import { listItems } from "@okazi/core";
import type { NamedOption } from "@/components/form/named-option";
import { runOperation } from "@/server/run-operation";

/** The PRICED items a quote line can charge (first page); empty without read access. */
export async function loadQuoteItems(): Promise<NamedOption[]> {
  const items = await runOperation({
    operation: listItems,
    input: { behaviour: "PRICED", limit: 100 },
  });
  return items.ok ? items.value.items.map(({ id, name }) => ({ id, name })) : [];
}
