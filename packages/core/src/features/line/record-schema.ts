import { z } from "zod";
import { BufferMinutesShape } from "../../shared/buffers";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { PriceEffectSchema } from "../item/customisation-group-schema";
import { LineRoleSchema } from "./line-role";

/** A line as stored: its own values, with `null` overrides meaning "inherit". */
export const LineRecordSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  ticketId: z.string(),
  entityTypeId: z.string(),
  name: z.string(),
  /** Null on an untimed line (a fee), which never holds and is not on the calendar. */
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  itemId: z.string().nullable(),
  setupId: z.string().nullable(),
  /** Own buffers around the booking (ADR 0059); null = the item's, else its type's. */
  ...BufferMinutesShape,
  /** Null = the ticket's headcount. */
  quantity: z.number().int().nullable(),
  /** Overrides; null = inherit (see the effective values). */
  unitPriceMinor: z.number().int().nullable(),
  discountPercent: z.number().nullable(),
  vatRatePercent: z.number().int().nullable(),
  /** The alternative group (alternativeGroup.get) the line is an option of (ADR 0052). */
  alternativeGroupId: z.string().nullable(),
  /**
   * The line (line.get) this sub-line belongs to (ADR 0059, 0088); null for a top-level line.
   * What it is says `role`.
   */
  parentLineId: z.string().nullable(),
  role: LineRoleSchema.nullable(),
  /** Option lines only (ADR 0059, snapshot set by `line.chooseOptions`); null on other lines. */
  priceEffect: PriceEffectSchema.nullable(),
  note: z.string().nullable(),
  fields: FieldValuesSchema,
  /** The line's state (one of its item type's states, ADR 0044); null without an item. */
  stateId: z.string().nullable(),
  /** Set by `line.changeState`: status moves skip the line. */
  stateOverridden: z.boolean(),
  /** When the line entered its current state ("held since"): its newest `LineStateChange`. */
  heldAt: z.date(),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});
