import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { ResponsibilityContents } from "./schema";

type Db = Pick<OperationContext, "db">;

export type CheckResponsibilityInput = { context: Db; contents: ResponsibilityContents };

const unknownIds = ({ wanted, found }: { wanted: readonly string[]; found: readonly string[] }) =>
  wanted.filter((id) => !found.includes(id));

const dedupe = ({ ids }: { ids: readonly string[] }) => [...new Set(ids)];

/** The wanted ids that are not active item types / not members of the organization. */
async function findUnknown({ context, contents }: CheckResponsibilityInput) {
  const people = dedupe({ ids: [contents.defaultAssigneeId, ...contents.defaultFollowerIds] });
  const [types, members] = await Promise.all([
    context.db.entityType.findMany({
      where: { id: { in: contents.entityTypeIds }, base: "ITEM" },
      select: { id: true },
    }),
    context.db.member.findMany({ where: { userId: { in: people } }, select: { userId: true } }),
  ]);
  return {
    types: unknownIds({ wanted: contents.entityTypeIds, found: types.map((row) => row.id) }),
    people: unknownIds({ wanted: people, found: members.map((row) => row.userId) }),
  };
}

const issue = ({ path, what, ids }: { path: string; what: string; ids: string[] }) =>
  ids.length > 0 ? [{ path, message: `Not ${what}: ${ids.join(", ")}` }] : [];

/**
 * `VALIDATION` unless every covered type is an active item type of the organization and the
 * default assignee and followers are members of it (ADR 0034). The assignee is not repeated
 * among the followers. Returns the contents with duplicates removed.
 */
export async function checkResponsibilityContents({
  context,
  contents: given,
}: CheckResponsibilityInput): Promise<Result<ResponsibilityContents>> {
  const contents: ResponsibilityContents = {
    entityTypeIds: dedupe({ ids: given.entityTypeIds }),
    defaultAssigneeId: given.defaultAssigneeId,
    defaultFollowerIds: dedupe({ ids: given.defaultFollowerIds }).filter(
      (id) => id !== given.defaultAssigneeId,
    ),
  };
  const found = await findUnknown({ context, contents });
  const issues: AppErrorIssue[] = [
    ...issue({ path: "entityTypeIds", what: "item types", ids: found.types }),
    ...issue({
      path: "defaultAssigneeId",
      what: "a member",
      ids: found.people.filter((id) => id === contents.defaultAssigneeId),
    }),
    ...issue({
      path: "defaultFollowerIds",
      what: "members",
      ids: found.people.filter((id) => id !== contents.defaultAssigneeId),
    }),
  ];
  if (issues.length > 0)
    return invalid({ message: "The responsibility refers to unknown data", issues });
  return ok({ value: contents });
}
