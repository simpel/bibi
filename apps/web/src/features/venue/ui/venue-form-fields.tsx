"use client";

import {
  VenueAddressFields,
  VenueContactFields,
  VenueIdentityFields,
  type VenueStepFieldsProps,
} from "./venue-step-fields";

/** All venue fields in one form (the update page); create splits them into steps. */
export function VenueFormFields({ form }: VenueStepFieldsProps) {
  return (
    <div className="grid gap-4">
      <VenueIdentityFields form={form} />
      <VenueAddressFields form={form} />
      <VenueContactFields form={form} />
    </div>
  );
}
