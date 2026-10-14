import type { ScopedDbClient } from "@okazi/db";
import type { z } from "zod";
import type { Result } from "../errors/result";
import type { PermissionSet } from "../permissions/permission-set";
import type { Embeddable } from "../search/embeddable";
import type { Permission } from "./permission";

export type ActorKind = "user" | "ai" | "system";

/**
 * Who is executing. AI acts on behalf of `userId`; `conversationId` links the AI chat.
 * `approvedBy` is set (by the approval flow only) to the user who confirmed an AI proposal.
 */
export type Actor = {
  type: ActorKind;
  userId: string | null;
  conversationId?: string;
  approvedBy?: string;
};

/** One entity change recorded by a command handler; becomes an AuditLog row. */
export type RecordedChange = {
  entityType?: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

export type OperationContext = {
  organizationId: string;
  actor: Actor;
  /** Org-scoped Prisma client (inside the command transaction for commands). */
  db: ScopedDbClient;
  /** Role names of the user in the organization, e.g. `["Säljare"]`. Display and audit only. */
  roles: readonly string[];
  /** What the caller may do, resolved from `roles` by `packages/auth` (ADR 0020). */
  permissions: PermissionSet;
  /** Commands call this so audit rows carry entity id and before/after state. */
  recordChange: (change: RecordedChange) => void;
};

export type OperationKind = "command" | "query";

export type HandlerInput<I> = { input: I; context: OperationContext };

export type OperationDefinition<I extends z.ZodType, O extends z.ZodType> = {
  /** Dot-separated, `<entity>.<verb>`, e.g. `venue.create`. Stable across all surfaces. */
  name: string;
  kind: OperationKind;
  /** Shown to humans and LLMs (MCP tool description, OpenAPI summary). */
  description: string;
  input: I;
  output: O;
  permission: Permission;
  /** Method syntax on purpose: keeps typed operations assignable to `AnyOperation`. */
  handler(args: HandlerInput<z.infer<I>>): Promise<Result<z.input<O>>>;
  /** Require human approval when an AI actor runs it. Defaults to true for commands. */
  approval?: boolean;
  /** Entity re-indexed for search after a successful command (reads `output.id`). */
  embeddable?: Embeddable;
  /** Entity type for audit rows; defaults to the name prefix. */
  entityType?: string;
};

export type Operation<I extends z.ZodType = z.ZodType, O extends z.ZodType = z.ZodType> = Readonly<
  Required<Pick<OperationDefinition<I, O>, "approval" | "entityType">> &
    Omit<OperationDefinition<I, O>, "approval" | "entityType">
>;

/** Erased operation type for registries and adapters. */
export type AnyOperation = Operation<z.ZodType, z.ZodType>;
