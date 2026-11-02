import type { Db } from "@bibi/db";
import { createExecuteContext } from "../../../../operations/context";
import { grantAll } from "../../../../permissions/permission-set";

/** A SYSTEM context pinned to one organization (ADR 0004), as the Stripe webhook builds it. */
export const fortnoxSystemContext = ({ db, organizationId }: { db: Db; organizationId: string }) =>
  createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
    db,
  });
