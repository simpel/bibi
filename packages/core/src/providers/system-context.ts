import type { Db } from "@bibi/db";
import { createExecuteContext } from "../operations/context";
import { grantAll } from "../permissions/permission-set";

export type ProviderSystemContextInput = { db: Db; organizationId: string };

/** A SYSTEM context pinned to one organization (ADR 0004), for applying provider events. */
export const providerSystemContext = ({ db, organizationId }: ProviderSystemContextInput) =>
  createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
    db,
  });
