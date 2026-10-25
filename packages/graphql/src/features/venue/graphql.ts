import {
  archiveVenue,
  createVenue,
  getItemHours,
  getVenue,
  getVenueHours,
  type HoursDay,
  HoursDaySchema,
  type HoursDto,
  type HoursException,
  HoursExceptionSchema,
  listVenues,
  setItemHours,
  setVenueHours,
  updateVenue,
  type VenueDto,
  VenueSchema,
} from "@bibi/core";
import { builder } from "../../schema/builder";
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

// The shared hours pattern (ADR 0064) is one type for venues and items, so both live here.
const HoursDayRef = objectFromSchema<HoursDay>({
  name: "HoursDay",
  schema: HoursDaySchema,
  description: "One open weekday (0 = Monday); times are minutes after midnight.",
});

const HoursExceptionRef = objectFromSchema<HoursException>({
  name: "HoursException",
  schema: HoursExceptionSchema,
  description: "A dated exception to the weekly pattern: closed all day, or other hours.",
});

export const HoursRef = builder.objectRef<HoursDto>("Hours").implement({
  description: "A weekly opening pattern with dated exceptions, read in the owner's time zone.",
  fields: (t) => ({
    days: t.field({ type: [HoursDayRef], resolve: (hours) => hours.days }),
    exceptions: t.field({ type: [HoursExceptionRef], resolve: (hours) => hours.exceptions }),
    timeZone: t.exposeString("timeZone"),
  }),
});

fieldFromOperation({ operation: getVenueHours, type: HoursRef, name: "venueHours" });
mutationFromOperation({ operation: setVenueHours, type: HoursRef });
fieldFromOperation({ operation: getItemHours, type: HoursRef, name: "itemHours" });
mutationFromOperation({ operation: setItemHours, type: HoursRef });
