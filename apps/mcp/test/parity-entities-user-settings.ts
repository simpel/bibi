import { type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** The caller's own settings (ADR 0046): updated via MCP, read back from every surface. */
export const userSettingsEntity: ParityEntity = {
  name: "userSettings",
  create: ({ mcp }) =>
    tool({ mcp, name: "userSettings_update", args: { onboardingStatus: "PENDING" } }),
  viaMcp: ({ mcp }) => tool({ mcp, name: "userSettings_get", args: {} }),
  viaRest: ({ context }) => createRestClient({ context }).get({ path: "/user-settings" }),
  viaGraph: async ({ context, keys }) => {
    const query = `query { userSettings { ${keys.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: {} })).userSettings;
  },
};
