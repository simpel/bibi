import { createId } from "@paralleldrive/cuid2";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** Invitations are read back from the pending list of each surface. */
const invitation: ParityEntity = {
  name: "invitation",
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "member_invite",
      args: { email: `invitee-${createId()}@x.test`, roles: [made.role.name] },
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
 * Roles and members (ADR 0020). There is no `member.create`: the parity test seeds one member
 * row (`made.memberSeed`) and the entity is "created" by assigning it the role made before.
 * Invitations come next: they invite with that role. The audit log comes last: it reads the
 * history the creates above wrote.
 */
export function accessEntities(): ParityEntity[] {
  const member: ParityEntity = {
    name: "member",
    create: ({ mcp, made }) =>
      tool({
        mcp,
        name: "member_assignRole",
        args: { id: made.memberSeed.id, roles: [made.role.name] },
      }),
    viaMcp: async ({ mcp, created }) =>
      (await tool({ mcp, name: "member_list", args: {} })).items.find(
        (item: { id: string }) => item.id === created.id,
      ),
    viaRest: async ({ context, created }) =>
      (await createRestClient({ context }).get({ path: "/members" })).items.find(
        (item: { id: string }) => item.id === created.id,
      ),
    viaGraph: async ({ context, created, keys }) => {
      const query = `query { members { items { ${keys.join(" ")} } } }`;
      const data = await gqlQuery({ context, query, variables: {} });
      return data.members.items.find((item: { id: string }) => item.id === created.id);
    },
  };
  return [
    byId({
      name: "role",
      field: "role",
      list: "roles",
      createTool: "role_create",
      args: { name: "Parity role", permissions: { venue: ["write"], item: ["read"] } },
    }),
    member,
    invitation,
    auditLog,
  ];
}
