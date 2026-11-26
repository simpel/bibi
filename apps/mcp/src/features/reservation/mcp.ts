import { mcpTool } from "../../tools/meta";
import {
  createReservationSummary,
  reservationVerbSummary,
  updateReservationSummary,
} from "./summary";

export const reservationMcpTools = [
  mcpTool({ operation: "reservation.list" }),
  mcpTool({ operation: "reservation.get" }),
  mcpTool({ operation: "reservation.availability" }),
  mcpTool({ operation: "reservation.create", summary: createReservationSummary }),
  mcpTool({
    operation: "reservation.update",
    idempotent: true,
    summary: updateReservationSummary,
  }),
  mcpTool({
    operation: "reservation.cancel",
    destructive: true,
    idempotent: true,
    summary: reservationVerbSummary({ verb: "Cancel" }),
  }),
  mcpTool({
    operation: "reservation.seat",
    idempotent: true,
    summary: reservationVerbSummary({ verb: "Seat" }),
  }),
  mcpTool({
    operation: "reservation.unseat",
    idempotent: true,
    summary: reservationVerbSummary({ verb: "Unseat" }),
  }),
  mcpTool({
    operation: "reservation.complete",
    idempotent: true,
    summary: reservationVerbSummary({ verb: "Complete" }),
  }),
  mcpTool({
    operation: "reservation.markNoShow",
    destructive: true,
    idempotent: true,
    summary: reservationVerbSummary({ verb: "Mark as no-show:" }),
  }),
];
