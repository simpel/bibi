import { PlainDateStringSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { ROUTES } from "@/lib/routes";
import type { PackageOption } from "./package-groups";
import { TimeOfDaySchema, type WhenFormValues } from "./when-form-schema";

/**
 * A free slot picked on the calendar: the resource (an item), its plain day and wall times in
 * the organization's zone (ADR 0064). The intake starts from it (spec "Starting from the
 * calendar"). From an item's page only the item is given: date and times are empty and step 2
 * asks for them.
 */
export type IntakeSlot = { itemId: string; date: string; from: string; to: string };

const SlotSchema = z
  .object({
    slot: z.string().min(1),
    date: PlainDateStringSchema,
    from: TimeOfDaySchema,
    to: TimeOfDaySchema,
  })
  .refine(({ from, to }) => from !== to);

type SearchValue = string | string[] | undefined;

export type SlotFromSearchInput = { search: Record<string, SearchValue> };

const single = ({ value }: { value: SearchValue }) => (typeof value === "string" ? value : "");

/**
 * The slot in `/new/order?slot=<itemId>&date=&from=&to=`, or just `?slot=<itemId>` (the item,
 * time still to choose); null when it is missing or a given part is malformed.
 */
export function slotFromSearch({ search }: SlotFromSearchInput): IntakeSlot | null {
  const itemId = single({ value: search.slot });
  const timeless = [search.date, search.from, search.to].every((part) => part === undefined);
  if (itemId && timeless) return { itemId, date: "", from: "", to: "" };
  const parsed = SlotSchema.safeParse({
    slot: single({ value: search.slot }),
    date: single({ value: search.date }),
    from: single({ value: search.from }),
    to: single({ value: search.to }),
  });
  if (!parsed.success) return null;
  const { slot, date, from, to } = parsed.data;
  return { itemId: slot, date, from, to };
}

/** Create order from an item's page: the intake with only the item (`?slot=<itemId>`). */
export function itemOrderHref({ itemId }: { itemId: string }): string {
  return `${ROUTES.orderNew}?${new URLSearchParams({ slot: itemId }).toString()}`;
}

/** Create order from a booking template's page: the intake with it preselected in step 3. */
export function templateOrderHref({ templateId }: { templateId: string }): string {
  return `${ROUTES.orderNew}?${new URLSearchParams({ template: templateId }).toString()}`;
}

/** `?template=<id>` in the intake's address, or null. */
export function templateFromSearch({ search }: SlotFromSearchInput): string | null {
  return single({ value: search.template }) || null;
}

/** The intake's address for a slot; `slotFromSearch` reads it back. */
export function slotHref({ slot }: { slot: IntakeSlot }): string {
  const query = new URLSearchParams({ ...slot, slot: slot.itemId });
  query.delete("itemId");
  return `${ROUTES.orderNew}?${query.toString()}`;
}

export type SlotDraftKeyInput = { key: string; slot: IntakeSlot };

/** Each slot keeps its own draft beside the plain intake's and other slots'. */
export function slotDraftKey({ key, slot }: SlotDraftKeyInput): string {
  return `${key}.slot.${slot.itemId}.${slot.date}.${slot.from}`;
}

/** Step 2 as the slot fills it; the guests are still to be typed. */
export function slotWhen({ slot }: { slot: IntakeSlot }): WhenFormValues {
  return { date: slot.date, from: slot.from, to: slot.to, guests: "" };
}

export type PackagesWithItemInput = { packages: PackageOption[]; itemId: string };

/** Only the packages that book the slot's resource. */
export function packagesWithItem({ packages, itemId }: PackagesWithItemInput): PackageOption[] {
  return packages.filter(({ itemIds }) => itemIds.includes(itemId));
}
