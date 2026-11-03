import { ok } from "../../errors/result";
import { deriveAccess } from "../../features/billing/access";
import { effectiveTrialEnd } from "../../features/billing/plan";
import { notFound } from "../../shared/errors";
import { definePlatformOperation } from "../define-platform-operation";
import type { PlatformDb } from "../types";
import { loadConfigRow, toBillingConfigDto } from "./config-store";
import {
  type BillingOrganizationDto,
  BillingOrganizationListInputSchema,
  BillingOrganizationListOutputSchema,
  BillingOrganizationSchema,
  BillingOrganizationUpdateInputSchema,
} from "./schema";

type Org = { id: string; name: string; slug: string; createdAt: Date };
type Account = Awaited<ReturnType<PlatformDb["billingAccount"]["findFirst"]>>;

type ToDtoInput = { organization: Org; account: Account; configured: boolean; now: Date };

function toDto({ organization, account, configured, now }: ToDtoInput): BillingOrganizationDto {
  const trialEndsAt = effectiveTrialEnd({
    organizationCreatedAt: organization.createdAt,
    trialEndsAt: account?.trialEndsAt ?? null,
  });
  const exempt = account?.exempt ?? false;
  const subscriptionStatus = account?.subscriptionStatus ?? null;
  return {
    ...{ organizationId: organization.id, name: organization.name, slug: organization.slug },
    createdAt: organization.createdAt,
    state: deriveAccess({ exempt, subscriptionStatus, trialEndsAt, configured, now }),
    ...{ trialEndsAt, exempt, subscriptionStatus, interval: account?.interval ?? null },
    extraSeats: account?.extraSeats ?? 0,
    stripeCustomerId: account?.stripeCustomerId ?? null,
  };
}

const ORG_SELECT = { id: true, name: true, slug: true, createdAt: true } as const;

export const listBillingOrganizations = definePlatformOperation({
  name: "billingOrganization.list",
  kind: "query",
  description: "Every organization with its trial, subscription and exemption, newest first.",
  input: BillingOrganizationListInputSchema,
  output: BillingOrganizationListOutputSchema,
  handler: async ({ input, context }) => {
    const { db } = context;
    const where = input.query
      ? {
          OR: [
            { name: { contains: input.query, mode: "insensitive" as const } },
            { slug: { contains: input.query } },
          ],
        }
      : {};
    const organizations = await db.organization.findMany({
      where,
      select: ORG_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    const page = organizations.slice(0, input.limit);
    const accounts = await db.billingAccount.findMany({
      where: { organizationId: { in: page.map((org) => org.id) } },
    });
    const configured = toBillingConfigDto({ row: await loadConfigRow(context) }).configured;
    const now = new Date();
    const items = page.map((organization) => {
      const account = accounts.find((row) => row.organizationId === organization.id) ?? null;
      return toDto({ organization, account, configured, now });
    });
    const nextCursor = organizations.length > input.limit ? (page.at(-1)?.id ?? null) : null;
    return ok({ value: { items, nextCursor } });
  },
});

export const updateBillingOrganization = definePlatformOperation({
  name: "billingOrganization.update",
  kind: "command",
  description: "Exempt an organization from paying, or move its trial end.",
  input: BillingOrganizationUpdateInputSchema,
  output: BillingOrganizationSchema,
  entityType: "billingAccount",
  handler: async ({ input: { organizationId, ...data }, context }) => {
    const { db } = context;
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: ORG_SELECT,
    });
    if (!organization) return notFound({ entity: "Organization" });
    const before = await db.billingAccount.findUnique({ where: { organizationId } });
    const account = await db.billingAccount.upsert({
      where: { organizationId },
      create: { organizationId, ...data, createdBy: context.actor.userId },
      update: data,
    });
    context.recordChange({ entityId: account.id, before, after: account });
    const configured = toBillingConfigDto({ row: await loadConfigRow(context) }).configured;
    return ok({ value: toDto({ organization, account, configured, now: new Date() }) });
  },
});
