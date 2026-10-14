import type { AfterCommitHook, AnyOperation, ExecuteContext } from "@okazi/core";

/** Per-request GraphQL context. `core` is the org-scoped ExecuteContext handed to `execute`. */
export type GraphqlContext = {
  core: ExecuteContext;
  /** Hooks run after a command committed, e.g. search indexing. */
  afterCommit: readonly AfterCommitHook[];
  /** Runtime operation implementations by name (search needs the injected `embed`). */
  operations: ReadonlyMap<string, AnyOperation>;
};
