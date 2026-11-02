"use server";

import {
  archiveContact,
  type ContactCreateInput,
  type ContactDto,
  type ContactUpdateInput,
  createContact,
  listContacts,
  updateContact,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateContactActionInput = { input: ContactCreateInput };
export type UpdateContactActionInput = { input: ContactUpdateInput };
export type ArchiveContactActionInput = { id: string };

export async function createContactAction({
  input,
}: CreateContactActionInput): Promise<ActionResult<ContactDto>> {
  return toActionResult({ result: await runOperation({ operation: createContact, input }) });
}

export async function updateContactAction({
  input,
}: UpdateContactActionInput): Promise<ActionResult<ContactDto>> {
  return toActionResult({ result: await runOperation({ operation: updateContact, input }) });
}

export async function archiveContactAction({
  id,
}: ArchiveContactActionInput): Promise<ActionResult<ContactDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveContact, input: { id } }),
  });
}

export type ListCustomerContactsActionInput = { customerId: string };

/** A customer's active contact persons, for the intake's contact picker (ADR 0081). */
export async function listCustomerContactsAction({
  customerId,
}: ListCustomerContactsActionInput): Promise<ActionResult<ContactDto[]>> {
  const result = await runOperation({
    operation: listContacts,
    input: { customerId, limit: 100 },
  });
  const active = result.ok
    ? { ok: true as const, value: result.value.items.filter(({ status }) => status === "ACTIVE") }
    : result;
  return toActionResult({ result: active });
}
