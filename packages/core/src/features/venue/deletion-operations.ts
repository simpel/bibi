import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { venueKind } from "./deletion-kind";
import { venueEmbeddable } from "./embeddable";
import { getVenue } from "./operations";
import { VenueIdInputSchema } from "./schema";

export const restoreVenue = defineRestoreOperation({
  name: "venue.restore",
  description:
    "Restore an archived venue: it is active again. Items archived with it stay archived. " +
    "CONFLICT when it is not archived.",
  permission: "venue:delete",
  kind: venueKind,
  input: VenueIdInputSchema,
  get: getVenue,
  embeddable: venueEmbeddable,
});

export const deleteVenue = defineDeleteOperation({
  name: "venue.delete",
  description:
    "Delete an archived venue permanently (ADR 0118), with its hours. An active venue is " +
    "CONFLICT: archive it first. CONFLICT while any item, archived or not, is at it.",
  permission: "venue:delete",
  kind: venueKind,
  input: VenueIdInputSchema,
});
