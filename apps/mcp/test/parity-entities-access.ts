import { createId } from "@paralleldrive/cuid2";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** Invitations are read back from the pending list of each surface. */
const invitation: ParityEntity = {
  name: "invitation",
  create: ({ mcp }) =>
    tool({
      mcp,
      name: "member_invite",
      args: { email: `invitee-${createId()}@x.test`, role: "manager" },
    }),
  viaMcp: async ({ mcp, created }) =>
    (await tool({ mcp, name: "member_listInvitations", args: {} })).items.find(
      (item: { id: string }) => item.id === created.id,
    ),
  viaRest: async ({ context, created }) =>
    (await createRestClient({ context }).get({ path: "/invitations" })).items.find(
      (item: { id: string }) => item.id === created.id,
    ),
  viaGraph: async ({ context, created, keys }) => {
    const query = `query { invitations { items { ${keys.join(" ")} } } }`;
    const data = await gqlQuery({ context, query, variables: {} });
    return data.invitations.items.find((item: { id: string }) => item.id === created.id);
  },
};

/** Audit rows are written by commands; the venue's creation row is read back by id. */
const auditLog: ParityEntity = {
  ...byId({ name: "auditLog", field: "auditLog", list: "audit-logs", createTool: "", args: {} }),
  create: async ({ mcp, made }) =>
    (
      await tool({
        mcp,
        name: "auditLog_list",
        args: { entityType: "venue", entityId: made.venue.id, limit: 1 },
      })
    ).items[0],
};

/**
 * A member's permission profile (ADR 0050): "created" by saving one override, read back by
 * subject. It has no `id` of its own, so the parity test identifies it by `subjectId`.
 */
const permission: ParityEntity = {
  name: "permission",
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "permission_update",
      args: {
        subjectType: "member",
        subjectId: made.memberSeed.id,
        overrides: [{ feature: "item", action: "write", effect: "allow" }],
      },
    }),
  viaMcp: ({ mcp, created }) =>
    tool({
      mcp,
      name: "permission_get",
      args: { subjectType: "member", subjectId: created.subjectId },
    }),
  viaRest: ({ context, created }) =>
    createRestClient({ context }).get({ path: `/permissions/member/${created.subjectId}` }),
  viaGraph: async ({ context, created, keys }) => {
    const query = `query($id: String!) { permission(subjectType: "member", subjectId: $id) { ${keys.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: { id: created.subjectId } })).permission;
  },
};

/**
 * Members with fixed roles (ADR 0034). There is no `member.create`: the parity test seeds one
 * member row (`made.memberSeed`) and the entity is "created" by assigning it a fixed role.
 * Invitations come next. The audit log comes last: it reads the history the creates above wrote.
 */
export function accessEntities(): ParityEntity[] {
  const member: ParityEntity = {
    name: "member",
    create: ({ mcp, made }) =>
      tool({
        mcp,
        name: "member_assignRole",
        args: { id: made.memberSeed.id, role: "manager" },
      }),
    viaMcp: ({ mcp, created }) => tool({ mcp, name: "member_get", args: { id: created.id } }),
    viaRest: ({ context, created }) =>
      createRestClient({ context }).get({ path: `/members/${created.id}` }),
    viaGraph: async ({ context, created, keys }) => {
      const query = `query($id: String!) { member(id: $id) { ${keys.join(" ")} } }`;
      return (await gqlQuery({ context, query, variables: { id: created.id } })).member;
    },
  };
  return [member, permission, invitation, auditLog];
}
