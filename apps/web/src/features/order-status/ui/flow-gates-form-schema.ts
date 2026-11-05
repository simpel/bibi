import {
  type OrderStatusDto,
  OrderStatusSetGatesInputSchema,
  type StatusGates,
  TRANSITION_GATES,
  type TransitionGate,
} from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** One requirement on moves into a status: whether it applies, and from which sources. */
export type GateChoice = {
  on: boolean;
  /** ANY: from any status. SPECIFIC: only from the statuses in `fromStatusIds`. */
  scope: "ANY" | "SPECIFIC";
  fromStatusIds: string[];
};

export type FlowGatesValues = { gates: Record<TransitionGate, GateChoice> };
export type FlowGatesOutput = z.infer<typeof OrderStatusSetGatesInputSchema>;
export type FlowGatesSchemaInput = { orderStatus: OrderStatusDto };

const OFF: GateChoice = { on: false, scope: "ANY", fromStatusIds: [] };

type ChoiceInput = { gatesInto: readonly StatusGates[]; gate: TransitionGate };

/** The choice for one gate from the raw gates on moves into the status (any-source wins). */
export function gateChoice({ gatesInto, gate }: ChoiceInput): GateChoice {
  const entries = gatesInto.filter((entry) => entry.gates.includes(gate));
  if (entries.some((entry) => entry.fromStatusId === null)) return { ...OFF, on: true };
  const ids = entries.flatMap((entry) => (entry.fromStatusId ? [entry.fromStatusId] : []));
  return ids.length > 0 ? { on: true, scope: "SPECIFIC", fromStatusIds: ids } : OFF;
}

export function flowGatesDefaults({ orderStatus }: FlowGatesSchemaInput): FlowGatesValues {
  const gates = Object.fromEntries(
    TRANSITION_GATES.map((gate) => [gate, gateChoice({ gatesInto: orderStatus.gatesInto, gate })]),
  ) as Record<TransitionGate, GateChoice>;
  return { gates };
}

/** The form's choices as core's per-source gate list (null source = any status). */
export function toGateList({ values }: { values: FlowGatesValues }): StatusGates[] {
  const active = TRANSITION_GATES.filter((gate) => values.gates[gate].on);
  const any = active.filter((gate) => values.gates[gate].scope === "ANY");
  const sources = new Set(
    active.flatMap((gate) =>
      values.gates[gate].scope === "SPECIFIC" ? values.gates[gate].fromStatusIds : [],
    ),
  );
  const specific = [...sources].map((fromStatusId) => ({
    fromStatusId,
    gates: active.filter(
      (gate) =>
        values.gates[gate].scope === "SPECIFIC" &&
        values.gates[gate].fromStatusIds.includes(fromStatusId),
    ),
  }));
  return [...(any.length > 0 ? [{ fromStatusId: null, gates: any }] : []), ...specific];
}

/** Core's `orderStatus.setGates` schema: every requirement into this status, replaced as a set. */
export function flowGatesSchema({ orderStatus }: FlowGatesSchemaInput) {
  return formSchema({
    schema: OrderStatusSetGatesInputSchema,
    toInput: ({ values }: { values: FlowGatesValues }) => ({
      id: orderStatus.id,
      gates: toGateList({ values }),
    }),
  });
}
