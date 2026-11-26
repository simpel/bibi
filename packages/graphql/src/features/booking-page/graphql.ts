import {
  type BookingPageDto,
  BookingPageSchema,
  getBookingPage,
  updateBookingPage,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

type LocaleTexts = BookingPageDto["intro"];

const LocaleTextsRef = builder.objectRef<LocaleTexts>("LocaleTexts").implement({
  description: "Text per language: sv and en.",
  fields: (t) => ({
    sv: t.string({ nullable: true, resolve: (texts) => texts.sv ?? null }),
    en: t.string({ nullable: true, resolve: (texts) => texts.en ?? null }),
  }),
});

export const BookingPageRef = objectFromSchema<BookingPageDto>({
  name: "BookingPage",
  schema: BookingPageSchema,
  omit: ["intro", "policy"],
  description: "The organization's public booking page, lightly white-labelled.",
});
builder.objectField(BookingPageRef, "intro", (t) =>
  t.field({ type: LocaleTextsRef, resolve: (page) => page.intro }),
);
builder.objectField(BookingPageRef, "policy", (t) =>
  t.field({ type: LocaleTextsRef, resolve: (page) => page.policy }),
);

fieldFromOperation({ operation: getBookingPage, type: BookingPageRef, name: "bookingPage" });
mutationFromOperation({ operation: updateBookingPage, type: BookingPageRef });
