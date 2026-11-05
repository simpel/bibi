import { InboundMessageAttachInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

export type AttachFormValues = { orderId: string };
export type AttachFormOutput = z.infer<typeof InboundMessageAttachInputSchema>;

/** Core's `inboundMessage.attachToOrder` schema for one message. */
export const attachFormSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: InboundMessageAttachInputSchema,
    toInput: ({ values }: { values: AttachFormValues }) => ({ id, orderId: values.orderId }),
  });
