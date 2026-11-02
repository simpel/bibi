import { z } from "zod";

export const LINE_ROLES = ["PART", "OPTION", "ADD_ON"] as const;

/** What a sub-line is (ADR 0088); set once at insert, never changed. */
export const LineRoleSchema = z
  .enum(LINE_ROLES)
  .describe(
    "What a sub-line is (ADR 0088); null on a top-level line. PART: made by line.expandBundle, " +
      "never counts in the totals (its bundle line carries the price). OPTION: made by " +
      "line.chooseOptions, counts as its priceEffect says. ADD_ON: made by line.create with " +
      "parentLineId, sold with its parent at its own effective price.",
  );

export type LineRole = z.infer<typeof LineRoleSchema>;

/** Sub-lines that came from the parent's item: they lock its item (ADR 0059, 0088). */
export const ITEM_SUB_LINE_ROLES: LineRole[] = ["PART", "OPTION"];

/** Sub-lines without their own quantity count their parent's (ADR 0082, 0088). */
export const inheritsParentQuantity = ({ role }: { role: LineRole | null }) =>
  role === "OPTION" || role === "ADD_ON";
