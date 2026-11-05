"use server";

import {
  draftOrderFromMessage,
  getContact,
  getCustomer,
  type OrderDraft,
  type OrderDraftFromMessageInput,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import type { CustomerOption } from "../customer/actions";

/** The draft with the names of the customer and contact it matched, for step 1 (ADR 0084). */
export type IntakeDraftResult = {
  draft: OrderDraft;
  customer: CustomerOption | null;
  contact: CustomerOption | null;
};

async function named({ draft }: { draft: OrderDraft }) {
  const [customer, contact] = await Promise.all([
    draft.customerId
      ? runOperation({ operation: getCustomer, input: { id: draft.customerId } })
      : null,
    draft.contactId
      ? runOperation({ operation: getContact, input: { id: draft.contactId } })
      : null,
  ]);
  const option = ({ result }: { result: typeof customer | typeof contact }) =>
    result?.ok ? { id: result.value.id, name: result.value.name } : null;
  return { customer: option({ result: customer }), contact: option({ result: contact }) };
}

export type DraftFromMessageActionInput = { input: OrderDraftFromMessageInput };

/** "Read the request": `orderDraft.fromMessage`; writes nothing. */
export async function draftFromMessageAction({
  input,
}: DraftFromMessageActionInput): Promise<ActionResult<IntakeDraftResult>> {
  const result = await runOperation({ operation: draftOrderFromMessage, input });
  if (!result.ok) return toActionResult({ result });
  const names = await named({ draft: result.value });
  return { ok: true, value: { draft: result.value, ...names } };
}
