import { z } from "zod";
import { openSecret } from "../../crypto/secret-box";
import { ok } from "../../errors/result";
import { BILLING_PLAN } from "../../features/billing/plan";
import { stripeFetch } from "../../providers/stripe/stripe-request";
import { definePlatformOperation } from "../define-platform-operation";
import { loadConfigRow } from "./config-store";
import {
  type BillingFinancialsDto,
  BillingFinancialsSchema,
  type StripeBalanceAmount,
  type StripeBalanceTransaction,
  type StripeInvoice,
} from "./schema";

const DEFAULT_PRODUCTS = {
  monthly: {
    key: "baseMonthly" as const,
    count: 0,
    unitPriceMinor: BILLING_PLAN.baseMonthlyMinor,
    currency: BILLING_PLAN.currency,
    interval: "MONTH" as const,
    monthlyRevenueMinor: 0,
  },
  yearly: {
    key: "baseYearly" as const,
    count: 0,
    unitPriceMinor: BILLING_PLAN.baseYearlyMinor,
    currency: BILLING_PLAN.currency,
    interval: "YEAR" as const,
    monthlyRevenueMinor: 0,
    annualRevenueMinor: 0,
  },
  extraSeats: {
    key: "seatMonthly" as const,
    count: 0,
    unitPriceMinor: BILLING_PLAN.seatMonthlyMinor,
    currency: BILLING_PLAN.currency,
    interval: "MONTH" as const,
    monthlyRevenueMinor: 0,
  },
};

const EMPTY_FINANCIALS: BillingFinancialsDto = {
  configured: false,
  livemode: false,
  available: [],
  pending: [],
  recentTransactions: [],
  recentInvoices: [],
  activeSubscriptions: 0,
  mrrMinor: null,
  products: DEFAULT_PRODUCTS,
  currency: "sek",
  error: null,
};

type RawBalanceItem = { amount?: unknown; currency?: unknown };
type RawBalanceTransaction = {
  id?: unknown;
  amount?: unknown;
  fee?: unknown;
  net?: unknown;
  currency?: unknown;
  type?: unknown;
  status?: unknown;
  created?: unknown;
  description?: unknown;
};
type RawInvoice = {
  id?: unknown;
  number?: unknown;
  customer_name?: unknown;
  customer_email?: unknown;
  amount_due?: unknown;
  amount_paid?: unknown;
  currency?: unknown;
  status?: unknown;
  created?: unknown;
  hosted_invoice_url?: unknown;
};

function parseBalanceAmounts({ items }: { items: unknown }): StripeBalanceAmount[] {
  if (!Array.isArray(items)) return [];
  return items.map((item: RawBalanceItem) => ({
    amount: typeof item.amount === "number" ? Math.round(item.amount) : 0,
    currency: typeof item.currency === "string" ? item.currency.toLowerCase() : "sek",
  }));
}

function parseTransactions({ items }: { items: unknown }): StripeBalanceTransaction[] {
  if (!Array.isArray(items)) return [];
  return items.map((item: RawBalanceTransaction) => ({
    id: typeof item.id === "string" ? item.id : "",
    amount: typeof item.amount === "number" ? Math.round(item.amount) : 0,
    fee: typeof item.fee === "number" ? Math.round(item.fee) : 0,
    net: typeof item.net === "number" ? Math.round(item.net) : 0,
    currency: typeof item.currency === "string" ? item.currency.toLowerCase() : "sek",
    type: typeof item.type === "string" ? item.type : "charge",
    status: typeof item.status === "string" ? item.status : "available",
    created: new Date(typeof item.created === "number" ? item.created * 1000 : Date.now()),
    description: typeof item.description === "string" ? item.description : null,
  }));
}

function parseInvoices({ items }: { items: unknown }): StripeInvoice[] {
  if (!Array.isArray(items)) return [];
  return items.map((item: RawInvoice) => ({
    id: typeof item.id === "string" ? item.id : "",
    number: typeof item.number === "string" ? item.number : null,
    customerName: typeof item.customer_name === "string" ? item.customer_name : null,
    customerEmail: typeof item.customer_email === "string" ? item.customer_email : null,
    amountDue: typeof item.amount_due === "number" ? Math.round(item.amount_due) : 0,
    amountPaid: typeof item.amount_paid === "number" ? Math.round(item.amount_paid) : 0,
    currency: typeof item.currency === "string" ? item.currency.toLowerCase() : "sek",
    status: typeof item.status === "string" ? item.status : null,
    created: new Date(typeof item.created === "number" ? item.created * 1000 : Date.now()),
    hostedInvoiceUrl: typeof item.hosted_invoice_url === "string" ? item.hosted_invoice_url : null,
  }));
}

export const getBillingFinancials = definePlatformOperation({
  name: "billingFinancials.get",
  kind: "query",
  description: "Live Stripe financial data: balances, transactions, invoices and MRR.",
  input: z.object({}),
  output: BillingFinancialsSchema,
  handler: async ({ context }) => {
    const row = await loadConfigRow(context);
    if (!row?.secretKeySealed) {
      return ok({ value: { ...EMPTY_FINANCIALS } });
    }

    const secretKey = openSecret({ sealed: row.secretKeySealed });
    if (!secretKey.ok) {
      return ok({
        value: {
          ...EMPTY_FINANCIALS,
          configured: true,
          livemode: row.livemode,
          error: secretKey.error.message,
        },
      });
    }

    // Active subscriptions & MRR per product from Bibi's database (ADR 0091, 0095)
    const accounts = await context.db.billingAccount.findMany({
      where: { subscriptionStatus: "active" },
    });
    const activeSubscriptions = accounts.length;

    const monthlyAccounts = accounts.filter((acc) => acc.interval === "MONTH");
    const yearlyAccounts = accounts.filter((acc) => acc.interval === "YEAR");
    const totalExtraSeats = accounts.reduce((sum, acc) => sum + (acc.extraSeats ?? 0), 0);

    const monthlyRev = monthlyAccounts.length * BILLING_PLAN.baseMonthlyMinor;
    const yearlyMonthlyRev = Math.round(
      yearlyAccounts.length * (BILLING_PLAN.baseYearlyMinor / 12),
    );
    const yearlyAnnualRev = yearlyAccounts.length * BILLING_PLAN.baseYearlyMinor;
    const extraSeatsRev = totalExtraSeats * BILLING_PLAN.seatMonthlyMinor;
    const mrrMinor = monthlyRev + yearlyMonthlyRev + extraSeatsRev;

    const products = {
      monthly: {
        key: "baseMonthly" as const,
        count: monthlyAccounts.length,
        unitPriceMinor: BILLING_PLAN.baseMonthlyMinor,
        currency: BILLING_PLAN.currency,
        interval: "MONTH" as const,
        monthlyRevenueMinor: monthlyRev,
      },
      yearly: {
        key: "baseYearly" as const,
        count: yearlyAccounts.length,
        unitPriceMinor: BILLING_PLAN.baseYearlyMinor,
        currency: BILLING_PLAN.currency,
        interval: "YEAR" as const,
        monthlyRevenueMinor: yearlyMonthlyRev,
        annualRevenueMinor: yearlyAnnualRev,
      },
      extraSeats: {
        key: "seatMonthly" as const,
        count: totalExtraSeats,
        unitPriceMinor: BILLING_PLAN.seatMonthlyMinor,
        currency: BILLING_PLAN.currency,
        interval: "MONTH" as const,
        monthlyRevenueMinor: extraSeatsRev,
      },
    };

    const key = secretKey.value;
    const [balanceRes, txnsRes, invoicesRes] = await Promise.all([
      stripeFetch({ method: "GET", path: "/v1/balance", secretKey: key }),
      stripeFetch({
        method: "GET",
        path: "/v1/balance_transactions?limit=10",
        secretKey: key,
      }),
      stripeFetch({
        method: "GET",
        path: "/v1/invoices?limit=10",
        secretKey: key,
      }),
    ]);

    const error = !balanceRes.ok
      ? balanceRes.error.message
      : !txnsRes.ok
        ? txnsRes.error.message
        : !invoicesRes.ok
          ? invoicesRes.error.message
          : null;

    const available = balanceRes.ok
      ? parseBalanceAmounts({ items: balanceRes.value.available })
      : [];
    const pending = balanceRes.ok ? parseBalanceAmounts({ items: balanceRes.value.pending }) : [];
    const recentTransactions = txnsRes.ok ? parseTransactions({ items: txnsRes.value.data }) : [];
    const recentInvoices = invoicesRes.ok ? parseInvoices({ items: invoicesRes.value.data }) : [];
    const livemode = balanceRes.ok
      ? Boolean(balanceRes.value.livemode ?? row.livemode)
      : row.livemode;
    const currency = available[0]?.currency ?? pending[0]?.currency ?? "sek";

    return ok({
      value: {
        configured: true,
        livemode,
        available,
        pending,
        recentTransactions,
        recentInvoices,
        activeSubscriptions,
        mrrMinor,
        products,
        currency,
        error,
      },
    });
  },
});
