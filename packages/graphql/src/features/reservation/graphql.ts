import {
  type AvailabilitySlot,
  AvailabilitySlotSchema,
  cancelReservation,
  completeReservation,
  createReservation,
  getReservation,
  listReservations,
  markReservationNoShow,
  type ReservationDto,
  ReservationRequirementSchema,
  ReservationSchema,
  ReservationTableSchema,
  reservationAvailability,
  seatReservation,
  unseatReservation,
  updateReservation,
} from "@bibi/core";
import type { z } from "zod";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

type Requirement = z.infer<typeof ReservationRequirementSchema>;
type Table = z.infer<typeof ReservationTableSchema>;
type Totals = { reservations: number; covers: number; needs: Requirement[] };
type ReservationList = { items: ReservationDto[]; totals: Totals };
type Availability = { timeZone: string; slots: AvailabilitySlot[] };

const RequirementRef = objectFromSchema<Requirement>({
  name: "ReservationRequirement",
  schema: ReservationRequirementSchema,
  description: "A count of the party against one value of the organization's own lists.",
});

const TableRef = objectFromSchema<Table>({
  name: "ReservationTable",
  schema: ReservationTableSchema,
  description: "A table (a layout piece) a reservation sits at.",
});

export const ReservationRef = objectFromSchema<ReservationDto>({
  name: "Reservation",
  schema: ReservationSchema,
  omit: ["tables", "requirements"],
  description: "A party at one or more tables.",
});
builder.objectField(ReservationRef, "tables", (t) =>
  t.field({ type: [TableRef], resolve: (reservation) => reservation.tables }),
);
builder.objectField(ReservationRef, "requirements", (t) =>
  t.field({ type: [RequirementRef], resolve: (reservation) => reservation.requirements }),
);

const TotalsRef = builder.objectRef<Totals>("ReservationTotals").implement({
  description: "Reservations, covers and summed needs of a list.",
  fields: (t) => ({
    reservations: t.exposeInt("reservations"),
    covers: t.exposeInt("covers", { description: "People in BOOKED, SEATED and COMPLETED." }),
    needs: t.field({ type: [RequirementRef], resolve: (totals) => totals.needs }),
  }),
});

const ReservationListRef = builder.objectRef<ReservationList>("ReservationList").implement({
  description: "Reservations by start time with their totals.",
  fields: (t) => ({
    items: t.field({ type: [ReservationRef], resolve: (list) => list.items }),
    totals: t.field({ type: TotalsRef, resolve: (list) => list.totals }),
  }),
});

const SlotRef = objectFromSchema<AvailabilitySlot>({
  name: "AvailabilitySlot",
  schema: AvailabilitySlotSchema,
  description: "One start time in a sitting: whether it is free and the tables it would get.",
});

const AvailabilityRef = builder.objectRef<Availability>("ReservationAvailability").implement({
  description: "Free start times in a dining room on a local date.",
  fields: (t) => ({
    timeZone: t.exposeString("timeZone"),
    slots: t.field({ type: [SlotRef], resolve: (availability) => availability.slots }),
  }),
});

fieldFromOperation({ operation: listReservations, type: ReservationListRef, name: "reservations" });
fieldFromOperation({ operation: getReservation, type: ReservationRef, name: "reservation" });
fieldFromOperation({
  operation: reservationAvailability,
  type: AvailabilityRef,
  name: "reservationAvailability",
});
mutationFromOperation({ operation: createReservation, type: ReservationRef });
mutationFromOperation({ operation: updateReservation, type: ReservationRef });
mutationFromOperation({ operation: cancelReservation, type: ReservationRef });
mutationFromOperation({ operation: seatReservation, type: ReservationRef });
mutationFromOperation({ operation: unseatReservation, type: ReservationRef });
mutationFromOperation({ operation: completeReservation, type: ReservationRef });
mutationFromOperation({ operation: markReservationNoShow, type: ReservationRef });
