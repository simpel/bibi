"use server";

import {
  archiveCustomer,
  type CustomerCreateInput,
  type CustomerDto,
  type CustomerUpdateInput,
  createCustomer,
  updateCustomer,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateCustomerActionInput = { input: CustomerCreateInput };
export type UpdateCustomerActionInput = { input: CustomerUpdateInput };
export type ArchiveCustomerActionInput = { id: string };

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
  id,
}: ArchiveCustomerActionInput): Promise<ActionResult<CustomerDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveCustomer, input: { id } }),
  });
}
