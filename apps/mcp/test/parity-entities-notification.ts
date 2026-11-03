import { getDb } from "@bibi/db";
import { type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

type Item = { id: string; kind?: string };

const byId = ({ items, id }: { items: Item[]; id: string }) => items.find((item) => item.id === id);

/**
 * One of the caller's own notifications (ADR 0094). Only core's `notify` writes them, so the test
 * inserts one for the caller and reads it back from each surface's list.
 */
export const notificationEntity: ParityEntity = {
  name: "notification",
  create: async ({ mcp, context }) => {
    const row = await getDb().notification.create({
      data: {
        organizationId: context.organizationId,
        recipientUserId: context.actor.userId ?? "",
        kind: "ASSIGNED",
        data: { ticketReference: 7, ticketTitle: "Parity" },
      },
    });
    return byId({
      items: (await tool({ mcp, name: "notification_list", args: {} })).items,
      id: row.id,
    });
  },
  viaMcp: async ({ mcp, created }) =>
    byId({
      items: (await tool({ mcp, name: "notification_list", args: {} })).items,
      id: created.id,
    }),
  viaRest: async ({ context, created }) =>
    byId({
      items: (await createRestClient({ context }).get({ path: "/notifications" })).items,
      id: created.id,
    }),
  viaGraph: async ({ context, created, keys }) => {
    const query = `query { notifications { items { ${keys.join(" ")} } } }`;
    const data = await gqlQuery({ context, query, variables: {} });
    return byId({ items: data.notifications.items, id: created.id });
  },
};

const byKind = ({ items, kind }: { items: Item[]; kind: string }) =>
  items.find((item) => item.kind === kind);

/** The caller's choice of one kind (ADR 0094): set via MCP, read back from each surface's list. */
export const notificationPreferenceEntity: ParityEntity = {
  name: "notificationPreference",
  create: ({ mcp }) =>
    tool({
      mcp,
      name: "notificationPreference_set",
      args: { kind: "PAYMENT_RECEIVED", enabled: false },
    }),
  viaMcp: async ({ mcp, created }) =>
    byKind({
      items: (await tool({ mcp, name: "notificationPreference_list", args: {} })).items,
      kind: created.kind,
    }),
  viaRest: async ({ context, created }) =>
    byKind({
      items: (await createRestClient({ context }).get({ path: "/notification-preferences" })).items,
      kind: created.kind,
    }),
  viaGraph: async ({ context, created, keys }) => {
    const query = `query { notificationPreferences { items { ${keys.join(" ")} } } }`;
    const data = await gqlQuery({ context, query, variables: {} });
    return byKind({ items: data.notificationPreferences.items, kind: created.kind });
  },
};
