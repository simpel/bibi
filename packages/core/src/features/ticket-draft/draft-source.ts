import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { FormFieldsSchema } from "../inbound-message/schema";
import { checkReadable } from "../ticket/ticket-rules";
import { formFieldDraft } from "./form-fields";
import type { ModelDraft } from "./model-draft-schema";
import { DRAFT_TEXT_MAX, type TicketDraftFromMessageInput } from "./schema";

const StoredFormFieldsSchema = FormFieldsSchema.nullable().catch(null);

/** What a draft is read from: free text for the model, and fields that are given as they are. */
export type DraftSource = {
  subject: string | null;
  text: string;
  /** When it came in; now for pasted text (a date without year resolves from here). */
  receivedAt: Date;
  inboundMessageId: string | null;
  /** The sender and form fields of a message, taken as given (ADR 0085 decision 6). */
  given: Partial<ModelDraft>;
};

type Sender = { fromName: string | null; fromEmail: string | null; fromPhone: string | null };

const asGiven = ({ value }: { value: string | null }) =>
  value ? { value, quote: value, guessed: false } : undefined;

function senderOf({ fromName, fromEmail, fromPhone }: Sender): Partial<ModelDraft> {
  const entries = {
    senderName: asGiven({ value: fromName }),
    email: asGiven({ value: fromEmail }),
    phone: asGiven({ value: fromPhone }),
  };
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value));
}

export type LoadDraftSourceInput = {
  context: OperationContext;
  input: TicketDraftFromMessageInput;
};

/**
 * Pasted text as is, or an inbox message of any channel (needs `inbox:read`; another
 * organization's message is NOT_FOUND). Only `subject` and `text` go to the model.
 */
export async function loadDraftSource({
  context,
  input,
}: LoadDraftSourceInput): Promise<Result<DraftSource>> {
  if (!input.inboundMessageId) {
    const text = input.text ?? "";
    const base = { subject: null, text, inboundMessageId: null, given: {} };
    return ok({ value: { ...base, receivedAt: nowOf({ context }) } });
  }
  const access = checkReadable({ context, permission: "inbox:read", path: "inboundMessageId" });
  if (!access.ok) return access;
  const row = await context.db.inboundMessage.findFirst({ where: { id: input.inboundMessageId } });
  if (!row) return notFound({ entity: "Message" });
  const fields = StoredFormFieldsSchema.parse(row.formFields);
  return ok({
    value: {
      subject: row.subject,
      text: row.text.slice(0, DRAFT_TEXT_MAX),
      receivedAt: row.receivedAt,
      inboundMessageId: row.id,
      given: { ...senderOf(row), ...formFieldDraft({ fields }) },
    },
  });
}
