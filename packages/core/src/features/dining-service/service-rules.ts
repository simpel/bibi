import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import type { DiningServiceDto } from "./schema";

type Ctx = { context: Pick<OperationContext, "db"> };

export type ServiceShape = Pick<
  DiningServiceDto,
  | "name"
  | "layoutId"
  | "firstStartMinute"
  | "lastStartMinute"
  | "validFrom"
  | "validUntil"
  | "depositFromParty"
  | "depositPerCoverMinor"
>;

/** Whether `layoutId` is an active layout of the room. */
export async function isRoomLayout({
  context,
  roomItemId,
  layoutId,
}: Ctx & { roomItemId: string; layoutId: string }) {
  const found = await context.db.setupLayout.findFirst({
    where: { id: layoutId, itemId: roomItemId },
    select: { id: true },
  });
  return found !== null;
}

/** The shape of a sitting (ADR 0119): times in order, a season that ends after it starts, a deposit rule with both parts. */
function shapeIssues({ service }: { service: ServiceShape }): AppErrorIssue[] {
  const issues: AppErrorIssue[] = [];
  if (service.lastStartMinute < service.firstStartMinute)
    issues.push({ path: "lastStartMinute", message: "The last start is before the first" });
  if (service.validFrom && service.validUntil && service.validUntil <= service.validFrom)
    issues.push({ path: "validUntil", message: "The season ends before it starts" });
  if ((service.depositFromParty === null) !== (service.depositPerCoverMinor === null))
    issues.push({
      path: "depositPerCoverMinor",
      message: "A deposit needs both a party size and an amount",
    });
  return issues;
}

export type CheckServiceInput = Ctx & {
  roomItemId: string;
  service: ServiceShape;
  /** The sitting being changed, so its own name is not a clash. */
  id?: string;
};

/** Everything a sitting must satisfy before it is saved. */
export async function checkService({
  context,
  roomItemId,
  service,
  id,
}: CheckServiceInput): Promise<Result<true>> {
  const room = await context.db.diningRoom.findFirst({
    where: { itemId: roomItemId },
    select: { id: true },
  });
  if (!room) {
    const message = "Set the room up for table booking first (diningRoom.set)";
    return invalid({ message, issues: [{ path: "roomItemId", message }] });
  }
  const issues = shapeIssues({ service });
  if (!(await isRoomLayout({ context, roomItemId, layoutId: service.layoutId })))
    issues.push({ path: "layoutId", message: "Not a layout of this room" });
  if (issues.length > 0)
    return invalid({ message: issues[0]?.message ?? "Invalid sitting", issues });
  const clash = await context.db.diningService.findFirst({
    where: {
      roomItemId,
      name: { equals: service.name, mode: "insensitive" },
      ...(id ? { id: { not: id } } : {}),
    },
    select: { id: true },
  });
  if (clash) return conflict({ message: `The room already has a sitting named "${service.name}"` });
  return ok({ value: true });
}
