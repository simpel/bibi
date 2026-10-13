export { type CreateCoreOperationsInput, createCoreOperations } from "./core-operations";
export {
  APP_ERROR_CODES,
  AppError,
  type AppErrorCode,
  type AppErrorInput,
  type AppErrorIssue,
  appError,
} from "./errors/app-error";
export { fromUnknown } from "./errors/from-unknown";
export { fromZodError } from "./errors/from-zod-error";
export { type Err, err, type Ok, ok, type Result } from "./errors/result";
export { type GraphqlErrorExtensions, toGraphqlExtensions } from "./errors/to-graphql-extensions";
export { toHttpStatus } from "./errors/to-http-status";
export { type McpErrorResult, toMcpError } from "./errors/to-mcp-error";
export { roomEmbeddable } from "./features/room/embeddable";
export * from "./features/room/operations";
export * from "./features/room/schema";
export { venueEmbeddable } from "./features/venue/embeddable";
export * from "./features/venue/operations";
export * from "./features/venue/schema";
export {
  type CreateExecuteContextInput,
  createExecuteContext,
  type ExecuteContext,
} from "./operations/context";
export { defineOperation } from "./operations/define-operation";
export {
  type AfterCommitHook,
  type AfterCommitInput,
  type ExecuteInput,
  execute,
} from "./operations/execute";
export { hasPermission, type Permission, type PermissionAction } from "./operations/permission";
export { getOperation, listOperations, registerOperations } from "./operations/registry";
export { requiresApproval } from "./operations/requires-approval";
export type {
  Actor,
  ActorKind,
  AnyOperation,
  HandlerInput,
  Operation,
  OperationContext,
  OperationDefinition,
  OperationKind,
  RecordedChange,
} from "./operations/types";
export type { EmbedFn, EmbedInput, EmbedOutput } from "./search/embed";
export type { Embeddable, LoadInput, ToTextInput } from "./search/embeddable";
export { type IndexEntityInput, type IndexEntityOutcome, indexEntity } from "./search/index-entity";
export { createIndexingHook } from "./search/indexing-hook";
export { createSearchOperation } from "./search/search-operation";
export {
  type SearchHit,
  SearchHitSchema,
  type SearchInput,
  SearchInputSchema,
  SearchOutputSchema,
} from "./search/search-schema";
