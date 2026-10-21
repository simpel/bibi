/** Prisma operations by kind, as `scopedDb` scopes them. */
export const READ_OPERATIONS = new Set<string>([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

export const CREATE_OPERATIONS = new Set<string>(["create", "createMany", "createManyAndReturn"]);

export const UPDATE_OPERATIONS = new Set<string>(["update", "updateMany", "updateManyAndReturn"]);

export const DELETE_OPERATIONS = new Set<string>(["delete", "deleteMany"]);
