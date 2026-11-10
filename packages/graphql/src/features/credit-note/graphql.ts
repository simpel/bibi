import {
  type CreditNoteDto,
  CreditNoteSchema,
  getCreditNote,
  listCreditNotes,
  type OrderLineDto,
  OrderLineSchema,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

const CreditNoteLineRef = objectFromSchema<OrderLineDto>({
  name: "CreditNoteLine",
  schema: OrderLineSchema,
  description: "An order line on a credit note: the credited part of an invoice line, frozen.",
});

export const CreditNoteRef = objectFromSchema<CreditNoteDto>({
  name: "CreditNote",
  schema: CreditNoteSchema,
  omit: ["organizationId", "lines"],
  description:
    "A credit note (ADR 0052, 0100): a credit of a sent invoice with its credited lines frozen. " +
    "PENDING until the provider confirmed it, then ISSUED, or FAILED.",
});
const CreditNotePageRef = pageType({ name: "CreditNotePage", item: CreditNoteRef });

builder.objectField(CreditNoteRef, "lines", (t) =>
  t.field({
    type: [CreditNoteLineRef],
    description: CreditNoteSchema.shape.lines.description,
    resolve: (note) => note.lines,
  }),
);

fieldFromOperation({ operation: listCreditNotes, type: CreditNotePageRef, name: "creditNotes" });
fieldFromOperation({ operation: getCreditNote, type: CreditNoteRef, name: "creditNote" });
