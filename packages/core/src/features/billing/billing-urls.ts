import { getEnv } from "@bibi/config";
import { getDb } from "@bibi/db";

type OrgInput = { organizationId: string };

/** The organization's base URL in the web app (`WEB_ORIGIN/<slug>`). */
async function orgBase({ organizationId }: OrgInput) {
  const organization = await getDb().organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });
  return `${getEnv().WEB_ORIGIN}/${encodeURIComponent(organization?.slug ?? "")}`;
}

export type CheckoutUrlsInput = OrgInput & { returnTo: string };

/** Where Checkout sends the payer: the done page (which syncs, then opens `returnTo`) or back. */
export async function checkoutUrls({ organizationId, returnTo }: CheckoutUrlsInput) {
  const base = await orgBase({ organizationId });
  const query = `returnTo=${encodeURIComponent(returnTo)}`;
  return {
    successUrl: `${base}/billing/pay/done?${query}`,
    cancelUrl: `${base}/billing/pay?${query}`,
  };
}

/** The page the Customer Portal returns to. */
export async function portalReturnUrl({ organizationId, returnTo }: CheckoutUrlsInput) {
  return `${await orgBase({ organizationId })}${returnTo}`;
}
