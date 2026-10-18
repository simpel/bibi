import type { LucideIcon } from "lucide-react";
import type { CallerAbilities } from "@/server/caller-abilities";

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
  | "ticketPhase"
  | "member";

export type CreateItem = {
  key: CreateKey;
  group: CreateGroup;
  href: string;
  icon: LucideIcon;
  /** The ability that allows creating it; `null` = every member. */
  ability: keyof CallerAbilities | null;
};
