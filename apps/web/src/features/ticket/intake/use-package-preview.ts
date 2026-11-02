import type { TicketPreviewLines } from "@bibi/core";
import { useEffect, useState } from "react";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { previewTicketLinesAction } from "../actions";
import type { IntakePeriod } from "./intake-period";

export type PackagePreview =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; errorKey: ErrorKey }
  | { status: "ready"; preview: TicketPreviewLines };

export type UsePackagePreviewInput = {
  customerId: string;
  period: IntakePeriod | null;
  headcount: number;
  packageIds: string[];
};

/**
 * One `ticket.previewLines` call with every active package (ADR 0081), again whenever the
 * customer, period, headcount or packages change. Nothing is written.
 */
export function usePackagePreview({
  customerId,
  period,
  headcount,
  packageIds,
}: UsePackagePreviewInput): PackagePreview {
  const [state, setState] = useState<PackagePreview>({ status: "idle" });
  const startsAt = period?.startsAt.toISOString() ?? "";
  const endsAt = period?.endsAt.toISOString() ?? "";
  const ids = packageIds.join(",");
  useEffect(() => {
    if (!startsAt || !ids) {
      setState({ status: "idle" });
      return;
    }
    let current = true;
    setState({ status: "loading" });
    const query = { customerId, startsAt: new Date(startsAt), endsAt: new Date(endsAt), headcount };
    previewTicketLinesAction({ input: { ...query, templateIds: ids.split(",") } })
      .then((result) => {
        if (!current) return;
        if (result.ok) setState({ status: "ready", preview: result.value });
        else setState({ status: "error", errorKey: errorKeyForCode(result.error) });
      })
      .catch(() => current && setState({ status: "error", errorKey: "network" }));
    return () => {
      current = false;
    };
  }, [customerId, startsAt, endsAt, headcount, ids]);
  return state;
}
