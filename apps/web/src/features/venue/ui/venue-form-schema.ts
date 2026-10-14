import type { VenueDto } from "@okazi/core";
import { VenueCreateInputSchema } from "@okazi/core/schemas";
import { blankToNull, blankToUndefined, numberOrUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the venue form: every input is a string, "" meaning empty. */
export type VenueFormValues = {
  name: string;
  description: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  openingHours: string;
  defaultVatRatePercent: string;
};

export type VenueFormInput = { values: VenueFormValues };

/** Form strings → the shape core's `venue.create` input schema validates. */
export function venueFormToInput({ values }: VenueFormInput) {
  return {
    name: values.name.trim(),
    description: blankToNull({ value: values.description }),
    streetAddress: blankToNull({ value: values.streetAddress }),
    postalCode: blankToNull({ value: values.postalCode }),
    city: blankToNull({ value: values.city }),
    country: blankToUndefined({ value: values.country }),
    contactEmail: blankToNull({ value: values.contactEmail }),
    contactPhone: blankToNull({ value: values.contactPhone }),
    openingHours: blankToNull({ value: values.openingHours }),
    defaultVatRatePercent: numberOrUndefined({ value: values.defaultVatRatePercent }),
  };
}

/** Core's schema is the single source of validation rules for the form. */
export const venueFormSchema = formSchema({
  schema: VenueCreateInputSchema,
  toInput: venueFormToInput,
});

export type VenueDefaultsInput = { venue?: VenueDto | undefined };

export function venueFormDefaults({ venue }: VenueDefaultsInput): VenueFormValues {
  return {
    name: venue?.name ?? "",
    description: venue?.description ?? "",
    streetAddress: venue?.streetAddress ?? "",
    postalCode: venue?.postalCode ?? "",
    city: venue?.city ?? "",
    country: venue?.country ?? "SE",
    contactEmail: venue?.contactEmail ?? "",
    contactPhone: venue?.contactPhone ?? "",
    openingHours: venue?.openingHours ?? "",
    defaultVatRatePercent: String(venue?.defaultVatRatePercent ?? 12),
  };
}
