import { type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** A member's profile (ADR 0068): one per member, read by member id; created by linking a staff item. */
export function memberProfileEntity(): ParityEntity {
  const args = ({ created }: { created: { memberId: string } }) => ({ memberId: created.memberId });
  return {
    name: "memberProfile",
    create: async ({ mcp, made }) => {
      const memberId = made.memberSeed.id;
      const type = await tool({
        mcp,
        name: "entityType_create",
        args: {
          base: "ITEM",
          name: "Parity crew",
          capabilities: ["BOOKABLE"],
          resourceKind: "PERSON",
        },
      });
      const item = await tool({
        mcp,
        name: "item_create",
        args: { entityTypeId: type.id, name: "Parity staff" },
      });
      await tool({ mcp, name: "memberProfile_update", args: { memberId, scheduleKind: "SHIFTS" } });
      return tool({ mcp, name: "memberProfile_setItems", args: { memberId, itemIds: [item.id] } });
    },
    viaMcp: ({ mcp, created }) => tool({ mcp, name: "memberProfile_get", args: args({ created }) }),
    viaRest: ({ context, created }) =>
      createRestClient({ context }).get({ path: `/members/${created.memberId}/profile` }),
    viaGraph: async ({ context, created, keys }) => {
      const query = `query($m: String!) { memberProfile(memberId: $m) { ${keys.join(" ")} } }`;
      const variables = { m: created.memberId };
      return (await gqlQuery({ context, query, variables })).memberProfile;
    },
  };
}
