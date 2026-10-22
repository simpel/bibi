import type { VenueCreateInput } from "@bibi/core";
import type { UseFormReturn } from "react-hook-form";
import type { WizardStepDef } from "@/components/wizard/step-wizard";
import type { VenueFormValues } from "./venue-form-schema";
import { VenueAddressFields, VenueContactFields, VenueIdentityFields } from "./venue-step-fields";

type Form = UseFormReturn<VenueFormValues, unknown, VenueCreateInput>;
type Text = { label: string; description: string };

export type VenueStepsInput = { form: Form; text: (input: { id: string }) => Text };

/** The venue wizard's steps: name, address, then contact details and VAT. */
export function venueSteps({ form, text }: VenueStepsInput): WizardStepDef<VenueFormValues>[] {
  return [
    {
      id: "identity",
      ...text({ id: "identity" }),
      fields: ["name", "description"],
      content: <VenueIdentityFields form={form} />,
    },
    {
      id: "address",
      ...text({ id: "address" }),
      fields: ["streetAddress", "postalCode", "city", "country"],
      content: <VenueAddressFields form={form} />,
    },
    {
      id: "contact",
      ...text({ id: "contact" }),
      fields: ["contactEmail", "contactPhone", "openingHours", "defaultVatRatePercent"],
      content: <VenueContactFields form={form} />,
    },
  ];
}
