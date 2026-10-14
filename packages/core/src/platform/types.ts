import type { Db } from "@okazi/db";
import type { z } from "zod";
import type { Result } from "../errors/result";
import type { OperationKind, RecordedChange } from "../operations/types";

/** A platform admin (verified by `@okazi/auth`) or trusted system code. Never the AI actor. */
export type PlatformActor = { type: "user"; userId: string } | { type: "system"; userId: null };

/**
 * Caller of a platform operation (ADR 0015). Not tied to an organization. `platformRole` is
 * set only by `resolvePlatformContext` in `@okazi/auth` after reading `user.role` live.
 */
export type PlatformContext = {
  actor: PlatformActor;
  platformRole: "admin" | null;
  db: Db;
};

/** Least privilege: platform handlers only see the platform tables. */
export type PlatformDb = Pick<Db, "systemLog" | "aiSetting">;

export type PlatformHandlerContext = {
  actor: PlatformActor;
  db: PlatformDb;
  recordChange: (change: RecordedChange) => void;
};

export type PlatformHandlerInput<I> = { input: I; context: PlatformHandlerContext };

export type PlatformOperationDefinition<I extends z.ZodType, O extends z.ZodType> = {
  /** `<area>.<verb>`, e.g. `systemLog.list`. Never registered with the org registry. */
  name: string;
  kind: OperationKind;
  description: string;
  input: I;
  output: O;
  handler(args: PlatformHandlerInput<z.infer<I>>): Promise<Result<z.input<O>>>;
  /** Entity type for audit rows; defaults to the name prefix. */
  entityType?: string;
};

export type PlatformOperation<
  I extends z.ZodType = z.ZodType,
  O extends z.ZodType = z.ZodType,
> = Readonly<
  Omit<PlatformOperationDefinition<I, O>, "entityType"> & { entityType: string; scope: "platform" }
>;

export type AnyPlatformOperation = PlatformOperation<z.ZodType, z.ZodType>;
