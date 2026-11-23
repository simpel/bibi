import { deriveRunSheetStatus, type RunSheetDto } from "@bibi/core/schemas";

type RunSheetSendState = Pick<
  RunSheetDto,
  "blocked" | "publishedAt" | "baseVersion" | "fulfilledAt"
>;

/**
 * Whether one of an order's run sheets still needs a look before it goes out: never sent (draft),
 * changed since it was sent (revision pending) or blocked. Sent and done ones need nothing.
 */
export function runSheetsNeedSending({ runSheets }: { runSheets: readonly RunSheetSendState[] }) {
  return runSheets.some((runSheet) => {
    const status = deriveRunSheetStatus(runSheet);
    return status === "DRAFT" || status === "REVISION_PENDING" || status === "BLOCKED";
  });
}
