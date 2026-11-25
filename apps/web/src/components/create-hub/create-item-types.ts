import type { Permission } from "@bibi/core";
import type { LucideIcon } from "lucide-react";

export type CreateGroup = "work" | "catalog" | "settings";

export type CreateKey =
  | "order"
  | "task"
  | "customer"
  | "item"
  | "venue"
  | "skill"
  | "type"
  | "list"
  | "responsibility"
  | "runSheet"
  | "priceList"
  | "package"
  | "orderStatus"
  | "member";

export type CreateItem = {
  key: CreateKey;
  group: CreateGroup;
  href: string;
  icon: LucideIcon;
  /** The permission that allows creating it (ADR 0050). */
  permission: Permission;
};
