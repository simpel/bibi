import type { ExecuteContext } from "../src/index";
import { createUnits } from "./allocation-helpers";
import { addTestMember, testOrg } from "./org-helpers";

/** An organization with two members and staff items: two Technicians, one Waiter, one AV unit. */
export async function memberProfileSetup(): Promise<{
  context: ExecuteContext;
  anna: string;
  bo: string;
  tech: { typeId: string; ids: string[] };
  waiter: { typeId: string; id: string };
  equipmentId: string;
}> {
  const context = await testOrg();
  const anna = await addTestMember({ context, role: "member", name: "Anna" });
  const bo = await addTestMember({ context, role: "member", name: "Bo" });
  const technicians = await createUnits({
    context,
    name: "Technician",
    units: ["Technician 1", "Technician 2"],
    resourceKind: "PERSON",
  });
  const waiters = await createUnits({
    context,
    name: "Waiter",
    units: ["Waiter 1"],
    resourceKind: "PERSON",
  });
  const av = await createUnits({ context, name: "AV", units: ["AV 1"] });
  return {
    context,
    anna,
    bo,
    tech: { typeId: technicians.type.id, ids: technicians.ids },
    waiter: { typeId: waiters.type.id, id: waiters.ids[0] ?? "" },
    equipmentId: av.ids[0] ?? "",
  };
}
