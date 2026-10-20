import { type ExecuteContext, execute, listAssignments, updateResponsibility } from "../src/index";
import { ticketSubject } from "./assignment-helpers";
import { testContext, unwrap } from "./helpers";
import { sheetSetup } from "./sheet-helpers";
import { memberUser } from "./ticket-helpers";

/** A ticket with a room line, and its responsibility covering the room's type (ADR 0055). */
export async function derivedSetup() {
  const base = await sheetSetup();
  const { context, roomType, definition, ticket } = base;
  const erik = await memberUser({ context, name: "Erik Lund" });
  const johan = await memberUser({ context, name: "Johan Ek" });
  const maria = await memberUser({ context, name: "Maria Holm" });
  const responsibilityId = definition.responsibilityId;
  type Defaults = { defaultAssigneeId?: string; defaultFollowerIds?: string[] };
  const update = ({ ...input }: Defaults) =>
    execute({
      operation: updateResponsibility,
      input: { id: responsibilityId, ...input },
      context,
    });
  unwrap({ result: await update({ defaultAssigneeId: erik, defaultFollowerIds: [johan] }) });
  unwrap({
    result: await execute({
      operation: updateResponsibility,
      input: { id: responsibilityId, entityTypeIds: [roomType.id] },
      context,
    }),
  });
  const slot = { ...ticketSubject(ticket), responsibilityId };
  const part = async () => {
    const list = unwrap({
      result: await execute({ operation: listAssignments, input: ticketSubject(ticket), context }),
    });
    return list.items.find((item) => item.responsibilityId === responsibilityId);
  };
  return { ...base, erik, johan, maria, slot, update, part };
}

export const asUser = ({ context, userId }: { context: ExecuteContext; userId: string }) =>
  testContext({ organizationId: context.organizationId, actor: { type: "user", userId } });
