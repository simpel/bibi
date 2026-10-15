import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { OWNER_ROLE_ID } from "../role/to-role-dto";
import type { SheetDefinitionContents } from "./schema";

type Db = Pick<OperationContext, "db">;

export type CheckSheetContentsInput = { context: Db; contents: SheetDefinitionContents };

const missing = ({ wanted, found }: { wanted: readonly string[]; found: readonly string[] }) =>
  wanted.filter((id) => !found.includes(id));

/** Ids of the wanted rows that exist: active types of base ITEM, active fields of those types. */
async function findIncluded({ context, contents }: CheckSheetContentsInput) {
  const { entityTypeIds, fieldIds, vocabularyIds } = contents;
  const [types, fields, lists] = await Promise.all([
    context.db.entityType.findMany({
      where: { id: { in: entityTypeIds }, base: "ITEM" },
      select: { id: true },
    }),
    context.db.fieldDefinition.findMany({
      where: { id: { in: fieldIds }, entityTypeId: { in: entityTypeIds } },
      select: { id: true },
    }),
    context.db.vocabulary.findMany({ where: { id: { in: vocabularyIds } }, select: { id: true } }),
  ]);
  return { types, fields, lists };
}

const idsOf = ({ rows }: { rows: readonly { id: string }[] }) => rows.map((row) => row.id);

const dedupe = ({ contents }: { contents: SheetDefinitionContents }) => ({
  ...contents,
  entityTypeIds: [...new Set(contents.entityTypeIds)],
  fieldIds: [...new Set(contents.fieldIds)],
  vocabularyIds: [...new Set(contents.vocabularyIds)],
});

async function roleExists({ context, roleId }: { context: Db; roleId: string }) {
  if (roleId === OWNER_ROLE_ID) return true;
  return (await context.db.organizationRole.findFirst({ where: { id: roleId } })) !== null;
}

/**
 * `VALIDATION` unless every id refers to an active row of the organization: item types,
 * fields of those types, lists and the receiving role. A sheet includes items or requirements.
 */
export async function checkSheetContents({
  context,
  contents: given,
}: CheckSheetContentsInput): Promise<Result<SheetDefinitionContents>> {
  const contents = dedupe({ contents: given });
  const { types, fields, lists } = await findIncluded({ context, contents });
  const problems: [string, string[], string][] = [
    [
      "entityTypeIds",
      missing({ wanted: contents.entityTypeIds, found: idsOf({ rows: types }) }),
      "item types",
    ],
    [
      "fieldIds",
      missing({ wanted: contents.fieldIds, found: idsOf({ rows: fields }) }),
      "fields of the types",
    ],
    [
      "vocabularyIds",
      missing({ wanted: contents.vocabularyIds, found: idsOf({ rows: lists }) }),
      "lists",
    ],
  ];
  const issues: AppErrorIssue[] = problems
    .filter(([, unknown]) => unknown.length > 0)
    .map(([path, unknown, what]) => ({ path, message: `Not ${what}: ${unknown.join(", ")}` }));
  if (!(await roleExists({ context, roleId: contents.roleId }))) {
    issues.push({ path: "roleId", message: `No role with id ${contents.roleId}` });
  }
  if (contents.entityTypeIds.length + contents.vocabularyIds.length === 0) {
    issues.push({ path: "entityTypeIds", message: "Include item types or lists" });
  }
  if (issues.length > 0) return invalid({ message: "The sheet refers to unknown data", issues });
  return ok({ value: contents });
}
