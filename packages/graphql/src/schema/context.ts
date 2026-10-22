import type { AfterCommitHook, AnyOperation, ExecuteContext } from "@bibi/core";
import type { Loaders } from "./loaders";

/** Per-request GraphQL context. `core` is the org-scoped ExecuteContext handed to `execute`. */
export type GraphqlContext = {
  core: ExecuteContext;
  /** Hooks run after a command committed, e.g. search indexing. */
  afterCommit: readonly AfterCommitHook[];
  /** Runtime operation implementations by name (search needs the injected `embed`). */
  operations: ReadonlyMap<string, AnyOperation>;
  /** Per-request dataloaders for graph edges (org-scoped, resolvers check permission first). */
  loaders: Loaders;
};
