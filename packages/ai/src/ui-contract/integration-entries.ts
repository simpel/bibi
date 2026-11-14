import { IntegrationConnectionSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a connection to an outside system as tool results carry it (dates = ISO strings). */
export const IntegrationWireSchema = IntegrationConnectionSchema.extend({
  connectedAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  setupCheckedAt: z.string().nullable(),
});

export type IntegrationWire = z.infer<typeof IntegrationWireSchema>;

const integrationList = uiEntry({
  component: "integration-card",
  schema: z.object({ items: z.array(IntegrationWireSchema) }),
  toProps: ({ value }) => ({ items: value.items, authorizeUrl: null }),
});

const integrationOne = uiEntry({
  component: "integration-card",
  schema: IntegrationWireSchema.extend({ authorizeUrl: z.string().nullish() }),
  toProps: ({ value }) => ({ items: [value], authorizeUrl: value.authorizeUrl ?? null }),
});

/** Tool → component for the organization's connections to outside systems (ADR 0087). */
export const INTEGRATION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  integration_list: integrationList,
  integration_connect: integrationOne,
  integration_checkSetup: integrationOne,
  integration_disconnect: integrationOne,
};
