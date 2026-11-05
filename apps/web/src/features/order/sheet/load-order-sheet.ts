import "server-only";
import {
  getOrder,
  type LineAmounts,
  type LineDto,
  lineAmounts,
  listLines,
  ok,
  type Result,
} from "@bibi/core";
import { loadProgramData } from "@/features/line/load-program-data";
import { nestedLines } from "@/features/line/nested-lines";
import { loadOrderDays, type OrderDays } from "@/features/line/order-days";
import type { ProgramFormData } from "@/features/line/ui/program-form-data";
import { runOperation } from "@/server/run-operation";
import { loadSheetFacts, type OrderSheetFacts } from "./load-sheet-facts";

/** The program part of the sheet; null when the caller may not read the program. */
export type SheetProgram = {
  lines: LineDto[];
  data: ProgramFormData;
  amounts: LineAmounts | null;
  days: OrderDays;
};

/** Everything the order sheet shows, read once when it opens. */
export type OrderSheetData = OrderSheetFacts & {
  id: string;
  title: string | null;
  reference: number;
  program: SheetProgram | null;
};

/** The order's lines with their amounts and its days in the calendar. */
async function loadProgram({ orderId }: { orderId: string }): Promise<SheetProgram | null> {
  const [lines, data, amounts] = await Promise.all([
    runOperation({ operation: listLines, input: { orderId, limit: 100 } }),
    loadProgramData(),
    runOperation({ operation: lineAmounts, input: { orderId } }),
  ]);
  if (!lines.ok || !data.ok) return null;
  const items = nestedLines({ lines: lines.value.items });
  const days = await loadOrderDays({ orderId, lines: items, data: data.value });
  return { lines: items, data: data.value, amounts: amounts.ok ? amounts.value : null, days };
}

/**
 * The order sheet (pipeline and calendar): the order, its people, its days in the calendar
 * and its lines, read through the operations the order page uses (ADR 0050 composition).
 */
export async function loadOrderSheet({ id }: { id: string }): Promise<Result<OrderSheetData>> {
  const order = await runOperation({ operation: getOrder, input: { id } });
  if (!order.ok) return order;
  const [facts, program] = await Promise.all([
    loadSheetFacts({ order: order.value }),
    loadProgram({ orderId: id }),
  ]);
  const { title, reference } = order.value;
  return ok({ value: { id, title, reference, ...facts, program } });
}
