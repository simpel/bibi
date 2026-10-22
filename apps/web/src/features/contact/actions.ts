"use server";

import {
  archiveContact,
  type ContactCreateInput,
  type ContactDto,
  type ContactUpdateInput,
  createContact,
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
