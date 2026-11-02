import type { InboundMessage } from "@bibi/db";
import { z } from "zod";
import { InboundAttachmentSchema } from "../inbound-email/schema";
import { FormFieldsSchema, type InboundMessageDto } from "./schema";

const AttachmentsSchema = z.array(InboundAttachmentSchema).catch([]);
const StoredFormFieldsSchema = FormFieldsSchema.nullable().catch(null);

export type ToInboundMessageDtoInput = { row: InboundMessage };

/** The stored row without the channel's `details` (read only by that channel's code). */
export function toInboundMessageDto({ row }: ToInboundMessageDtoInput): InboundMessageDto {
  const { details: _details, updatedAt: _updatedAt, createdBy: _createdBy, ...rest } = row;
  return {
    ...rest,
    formFields: StoredFormFieldsSchema.parse(row.formFields),
    attachments: AttachmentsSchema.parse(row.attachments),
  };
}
