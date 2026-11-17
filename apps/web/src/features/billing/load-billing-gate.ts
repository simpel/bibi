import "server-only";
import { BILLING_PLAN, getBillingAccess } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { runOperation } from "@/server/run-operation";
import { CURRENT_PATH_HEADER, payPath, safeReturnTo } from "./lib/return-to";
import { type TrialCountdown, trialCountdown } from "./lib/trial-countdown";

/**
 * What the app layout needs from billing in one read: `payHref`, where to send the member
 * instead once the trial is over and nothing pays (ADR 0095 §5), and `trial`, the sidebar's
 * countdown while the free trial runs.
 */
export type BillingGate = { payHref: string | null; trial: TrialCountdown | null };

const OPEN: BillingGate = { payHref: null, trial: null };

/** The billing gate for the app layout. On any error the app opens, so a broken read never locks members out. */
export async function loadBillingGate(): Promise<BillingGate> {
  try {
    const access = await runOperation({ operation: getBillingAccess, input: {} });
    if (!access.ok) return OPEN;
    const { state, open, trialEndsAt, canPay } = access.value;
    if (open) {
      const trial =
        state === "TRIAL"
          ? trialCountdown({ trialEndsAt, trialDays: BILLING_PLAN.trialDays, canPay })
          : null;
      return { payHref: null, trial };
    }
    const current = (await headers()).get(CURRENT_PATH_HEADER);
    return { payHref: payPath({ returnTo: safeReturnTo({ value: current }) }), trial: null };
  } catch (error) {
    unstable_rethrow(error);
    getLogger().warn({ event: "billing.gateFailed", err: error });
    return OPEN;
  }
}
