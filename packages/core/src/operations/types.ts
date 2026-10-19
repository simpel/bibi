import type { ScopedDbClient } from "@okazi/db";
import type { z } from "zod";
import type { Result } from "../errors/result";
import type { PermissionSet } from "../permissions/permission-set";
import type { Embeddable } from "../search/embeddable";
import type { Permission } from "./permission";

export type ActorKind = "user" | "ai" | "system";

/** How the caller signed in (`packages/auth`); absent for system jobs and internal callers. */
export type CredentialKind = "session" | "accessToken" | "apiKey";

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
  /** Role names of the user in the organization, e.g. `["Sales"]`. Display and audit only. */
  roles: readonly string[];
  /** What the caller may do, resolved from `roles` by `packages/auth` (ADR 0034). */
  permissions: PermissionSet;
  /** The credential the caller presented; set by `resolveExecuteContext` (ADR 0005). */
  credential?: CredentialKind;
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
  /**
   * `false`: the AI actor may never run it, so the assistant is not even offered the tool (e.g.
   * `apiKey.create`, whose secret must not enter a chat). Defaults to true.
   */
  aiAllowed?: boolean;
  /**
   * A query that runs a command's logic inside a transaction that is always rolled back, so it
   * can report what the command would do (and what would block it) without changing anything.
   */
  dryRun?: boolean;
  /** Entity re-indexed for search after a successful command (reads `output.id`). */
  embeddable?: Embeddable;
  /** Entity type for audit rows; defaults to the name prefix. */
  entityType?: string;
  /**
   * The output carries text written by external parties (e.g. inbound mail). Surfaced in the MCP
   * tool `_meta` so the assistant wraps results as untrusted data. Defaults to false.
   */
  untrustedOutput?: boolean;
};

export type Operation<I extends z.ZodType = z.ZodType, O extends z.ZodType = z.ZodType> = Readonly<
  Required<
    Pick<OperationDefinition<I, O>, "approval" | "aiAllowed" | "entityType" | "untrustedOutput">
  > &
    Omit<OperationDefinition<I, O>, "approval" | "aiAllowed" | "entityType" | "untrustedOutput">
>;

/** Erased operation type for registries and adapters. */
export type AnyOperation = Operation<z.ZodType, z.ZodType>;
