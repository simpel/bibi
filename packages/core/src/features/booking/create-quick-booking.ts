import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { insertProgramItem } from "../program-item/insert-program-item";
import { confirmQuickBooking } from "./confirm-quick-booking";
import { insertBooking } from "./insert-booking";
import type { QuickBookingInput } from "./quick-schema";
import type { BookingDto } from "./schema";

type Context = { context: OperationContext };

/** Creating the program item is a second write, so it needs its own permission. */
function checkProgramItemPermission({ context }: Context): Result<true> {
  const { actor, permissions } = context;
  if (actor.type === "system" || hasPermission({ permissions, permission: "programItem:write" })) {
    return ok({ value: true });
  }
  const message = "Missing permission programItem:write";
  return err({ error: new AppError({ code: "FORBIDDEN", message }) });
}

async function loadItemName({ context, itemId }: Context & { itemId: string }) {
  const item = await context.db.item.findFirst({ where: { id: itemId }, select: { name: true } });
  if (item) return ok({ value: item.name });
  const message = "Unknown item";
  return invalid({ message, issues: [{ path: "itemId", message }] });
}

export type CreateQuickBookingInput = Context & { input: QuickBookingInput };

/**
 * One step for a small meeting (ADR 0022): booking (TENTATIVE), one program item occupying the
 * bookable item and, for an invoice, the move to `CONFIRMED`. Any refusal rolls everything back.
 */
export async function createQuickBooking({
  context,
  input,
}: CreateQuickBookingInput): Promise<Result<BookingDto>> {
  const allowed = checkProgramItemPermission({ context });
  if (!allowed.ok) return allowed;
  const itemName = await loadItemName({ context, itemId: input.itemId });
  if (!itemName.ok) return itemName;
  const { startsAt, endsAt, quantity } = input;
  const booking = await insertBooking({
    context,
    input: {
      entityTypeId: input.entityTypeId,
      customerId: input.customerId,
      startsAt,
      endsAt,
      estimatedHeadcount: quantity,
      assigneeId: input.assigneeId ?? context.actor.userId,
    },
  });
  if (!booking.ok) return booking;
  const programItem = await insertProgramItem({
    context,
    input: {
      bookingId: booking.value.id,
      entityTypeId: input.programItemTypeId,
      name: itemName.value,
      startsAt,
      endsAt,
      itemId: input.itemId,
      setupId: input.setupId ?? null,
      quantity,
    },
  });
  if (!programItem.ok) return programItem;
  if (input.paymentMethod !== "INVOICE") return booking;
  return confirmQuickBooking({ context, booking: booking.value });
}
