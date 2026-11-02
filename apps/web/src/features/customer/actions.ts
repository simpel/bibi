"use server";

import {
  archiveCustomer,
  type CustomerArchiveInput,
  type CustomerCreateInput,
  type CustomerDto,
  type CustomerFindSimilar,
  type CustomerUpdateInput,
  createCustomer,
  findSimilarCustomers,
  listCustomers,
  updateCustomer,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateCustomerActionInput = { input: CustomerCreateInput };
export type UpdateCustomerActionInput = { input: CustomerUpdateInput };
export type ArchiveCustomerActionInput = { values: CustomerArchiveInput };

export async function createCustomerAction({
  input,
}: CreateCustomerActionInput): Promise<ActionResult<CustomerDto>> {
  return toActionResult({ result: await runOperation({ operation: createCustomer, input }) });
}

export async function updateCustomerAction({
  input,
}: UpdateCustomerActionInput): Promise<ActionResult<CustomerDto>> {
  return toActionResult({ result: await runOperation({ operation: updateCustomer, input }) });
}

export async function archiveCustomerAction({
  values,
}: ArchiveCustomerActionInput): Promise<ActionResult<CustomerDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveCustomer, input: values }),
  });
}

/** A customer as a picker shows it. */
export type CustomerOption = { id: string; name: string };

export type SearchCustomersActionInput = { query: string };

/** Up to 8 active customers whose name contains `query` (the intake's live search, ADR 0081). */
export async function searchCustomersAction({
  query,
}: SearchCustomersActionInput): Promise<ActionResult<CustomerOption[]>> {
  const result = await runOperation({ operation: listCustomers, input: { query, limit: 8 } });
  const options = result.ok
    ? {
        ok: true as const,
        value: result.value.items
          .filter(({ status }) => status === "ACTIVE")
          .map(({ id, name }) => ({ id, name })),
      }
    : result;
  return toActionResult({ result: options });
}

export type FindSimilarCustomersActionInput = { name: string };

/** Existing customers a new name may duplicate (`customer.findSimilar`, ADR 0081). */
export async function findSimilarCustomersAction({
  name,
}: FindSimilarCustomersActionInput): Promise<ActionResult<CustomerFindSimilar>> {
  return toActionResult({
    result: await runOperation({ operation: findSimilarCustomers, input: { name } }),
  });
}
