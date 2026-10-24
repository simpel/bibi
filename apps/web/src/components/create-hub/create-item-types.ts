import type { Permission } from "@bibi/core";
import type { LucideIcon } from "lucide-react";

export type CreateGroup = "work" | "catalog" | "settings";

export type CreateKey =
  | "ticket"
  | "customer"
  | "item"
  | "venue"
  | "skill"
  | "type"
  | "list"
  | "setup"
  | "responsibility"
  | "sheet"
  | "priceList"
  | "ticketStatus"
  | "member";

export type CreateItem = {
  key: CreateKey;
  group: CreateGroup;
  href: string;
  icon: LucideIcon;
  /** The permission that allows creating it (ADR 0050). */
  permission: Permission;
};
