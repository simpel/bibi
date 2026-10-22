import type { InboundEmail } from "@bibi/db";
import { z } from "zod";
import { InboundAttachmentSchema, type InboundEmailDto } from "./schema";

const AttachmentsSchema = z.array(InboundAttachmentSchema).catch([]);

export type ToInboundEmailDtoInput = { row: InboundEmail };

export const toInboundEmailDto = ({ row }: ToInboundEmailDtoInput): InboundEmailDto => ({
  ...row,
  attachments: AttachmentsSchema.parse(row.attachments),
});
