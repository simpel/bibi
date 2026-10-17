import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { ASSIGNMENTS_FIELD, gqlRequest } from "./parity-graphql";
import { createRestClient } from "./parity-rest";
import { seedBooking } from "./seed-booking";
import { seedOrgMember } from "./seed-org-member";

/** Two organizations; A has a booking with a main assignee and a follower (ADR 0034). */
async function setup() {
  const contextA = testContext();
  const contextB = testContext();
  const a = await connect({ context: contextA });
  const b = await connect({ context: contextB });
  const memberA = await seedOrgMember({ context: contextA });
  const memberB = await seedOrgMember({ context: contextB });
  const { id } = await seedBooking({ client: a });
  const subject = { subjectType: "BOOKING", subjectId: id };
  const assigned = await call({
    client: a,
    name: "assignment_assign",
    args: { ...subject, assigneeId: memberA.userId },
  });
  expect(assigned.isError, JSON.stringify(assigned.data)).toBe(false);
  return { contextA, contextB, a, b, memberA, memberB, subject };
}

describe("cross-organization isolation: assignments", () => {
  it("hides and protects one organization's assignments across MCP, GraphQL and REST", async () => {
    const { contextB, b, memberA, memberB, subject } = await setup();
    for (const [name, args] of [
      ["assignment_list", subject],
      ["assignment_assign", { ...subject, assigneeId: memberB.userId }],
      ["assignment_follow", { ...subject, userId: memberB.userId }],
      ["assignment_unfollow", { ...subject, userId: memberA.userId }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const mine = await call({ client: b, name: "assignment_listMine", args: { kind: "ASSIGNED" } });
    expect(mine.data.items).toEqual([]);
    const query = `query($t: String!, $id: String!) { ${ASSIGNMENTS_FIELD} { items { id } } }`;
    const graph = await gqlRequest({
      context: contextB,
      query,
      variables: { t: subject.subjectType, id: subject.subjectId },
    });
    expect(graph.errors?.[0]?.extensions?.code).toBe("NOT_FOUND");
    const rest = createRestClient({ context: contextB });
    const path = `/assignments/${subject.subjectType}/${subject.subjectId}`;
    expect(await rest.send({ method: "GET", path })).toBe(404);
    expect(await rest.send({ method: "PUT", path, body: { assigneeId: memberB.userId } })).toBe(
      404,
    );
  });

  it("refuses an assignee from another organization", async () => {
    const { a, memberB, subject } = await setup();
    const foreign = await call({
      client: a,
      name: "assignment_assign",
      args: { ...subject, assigneeId: memberB.userId },
    });
    expect(foreign.data.code).toBe("VALIDATION");
    const follow = await call({
      client: a,
      name: "assignment_follow",
      args: { ...subject, userId: memberB.userId },
    });
    expect(follow.data.code).toBe("VALIDATION");
  });
});
