import { type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

const KEY = "parity.columns";

type Item = { id: string };

const byId = ({ items, id }: { items: Item[]; id: string }) => items.find((item) => item.id === id);

/** The caller's own preference (ADR 0039): saved via MCP, read back from each surface's list. */
export const userPreferenceEntity: ParityEntity = {
  name: "userPreference",
  create: ({ mcp }) => tool({ mcp, name: "userPreference_set", args: { key: KEY, value: ["a"] } }),
  viaMcp: async ({ mcp, created }) =>
    byId({
      items: (await tool({ mcp, name: "userPreference_list", args: { prefix: KEY } })).items,
      id: created.id,
    }),
  viaRest: async ({ context, created }) =>
    byId({
      items: (await createRestClient({ context }).get({ path: `/user-preferences?prefix=${KEY}` }))
        .items,
      id: created.id,
    }),
  viaGraph: async ({ context, created, keys }) => {
    const query = `query($p: String) { userPreferences(prefix: $p) { items { ${keys.join(" ")} } } }`;
    const data = await gqlQuery({ context, query, variables: { p: KEY } });
    return byId({ items: data.userPreferences.items, id: created.id });
  },
};
