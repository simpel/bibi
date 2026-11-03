import "server-only";
import { getBillingAccess } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { runOperation } from "@/server/run-operation";
import { CURRENT_PATH_HEADER, payPath, safeReturnTo } from "./lib/return-to";

/**
 * Where the app layout must send the member instead (ADR 0095 §5): the payment page with the
 * current path as `returnTo` once the trial is over and nothing pays, else null. On any error
 * the app opens, so a broken read never locks members out.
 */
export async function billingGateRedirect(): Promise<string | null> {
  try {
    const access = await runOperation({ operation: getBillingAccess, input: {} });
    if (!access.ok || access.value.open) return null;
    const current = (await headers()).get(CURRENT_PATH_HEADER);
    return payPath({ returnTo: safeReturnTo({ value: current }) });
  } catch (error) {
    unstable_rethrow(error);
    getLogger().warn({ event: "billing.gateFailed", err: error });
    return null;
  }
}
