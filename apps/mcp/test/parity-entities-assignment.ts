import type { ParityEntity } from "./parity-entities";
import { tool } from "./parity-entities";
import { ASSIGNMENTS_FIELD, gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** The inquiry made earlier gets the seeded member as main assignee and follower (ADR 0034). */
export const assignment = (): ParityEntity => ({
  name: "assignment",
  create: async ({ mcp, made }) => {
    const subject = { subjectType: "INQUIRY", subjectId: made.inquiry.id };
    const userId = made.memberSeed.userId;
    await tool({ mcp, name: "assignment_assign", args: { ...subject, assigneeId: userId } });
    return tool({ mcp, name: "assignment_follow", args: { ...subject, userId } });
  },
  viaMcp: async ({ mcp, created }) =>
    (
      await tool({
        mcp,
        name: "assignment_list",
        args: { subjectType: created.subjectType, subjectId: created.subjectId },
      })
    ).items[0],
  viaRest: async ({ context, created }) =>
    (
      await createRestClient({ context }).get({
        path: `/assignments/${created.subjectType}/${created.subjectId}`,
      })
    ).items[0],
  viaGraph: async ({ context, created, keys }) => {
    const selection = `{ items { ${keys.join(" ")} } }`;
    const query = `query($t: String!, $id: String!) { ${ASSIGNMENTS_FIELD} ${selection} }`;
    const variables = { t: created.subjectType, id: created.subjectId };
    return (await gqlQuery({ context, query, variables })).assignments.items[0];
  },
});
