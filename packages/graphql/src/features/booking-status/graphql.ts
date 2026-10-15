import {
  archiveBookingStatus,
  type BookingStatusDto,
  type BookingStatusImportResult,
  BookingStatusSchema,
  createBookingStatus,
  getBookingStatus,
  importBookingStatusTemplate,
  listBookingStatuses,
  reorderBookingStatuses,
  setBookingStatusTransitions,
  updateBookingStatus,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const BookingStatusRef = objectFromSchema<BookingStatusDto>({
  name: "BookingStatus",
  schema: BookingStatusSchema,
  omit: ["organizationId"],
  description:
    "Booking status – the organization's own label inside a fixed phase (TENTATIVE, " +
    "CONFIRMED, COMPLETED, CANCELLED). `transitionsTo` lists the statuses a booking may move to.",
});
const BookingStatusPageRef = pageType({ name: "BookingStatusPage", item: BookingStatusRef });

const BookingStatusImportRef = builder
  .objectRef<BookingStatusImportResult>("BookingStatusImport")
  .implement({
    description: "Result of importing a booking status template.",
    fields: (t) => ({
      created: t.field({ type: [BookingStatusRef], resolve: (result) => result.created }),
      skipped: t.stringList({
        description: "Names that already existed",
        resolve: (result) => result.skipped,
      }),
      transitionsAdded: t.int({ resolve: (result) => result.transitionsAdded }),
    }),
  });

fieldFromOperation({
  operation: listBookingStatuses,
  type: BookingStatusPageRef,
  name: "bookingStatuses",
});
fieldFromOperation({ operation: getBookingStatus, type: BookingStatusRef, name: "bookingStatus" });
mutationFromOperation({ operation: createBookingStatus, type: BookingStatusRef });
mutationFromOperation({ operation: updateBookingStatus, type: BookingStatusRef });
mutationFromOperation({ operation: archiveBookingStatus, type: BookingStatusRef });
mutationFromOperation({ operation: reorderBookingStatuses, type: BookingStatusPageRef });
mutationFromOperation({ operation: setBookingStatusTransitions, type: BookingStatusRef });
mutationFromOperation({ operation: importBookingStatusTemplate, type: BookingStatusImportRef });
