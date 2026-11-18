import type { Db } from "@bibi/db";
import { createSystemContext } from "../operations/context";

export type ProviderSystemContextInput = { db: Db; organizationId: string };

/** A SYSTEM context pinned to one organization (ADR 0004), for applying provider events. */
export const providerSystemContext = ({ db, organizationId }: ProviderSystemContextInput) =>
  createSystemContext({
    organizationId,
    db,
  });
