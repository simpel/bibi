import type { OrderPreviewLines } from "@bibi/core";
import type { ErrorKey } from "@/lib/error-key";
import { useLiveQuery } from "@/lib/use-live-query";
import { previewOrderLinesAction } from "../actions";
import type { IntakePeriod } from "./intake-period";

export type PackagePreview =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; errorKey: ErrorKey }
  | { status: "ready"; preview: OrderPreviewLines };

export type UsePackagePreviewInput = {
  customerId: string;
  period: IntakePeriod | null;
  headcount: number;
  packageIds: string[];
};

/**
 * One `order.previewLines` call with every active package (ADR 0081), again whenever the
 * customer, period, headcount or packages change. Nothing is written.
 */
export function usePackagePreview({
  customerId,
  period,
  headcount,
  packageIds,
}: UsePackagePreviewInput): PackagePreview {
  const { startsAt, endsAt } = period ?? {};
  const asking = startsAt && endsAt && packageIds.length > 0;
  const state = useLiveQuery({
    input: asking
      ? { input: { customerId, startsAt, endsAt, headcount, templateIds: packageIds } }
      : null,
    load: previewOrderLinesAction,
  });
  if (state.status === "ready") return { status: "ready", preview: state.value };
  if (state.status === "loading") return { status: "loading" };
  return state;
}
