import { ok, type Result } from "../../errors/result";
import type { Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import type { OrderCreateInput } from "./schema";
import { checkReadable } from "./order-rules";

type Db = { context: Pick<OperationContext, "db"> };

type AccessInput = { context: Pick<OperationContext, "permissions">; input: OrderCreateInput };

const READY = ok({ value: true as const });

/**
 * The permissions of the parts `order.create` was given, beyond `order:write` (ADR 0081
 * decision 9): `template:read` for a template, `inbox:read` for the message it is made from (ADR
 * 0085), `program:write` for lines and their needs, and `item:read` for a line's item, options or add-on items.
 * Checked before any lookup, so ids cannot be probed.
 */
export function checkIntakeAccess({ context, input }: AccessInput): Result<true> {
  const need = ({ permission, path }: { permission: Permission; path: string }) =>
    checkReadable({ context, permission, path });
  const lines = input.lines ?? [];
  const checks = [
    input.templateId ? need({ permission: "template:read", path: "templateId" }) : READY,
    input.inboundMessageId ? need({ permission: "inbox:read", path: "inboundMessageId" }) : READY,
    lines.length > 0 ? need({ permission: "program:write", path: "lines" }) : READY,
    ...lines.flatMap((line, index) => [
      line.itemId ? need({ permission: "item:read", path: `lines.${index}.itemId` }) : READY,
      line.options?.length
        ? need({ permission: "item:read", path: `lines.${index}.options` })
        : READY,
      line.requirements?.length
        ? need({ permission: "program:write", path: `lines.${index}.requirements` })
        : READY,
      line.addOns?.some((addOn) => addOn.itemId)
        ? need({ permission: "item:read", path: `lines.${index}.addOns` })
        : READY,
    ]),
  ];
  return checks.find((check) => !check.ok) ?? READY;
}

export type CheckTemplateInput = Db & { templateId: string | undefined };

/** The package the lines came from is an active template of the organization (provenance). */
export async function checkTemplate({ context, templateId }: CheckTemplateInput) {
  if (!templateId) return READY;
  const found = await context.db.orderTemplate.count({ where: { id: templateId } });
  if (found > 0) return READY;
  const message = "Unknown package";
  return invalid({ message, issues: [{ path: "templateId", message }] });
}

export type FindIntakeInput = Db & { customerId: string; intakeKey: string };

/**
 * The order an earlier create with the same `intakeKey` made (ADR 0081 decision 11), or null.
 * The customer row is locked first, so a concurrent create with the key for the same customer
 * waits here until the first commits and then finds its order instead of hitting the unique
 * index. A key used for an order that is now archived is `CONFLICT`.
 */
export async function findIntake({
  context,
  customerId,
  intakeKey,
}: FindIntakeInput): Promise<Result<string | null>> {
  await context.db.customer.updateMany({
    where: { id: customerId },
    data: { updatedAt: new Date() },
  });
  const found = await context.db.order.findFirst({
    where: { intakeKey, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { id: true, status: true },
  });
  if (!found) return ok({ value: null });
  if (found.status === "ACTIVE") return ok({ value: found.id });
  const message = "The intake key was used for an order that is archived";
  return conflict({ message, issues: [{ path: "intakeKey", message }] });
}
