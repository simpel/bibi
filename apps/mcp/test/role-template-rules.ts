import { type Outcome, type Probe, readProbe, writeProbe } from "./role-template-probes";

const PROBES = {
  readVenues: readProbe({ tool: "venue_list", path: "/venues", field: "venues" }),
  readCustomers: readProbe({ tool: "customer_list", path: "/customers", field: "customers" }),
  readPriceLists: readProbe({ tool: "priceList_list", path: "/price-lists", field: "priceLists" }),
  readBookings: readProbe({ tool: "booking_list", path: "/bookings", field: "bookings" }),
  readInquiries: readProbe({ tool: "inquiry_list", path: "/inquiries", field: "inquiries" }),
  writeCustomer: writeProbe({
    tool: "customer_update",
    method: "PATCH",
    path: "/customers",
    mutation: "customerUpdate",
  }),
  writeInquiry: writeProbe({
    tool: "inquiry_update",
    method: "PATCH",
    path: "/inquiries",
    mutation: "inquiryUpdate",
  }),
  writeBooking: writeProbe({
    tool: "booking_update",
    method: "PATCH",
    path: "/bookings",
    mutation: "bookingUpdate",
  }),
  writeProgramItem: writeProbe({
    tool: "programItem_archive",
    method: "DELETE",
    path: "/program-items",
    mutation: "programItemArchive",
  }),
  writeOccupancy: writeProbe({
    tool: "occupancy_archive",
    method: "DELETE",
    path: "/occupancies",
    mutation: "occupancyArchive",
  }),
  writePriceList: writeProbe({
    tool: "priceList_archive",
    method: "DELETE",
    path: "/price-lists",
    mutation: "priceListArchive",
  }),
  writeRole: writeProbe({
    tool: "role_archive",
    method: "DELETE",
    path: "/roles",
    mutation: "roleArchive",
  }),
} satisfies Record<string, Probe>;

export type RoleRule = { role: string; probe: keyof typeof PROBES; outcome: Outcome };

export const probeOf = ({ probe }: Pick<RoleRule, "probe">): Probe => PROBES[probe];

/**
 * The ADR 0020 role table as checks: at least one read and one write rule per template role,
 * allowed and refused, so a permission drifting in the template shows up on every surface.
 */
export const ROLE_RULES: readonly RoleRule[] = [
  { role: "Admin", probe: "readCustomers", outcome: "OK" },
  { role: "Admin", probe: "writeRole", outcome: "NOT_FOUND" },
  { role: "Sales", probe: "readPriceLists", outcome: "OK" },
  { role: "Sales", probe: "writeCustomer", outcome: "NOT_FOUND" },
  { role: "Sales", probe: "writeInquiry", outcome: "NOT_FOUND" },
  { role: "Sales", probe: "writeBooking", outcome: "NOT_FOUND" },
  { role: "Sales", probe: "writePriceList", outcome: "FORBIDDEN" },
  { role: "Sales", probe: "writeOccupancy", outcome: "FORBIDDEN" },
  { role: "Coordinator", probe: "readCustomers", outcome: "OK" },
  { role: "Coordinator", probe: "readPriceLists", outcome: "FORBIDDEN" },
  { role: "Coordinator", probe: "writeBooking", outcome: "NOT_FOUND" },
  { role: "Coordinator", probe: "writeProgramItem", outcome: "NOT_FOUND" },
  { role: "Coordinator", probe: "writeOccupancy", outcome: "NOT_FOUND" },
  { role: "Coordinator", probe: "writeCustomer", outcome: "FORBIDDEN" },
  { role: "Coordinator", probe: "writeInquiry", outcome: "FORBIDDEN" },
  { role: "Kitchen", probe: "readBookings", outcome: "OK" },
  { role: "Kitchen", probe: "readVenues", outcome: "OK" },
  { role: "Kitchen", probe: "readCustomers", outcome: "FORBIDDEN" },
  { role: "Kitchen", probe: "writeBooking", outcome: "FORBIDDEN" },
  { role: "Kitchen", probe: "writeProgramItem", outcome: "FORBIDDEN" },
  { role: "Finance", probe: "readInquiries", outcome: "OK" },
  { role: "Finance", probe: "readBookings", outcome: "OK" },
  { role: "Finance", probe: "writePriceList", outcome: "NOT_FOUND" },
  { role: "Finance", probe: "writeBooking", outcome: "FORBIDDEN" },
  { role: "Reader", probe: "readPriceLists", outcome: "OK" },
  { role: "Reader", probe: "readInquiries", outcome: "OK" },
  { role: "Reader", probe: "writeCustomer", outcome: "FORBIDDEN" },
  { role: "Reader", probe: "writePriceList", outcome: "FORBIDDEN" },
];
