import type { ActionResult } from "@/lib/action-result";
import { saveOrganizationAction } from "../../actions";
import { createFirstVenueAction } from "../../setup-actions";
import type { OrganizationStepOutput } from "./organization-schema";

export type SaveOrganizationStepInput = {
  values: OrganizationStepOutput;
  /** The organization's display name, used for the first venue. */
  name: string;
};

/** Saves the profile, then the first venue when asked and an address is given. */
export async function saveOrganizationStep({
  values,
  name,
}: SaveOrganizationStepInput): Promise<ActionResult<null>> {
  const { alsoVenue, ...input } = values;
  const saved = await saveOrganizationAction({ input });
  if (!saved.ok) return saved;
  if (alsoVenue && input.streetAddress) {
    const venue = await createFirstVenueAction({
      input: {
        name,
        streetAddress: input.streetAddress,
        postalCode: input.postalCode,
        city: input.city,
        country: input.country,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
      },
    });
    if (!venue.ok) return venue;
  }
  return { ok: true, value: null };
}
