import type { BookingPageDto } from "@bibi/core/schemas";
import { BookingPageUpdateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { blankToNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the booking page form: strings, "" meaning empty. */
export type BookingPageFormValues = {
  slug: string;
  logoKey: string;
  coverKey: string;
  accentColor: string;
  introSv: string;
  introEn: string;
  policySv: string;
  policyEn: string;
  contactPhone: string;
  contactEmail: string;
  /** One https origin per line. */
  embedOrigins: string;
  /** Ids of the lists guests count, in order. */
  guestListIds: string[];
};

const lines = ({ value }: { value: string }) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

/** Form strings → the shape core's `bookingPage.update` validates. */
export function bookingPageToInput({ values }: { values: BookingPageFormValues }) {
  return {
    slug: values.slug.trim(),
    logoKey: blankToNull({ value: values.logoKey }),
    coverKey: blankToNull({ value: values.coverKey }),
    accentColor: blankToNull({ value: values.accentColor }),
    intro: { sv: values.introSv.trim(), en: values.introEn.trim() },
    policy: { sv: values.policySv.trim(), en: values.policyEn.trim() },
    contactPhone: blankToNull({ value: values.contactPhone }),
    contactEmail: blankToNull({ value: values.contactEmail }),
    embedOrigins: lines({ value: values.embedOrigins }),
    guestListIds: values.guestListIds,
  };
}

/** Published is its own switch, so the form's schema leaves it out. */
export const bookingPageFormSchema = formSchema({
  schema: BookingPageUpdateInputSchema.omit({ published: true }),
  toInput: bookingPageToInput,
});

export type BookingPageFormOutput = z.output<typeof bookingPageFormSchema>;

export function bookingPageDefaults({ page }: { page: BookingPageDto }): BookingPageFormValues {
  return {
    slug: page.slug ?? "",
    logoKey: page.logoKey ?? "",
    coverKey: page.coverKey ?? "",
    accentColor: page.accentColor ?? "",
    introSv: page.intro.sv ?? "",
    introEn: page.intro.en ?? "",
    policySv: page.policy.sv ?? "",
    policyEn: page.policy.en ?? "",
    contactPhone: page.contactPhone ?? "",
    contactEmail: page.contactEmail ?? "",
    embedOrigins: page.embedOrigins.join("\n"),
    guestListIds: page.guestListIds,
  };
}
