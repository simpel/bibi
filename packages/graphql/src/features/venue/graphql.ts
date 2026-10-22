import {
  archiveVenue,
  createVenue,
  getVenue,
  listVenues,
  updateVenue,
  type VenueDto,
  VenueSchema,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const VenueRef = objectFromSchema<VenueDto>({
  name: "Venue",
  schema: VenueSchema,
  omit: ["organizationId"],
  description: "A building or site containing bookable items.",
});
const VenuePageRef = pageType({ name: "VenuePage", item: VenueRef });

fieldFromOperation({ operation: listVenues, type: VenuePageRef, name: "venues" });
fieldFromOperation({ operation: getVenue, type: VenueRef, name: "venue" });
mutationFromOperation({ operation: createVenue, type: VenueRef });
mutationFromOperation({ operation: updateVenue, type: VenueRef });
mutationFromOperation({ operation: archiveVenue, type: VenueRef });
