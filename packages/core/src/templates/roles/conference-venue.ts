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

/** Customer prices (ADR 0023): Finance owns the price lists, Sales quotes from them. */
const priceListsRead: PermissionSet = { priceList: ["read"] };
const priceListsAdmin: PermissionSet = { priceList: ["admin"] };

/**
 * Bookings, their program items, requirement counts (ADR 0021) and owners (ADR 0022); owners are
 * members, shown and picked by name.
 */
const bookingsRead: PermissionSet = {
  booking: ["read"],
  programItem: ["read"],
  requirement: ["read"],
  member: ["read"],
};
const bookingsWrite: PermissionSet = {
  booking: ["write"],
  programItem: ["write"],
  requirement: ["write"],
  member: ["read"],
};

/** Requesting payments from customers (ADR 0028); the payout account stays with `payment:admin`. */
const paymentsWrite: PermissionSet = { payment: ["write"] };

/** Inquiries in the sales pipeline (ADR 0022); the salesperson is a member. */
const inquiriesWrite: PermissionSet = { inquiry: ["write"], member: ["read"] };

/** Blocking bookable items for maintenance or internal use (ADR 0022). */
const occupancyWrite: PermissionSet = { occupancy: ["write"] };

/** Reads every resource the template knows (Finance and Reader, ADR 0020). */
const readAll: PermissionSet = {
  ...everyone,
  ...catalog,
  ...customersRead,
  ...priceListsRead,
  ...bookingsRead,
  inquiry: ["read"],
  role: ["read"],
  member: ["read"],
  audit: ["read"],
  payment: ["read"],
};

/**
 * "Conference venue" (ADR 0020). Optional data an organization imports and then edits freely.
 * Follows the ADR's role table for the resources that exist; options, quotes and invoices are
 * added to the roles below when those resources exist. Sheets are read through
 * `configuration:read`, which every role has.
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
        priceList: ["admin"],
        occupancy: ["admin"],
        configuration: ["admin"],
        bookingStatus: ["admin"],
        booking: ["admin"],
        programItem: ["admin"],
        requirement: ["admin"],
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
      // The ADR's "booking" covers what a quick booking creates in one step (ADR 0022, 0028):
      // its program item and the payment link the customer pays through.
      name: "Sales",
      permissions: {
        ...everyone,
        ...catalog,
        ...customersWrite,
        ...priceListsRead,
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
        ...customersRead,
        ...occupancyWrite,
        ...bookingsWrite,
      },
    },
    { name: "Kitchen", permissions: { ...everyone, ...catalog, ...bookingsRead } },
    { name: "Finance", permissions: { ...readAll, ...priceListsAdmin, ...paymentsWrite } },
    { name: "Reader", permissions: readAll },
  ],
};
