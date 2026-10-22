import {
  type OrganizationProfileDto,
  OrganizationProfileUpdateInputSchema,
} from "@bibi/core/schemas";
import { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** Raw form values: every text input is a string, "" meaning "not given". */
export type OrganizationStepValues = {
  legalName: string;
  orgNumber: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  alsoVenue: boolean;
};

const blankToNull = ({ value }: { value: string }) => (value.trim() === "" ? null : value);

/**
 * The organization step: the core profile input (ADR 0061) plus "this address is also our first
 * venue". Empty inputs become null before core's rules run.
 */
export const OrganizationStepSchema = formSchema({
  schema: OrganizationProfileUpdateInputSchema.extend({ alsoVenue: z.boolean() }),
  toInput: ({ values }: { values: OrganizationStepValues }) => {
    const { alsoVenue, country, ...texts } = values;
    const nulls = Object.fromEntries(
      Object.entries(texts).map(([key, value]) => [key, blankToNull({ value })]),
    );
    return { ...nulls, country: blankToNull({ value: country }) ?? undefined, alsoVenue };
  },
});

export type OrganizationStepOutput = z.output<typeof OrganizationStepSchema>;

/** Form values from the saved profile: missing values become empty inputs. */
export function organizationDefaults({
  profile,
}: {
  profile: OrganizationProfileDto;
}): OrganizationStepValues {
  return {
    legalName: profile.legalName ?? "",
    orgNumber: profile.orgNumber ?? "",
    streetAddress: profile.streetAddress ?? "",
    postalCode: profile.postalCode ?? "",
    city: profile.city ?? "",
    country: profile.country,
    website: profile.website ?? "",
    contactEmail: profile.contactEmail ?? "",
    contactPhone: profile.contactPhone ?? "",
    alsoVenue: true,
  };
}
