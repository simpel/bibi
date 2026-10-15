import type { PermissionSet } from "../../permissions/permission-set";
import type { RoleTemplate } from "./role-template";

/**
 * What every role in the template gets: search, its own assistant conversations and skills.
 * Writing a skill only creates personal ones; organization skills need `skill:admin`.
 */
const everyone: PermissionSet = {
  search: ["read"],
  conversation: ["write"],
  skill: ["write"],
};

/** Everyone reads the catalog, the configuration it is described by and the booking statuses. */
const catalog: PermissionSet = {
  venue: ["read"],
  item: ["read"],
  occupancy: ["read"],
  configuration: ["read"],
  bookingStatus: ["read"],
};

/** Customers and their contact persons (ADR 0022). */
const customersRead: PermissionSet = { customer: ["read"], contact: ["read"] };
const customersWrite: PermissionSet = { customer: ["write"], contact: ["write"] };

/** Bookings, their program items and owners (ADR 0022); owners are members, shown and picked by name. */
const bookingsRead: PermissionSet = { booking: ["read"], programItem: ["read"], member: ["read"] };
const bookingsWrite: PermissionSet = {
  booking: ["write"],
  programItem: ["write"],
  member: ["read"],
};

/** Requesting payments from customers (ADR 0028); the payout account stays with `payment:admin`. */
const paymentsWrite: PermissionSet = { payment: ["write"] };

/** Inquiries in the sales pipeline (ADR 0022); the salesperson is a member. */
const inquiriesRead: PermissionSet = { inquiry: ["read"], member: ["read"] };
const inquiriesWrite: PermissionSet = { inquiry: ["write"], member: ["read"] };

/** Blocking bookable items for maintenance or internal use (ADR 0022). */
const occupancyWrite: PermissionSet = { occupancy: ["write"] };

const readAll: PermissionSet = {
  ...everyone,
  ...catalog,
  ...customersRead,
  ...bookingsRead,
  ...inquiriesRead,
  role: ["read"],
  member: ["read"],
  audit: ["read"],
  payment: ["read"],
};

/**
 * "Conference venue" (ADR 0020). Optional data an organization imports and then edits freely.
 * Grows with each slice of ADR 0025: quotes, bookings, sheets, invoices etc. are
 * added to the roles below when those resources exist.
 */
export const conferenceVenueTemplate: RoleTemplate = {
  key: "conference-venue",
  name: "Conference venue",
  roles: [
    {
      name: "Admin",
      permissions: {
        venue: ["admin"],
        item: ["admin"],
        customer: ["admin"],
        contact: ["admin"],
        occupancy: ["admin"],
        configuration: ["admin"],
        bookingStatus: ["admin"],
        booking: ["admin"],
        programItem: ["admin"],
        inquiry: ["admin"],
        search: ["admin"],
        conversation: ["admin"],
        skill: ["admin"],
        role: ["admin"],
        member: ["admin"],
        audit: ["admin"],
        payment: ["admin"],
      },
    },
    {
      name: "Sales",
      permissions: {
        ...everyone,
        ...catalog,
        ...customersWrite,
        ...occupancyWrite,
        ...bookingsWrite,
        ...paymentsWrite,
        ...inquiriesWrite,
      },
    },
    {
      name: "Coordinator",
      permissions: {
        ...everyone,
        ...catalog,
        ...customersWrite,
        ...occupancyWrite,
        ...bookingsWrite,
        ...paymentsWrite,
        ...inquiriesRead,
      },
    },
    { name: "Kitchen", permissions: { ...everyone, ...catalog, ...bookingsRead } },
    { name: "Finance", permissions: readAll },
    { name: "Reader", permissions: readAll },
  ],
};
