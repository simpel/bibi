import { getEnv } from "@bibi/config";
import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { HostedOnboardingPort } from "../connect-types";
import { stripeBadResponse as badResponse } from "./stripe-bad-response";
import { type StripeRefusal, stripeRequest } from "./stripe-request";

const AccountSchema = z.object({
  id: z.string(),
  configuration: z
    .object({
      merchant: z
        .object({
          capabilities: z
            .object({ card_payments: z.object({ status: z.string() }).nullish() })
            .nullish(),
        })
        .nullish(),
    })
    .nullish(),
});

const AccountLinkSchema = z.object({ url: z.string(), expires_at: z.string() });

const ACCOUNT_GONE = /no such account|does not have access to account/i;

/**
 * A refusal because Stripe no longer knows the account, or the platform lost access to it (closed,
 * unlinked, or another platform's id), becomes NOT_FOUND so onboarding can start a fresh one.
 * Matched narrowly: a 403 for a key missing a permission must stay a plain refusal.
 */
function accountGone<T>({ result }: { result: Result<T> }): Result<T> {
  if (result.ok || result.error.code !== "CONFLICT") return result;
  const refusal = result.error.cause as StripeRefusal | undefined;
  const gone =
    refusal?.status === 404 ||
    refusal?.code === "account_invalid" ||
    ACCOUNT_GONE.test(result.error.message);
  if (!gone) return result;
  const { message, cause } = result.error;
  return err({ error: new AppError({ code: "NOT_FOUND", message, cause }) });
}

function capabilityToStatus({ status }: { status: string | undefined }) {
  if (status === "active") return "CONNECTED" as const;
  if (status === "restricted") return "RESTRICTED" as const;
  return "ONBOARDING" as const;
}

/**
 * Stripe Connect through Accounts v2 (ADR 0028): accounts with the full Stripe dashboard whose merchant
 * configuration requests card payments; Stripe collects fees and carries losses (direct charges).
 */
export const stripeConnect: HostedOnboardingPort = {
  kind: "HOSTED_ONBOARDING",
  async createAccount({ organizationId, displayName, country, contactEmail, replaces }) {
    const key = `bibi-connected-account-${organizationId}${replaces ? `-replaces-${replaces}` : ""}`;
    const result = await stripeRequest({
      method: "POST",
      path: "/core/accounts",
      idempotencyKey: key,
      body: {
        display_name: displayName,
        ...(contactEmail ? { contact_email: contactEmail } : {}),
        dashboard: "full",
        identity: { country },
        defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
        configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
        metadata: { organizationId, platformAccountId: getEnv().STRIPE_PLATFORM_ACCOUNT_ID },
      },
    });
    if (!result.ok) return result;
    const parsed = AccountSchema.safeParse(result.value);
    return parsed.success
      ? ok({ value: { externalAccountId: parsed.data.id } })
      : badResponse({ what: "account" });
  },

  async status({ externalAccountId: stripeAccountId }) {
    const result = await stripeRequest({
      method: "GET",
      path: `/core/accounts/${encodeURIComponent(stripeAccountId)}?include[0]=configuration.merchant`,
    });
    if (!result.ok) return result;
    const parsed = AccountSchema.safeParse(result.value);
    if (!parsed.success) return badResponse({ what: "account" });
    const status = parsed.data.configuration?.merchant?.capabilities?.card_payments?.status;
    return ok({ value: { status: capabilityToStatus({ status }) } });
  },

  async onboardingLink({ externalAccountId: stripeAccountId, returnUrl, refreshUrl }) {
    const result = await stripeRequest({
      method: "POST",
      path: "/core/account_links",
      body: {
        account: stripeAccountId,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            configurations: ["merchant"],
            return_url: returnUrl,
            refresh_url: refreshUrl,
          },
        },
      },
    });
    if (!result.ok) return accountGone({ result });
    const parsed = AccountLinkSchema.safeParse(result.value);
    if (!parsed.success) return badResponse({ what: "account link" });
    return ok({ value: { url: parsed.data.url, expiresAt: new Date(parsed.data.expires_at) } });
  },
};
