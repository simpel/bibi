import type { BookingStatus } from "@okazi/db";
import { BOOKING_PHASES } from "../booking-status/schema";
import type { InquiryStatus } from "../inquiry/schema";
import type { PipelineColumn } from "./schema";

const OPEN_INQUIRY_STATUSES = ["NEW", "QUALIFIED", "QUOTED"] as const satisfies InquiryStatus[];

export type ColumnIdInput = { id: string };

export const inquiryColumnId = ({ id }: ColumnIdInput) => `inquiry:${id}`;
export const bookingColumnId = ({ id }: ColumnIdInput) => `booking:${id}`;

const inquiryColumn = ({ status }: { status: InquiryStatus }): PipelineColumn => ({
  id: inquiryColumnId({ id: status }),
  kind: "INQUIRY",
  title: status,
  color: null,
  inquiryStatus: status,
  bookingStatusId: null,
  phase: null,
  closed: status === "LOST",
});

const bookingColumn = ({ row }: { row: BookingStatus }): PipelineColumn => ({
  id: bookingColumnId({ id: row.id }),
  kind: "BOOKING",
  title: row.name,
  color: row.color,
  inquiryStatus: null,
  bookingStatusId: row.id,
  phase: row.phase,
  closed: row.phase === "CANCELLED",
});

export type BuildColumnsInput = { statuses: readonly BookingStatus[] };

/**
 * Board lanes left to right: open inquiry stages, the organization's booking statuses by phase
 * then position, then the closed lanes (lost inquiries, cancelled bookings). Bookings are
 * grouped by phase, never by status name (ADR 0021).
 */
export function buildColumns({ statuses }: BuildColumnsInput): PipelineColumn[] {
  const byPhase = [...statuses].sort(
    (a, b) =>
      BOOKING_PHASES.indexOf(a.phase) - BOOKING_PHASES.indexOf(b.phase) || a.position - b.position,
  );
  const columns = [
    ...OPEN_INQUIRY_STATUSES.map((status) => inquiryColumn({ status })),
    ...byPhase.map((row) => bookingColumn({ row })),
    inquiryColumn({ status: "LOST" }),
  ];
  return [...columns.filter((c) => !c.closed), ...columns.filter((c) => c.closed)];
}
