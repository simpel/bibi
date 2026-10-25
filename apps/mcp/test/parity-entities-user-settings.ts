import { type ParityEntity, tool } from "./parity-entities";
import { userPreferenceEntity } from "./parity-entities-user-preference";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** The caller's own settings (ADR 0046): updated via MCP, read back from every surface. */
export const userSettingsEntity: ParityEntity = {
  name: "userSettings",
  create: ({ mcp }) =>
    tool({
      mcp,
      name: "userSettings_update",
      args: { dateFormat: "YYYY_MM_DD", clockFormat: "H12" },
    }),
  viaMcp: ({ mcp }) => tool({ mcp, name: "userSettings_get", args: {} }),
  viaRest: ({ context }) => createRestClient({ context }).get({ path: "/user-settings" }),
  viaGraph: async ({ context, keys }) => {
    const query = `query { userSettings { ${keys.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: {} })).userSettings;
  },
};

/** The caller's own data: preferences and settings. */
export const selfEntities = (): ParityEntity[] => [userPreferenceEntity, userSettingsEntity];
