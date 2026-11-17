import type { Prisma } from "@bibi/db";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { hasPermission, type Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import type { BoardDto } from "./schema";

type Viewer = { context: Pick<OperationContext, "actor"> };

/**
 * The views the caller sees (ADR 0111): the default view, views shared with the organization,
 * their own and those shared with them. An API key or SYSTEM (no user) sees every view.
 */
export function visibleBoardWhere({ context }: Viewer): Prisma.BoardWhereInput {
  const { userId } = context.actor;
  if (!userId) return {};
  return {
    OR: [
      { isDefault: true },
      { sharedWithOrganization: true },
      { ownerId: userId },
      { shares: { some: { userId } } },
    ],
  };
}

type Access = { context: Pick<OperationContext, "actor" | "permissions"> };

const forbidden = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "FORBIDDEN", message }) });

const may = ({ context, permission }: Access & { permission: Permission }) =>
  context.actor.type === "system" ||
  hasPermission({ permissions: context.permissions, permission });

type BoardAccessInput = Access & { board: Pick<BoardDto, "isDefault" | "ownerId"> };

/**
 * Edit a view the caller sees (name, filter, columns): everyone it is shared with may; the
 * default view needs `board:write` (ADR 0111).
 */
export function checkBoardEdit({ context, board }: BoardAccessInput): Result<true> {
  if (!board.isDefault || may({ context, permission: "board:write" })) return ok({ value: true });
  return forbidden({ message: "Only managers configure the default view" });
}

/** Change a view's sharing or archive it: its owner, or a holder of `board:delete` (ADR 0111). */
export function checkBoardManage({ context, board }: BoardAccessInput): Result<true> {
  const owner = board.ownerId !== null && board.ownerId === context.actor.userId;
  if (owner || may({ context, permission: "board:delete" })) return ok({ value: true });
  return forbidden({ message: "Only the view's owner changes its sharing or archives it" });
}
