import { PermissionProfileSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** A member's or API key's permissions as tool results carry them (all fields are JSON-safe). */
export const PermissionProfileWireSchema = PermissionProfileSchema;
export type PermissionProfileWire = z.infer<typeof PermissionProfileWireSchema>;

const permissionProfileCard = uiEntry({
  component: "permission-profile-card",
  schema: PermissionProfileWireSchema,
  toProps: ({ value }) => ({ profile: value }),
});

/** Tool → component for permission presets and overrides (ADR 0050). */
export const PERMISSION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  permission_get: permissionProfileCard,
  permission_update: permissionProfileCard,
};
