import { entryStatusId } from "../src/features/ticket/ticket-defaults";
import {
  addVocabularyValue,
  createContact,
  createEntityType,
  createTicketTemplate,
  createVocabulary,
  draftTicketFromMessage,
  type ExecuteContext,
  type ExtractInput,
  execute,
  type ModelDraft,
  ok,
  setExtract,
} from "../src/index";
import { unwrap } from "./helpers";
import { ticketSetup } from "./ticket-helpers";

/** What the mock model answers unless a test overrides a field: nothing found. */
export const EMPTY_DRAFT: ModelDraft = {
  ...{ senderName: null, company: null, email: null, phone: null },
  ...{ date: null, start: null, end: null, headcount: null },
  ...{ wish: null, packageName: null, needs: [], notes: null },
};

const quoted = ({ quote, guessed = false }: { quote: string; guessed?: boolean }) => ({
  quote,
  guessed,
});

export const said = ({ value, quote = value }: { value: string; quote?: string }) => ({
  value,
  ...quoted({ quote }),
});

export const time = ({ value, quote = value, guessed = false }: TimeInput) => ({
  asWritten: quote,
  time: value,
  ...quoted({ quote, guessed }),
});
type TimeInput = { value: string; quote?: string; guessed?: boolean };

/** A mock model (the `extract` port) answering `answer`; it records what it was asked. */
export function mockModel({ answer }: { answer: unknown }) {
  const calls: ExtractInput[] = [];
  setExtract({
    extract: async (input) => {
      calls.push(input);
      return ok({ value: answer });
    },
  });
  return calls;
}

type Ctx = { context: ExecuteContext };

/** A list "Diets" with Vegan and Gluten, and a package "Wine tasting". */
async function choices({ context, ticketTypeId }: Ctx & { ticketTypeId: string }) {
  const list = unwrap({
    result: await execute({ operation: createVocabulary, input: { name: "Diets" }, context }),
  });
  const values: Record<string, string> = {};
  for (const name of ["Vegan", "Gluten"]) {
    const input = { vocabularyId: list.id, name };
    const added = unwrap({
      result: await execute({ operation: addVocabularyValue, input, context }),
    });
    values[name] = added.values.find((value) => value.name === name)?.id ?? "";
  }
  const statusId = unwrap({ result: await entryStatusId({ context }) });
  const input = { name: "Wine tasting", entityTypeId: ticketTypeId, statusId, lines: [] };
  const pkg = unwrap({
    result: await execute({ operation: createTicketTemplate, input, context }),
  });
  return { values, templateId: pkg.id };
}

/** An organization with a customer whose contact mails from `hisingenenergi.se`, a list and a package. */
export async function draftSetup() {
  const setup = await ticketSetup();
  const { context, customer, type } = setup;
  const contactType = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "CONTACT", name: "Contact" },
      context,
    }),
  });
  const input = {
    ...{ customerId: customer.id, entityTypeId: contactType.id, name: "Anna Berg" },
    email: "anna@hisingenenergi.se",
  };
  const contact = unwrap({ result: await execute({ operation: createContact, input, context }) });
  return { ...setup, contact, ...(await choices({ context, ticketTypeId: type.id })) };
}

export type DraftInput = Ctx & { input: { text?: string; inboundMessageId?: string }; now?: Date };

/** `ticketDraft.fromMessage` as the caller, optionally at another "now". */
export const draft = ({ context, input, now }: DraftInput) =>
  execute({
    operation: draftTicketFromMessage,
    input,
    context: now ? { ...context, now: () => now } : context,
  });
