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

const readAll: PermissionSet = {
  ...everyone,
  venue: ["read"],
  room: ["read"],
  role: ["read"],
  member: ["read"],
};

/**
 * "Konferensgård" (ADR 0020). Optional data an organization imports and then edits freely.
 * Grows with each slice of ADR 0025: customers, quotes, bookings, sheets, invoices etc. are
 * added to the roles below when those resources exist.
 */
export const conferenceVenueTemplate: RoleTemplate = {
  key: "conference-venue",
  name: "Konferensgård",
  roles: [
    {
      name: "Admin",
      permissions: {
        venue: ["admin"],
        room: ["admin"],
        search: ["admin"],
        conversation: ["admin"],
        skill: ["admin"],
        role: ["admin"],
        member: ["admin"],
      },
    },
    { name: "Säljare", permissions: { ...everyone, venue: ["read"], room: ["read"] } },
    { name: "Koordinator", permissions: { ...everyone, venue: ["read"], room: ["read"] } },
    { name: "Kök", permissions: { ...everyone, venue: ["read"], room: ["read"] } },
    { name: "Ekonomi", permissions: readAll },
    { name: "Läsare", permissions: readAll },
  ],
};
