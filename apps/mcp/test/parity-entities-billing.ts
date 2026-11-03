import { type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** Bibi's own subscription (ADR 0095): the first change creates the row, then every surface reads it. */
export const billingEntity: ParityEntity = {
  name: "billingAccount",
  create: async ({ mcp }) => {
    await tool({ mcp, name: "billing_update", args: { autoAssignSeats: false } });
    return tool({ mcp, name: "billing_get", args: {} });
  },
  viaMcp: ({ mcp }) => tool({ mcp, name: "billing_get", args: {} }),
  viaRest: ({ context }) => createRestClient({ context }).get({ path: "/billing" }),
  viaGraph: async ({ context, keys }) => {
    const query = `query { billing { ${keys.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: {} })).billing;
  },
};
