import { getEnv } from "@okazi/config";
import { z } from "zod";
import { ok } from "../../errors/result";
import { stripeBadResponse as badResponse } from "../payment/stripe-bad-response";
import type { StripeConnectGateway } from "./gateway";
import { stripeRequest } from "./stripe-request";

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

function capabilityToStatus({ status }: { status: string | undefined }) {
  if (status === "active") return "ACTIVE" as const;
  if (status === "restricted") return "RESTRICTED" as const;
  return "ONBOARDING" as const;
}

/**
 * Stripe Connect through Accounts v2 (ADR 0028): accounts with the full Stripe dashboard whose merchant
 * configuration requests card payments; Stripe collects fees and carries losses (direct charges).
 */
export const stripeConnectGateway: StripeConnectGateway = {
  async createAccount({ organizationId, displayName, country, contactEmail }) {
    const result = await stripeRequest({
      method: "POST",
      path: "/core/accounts",
      idempotencyKey: `okazi-connected-account-${organizationId}`,
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
      ? ok({ value: { stripeAccountId: parsed.data.id } })
      : badResponse({ what: "account" });
  },

  async getAccountStatus({ stripeAccountId }) {
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

  async createOnboardingLink({ stripeAccountId, returnUrl, refreshUrl }) {
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
    if (!result.ok) return result;
    const parsed = AccountLinkSchema.safeParse(result.value);
    if (!parsed.success) return badResponse({ what: "account link" });
    return ok({ value: { url: parsed.data.url, expiresAt: new Date(parsed.data.expires_at) } });
  },
};
