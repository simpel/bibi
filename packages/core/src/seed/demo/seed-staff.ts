import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import {
  setMemberProfileItems,
  updateMemberProfile,
} from "../../features/member-profile/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type SeedDemoStaffInput = {
  context: ExecuteContext;
  org: DemoOrg;
  /** Member name → member id. */
  members: ReadonlyMap<string, string>;
  /** Item name → item id. */
  items: ReadonlyMap<string, string>;
};

const unknown = ({ kind, name }: { kind: string; name: string }) =>
  err({ error: new AppError({ code: "INTERNAL", message: `Unknown ${kind} ${name}` }) });

/**
 * ADR 0068: links each listed member to their staff items and sets the schedule kind, via
 * `memberProfile.setItems` and `memberProfile.update` as SYSTEM, after the items.
 */
export async function seedDemoStaff({
  context,
  org,
  members,
  items,
}: SeedDemoStaffInput): Promise<Result<true>> {
  for (const { member, scheduleKind, items: names } of org.staff ?? []) {
    const memberId = members.get(member);
    if (!memberId) return unknown({ kind: "member", name: member });
    const itemIds: string[] = [];
    for (const name of names) {
      const itemId = items.get(name);
      if (!itemId) return unknown({ kind: "item", name });
      itemIds.push(itemId);
    }
    const linked = await execute({
      operation: setMemberProfileItems,
      input: { memberId, itemIds },
      context,
    });
    if (!linked.ok) return linked;
    if (!scheduleKind) continue;
    const input = { memberId, scheduleKind };
    const updated = await execute({ operation: updateMemberProfile, input, context });
    if (!updated.ok) return updated;
  }
  return ok({ value: true });
}
