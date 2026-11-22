import { loadOrderContent } from "../../features/order-version/content";
import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoVersionsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0116: every order's newest version holds the order as it is now (versions follow every
 * change), every sent quote points at a version of its own order, and an order changed after its
 * quote (`changeAfterQuote`) no longer equals that quote's version. Returns failure messages.
 */
export async function checkDemoVersions({ context, org }: CheckDemoVersionsInput) {
  const failures: string[] = [];
  const orders = await context.db.order.findMany({
    select: {
      id: true,
      reference: true,
      versions: { orderBy: { number: "desc" }, take: 1, select: { contentHash: true } },
      quotes: {
        where: { quoteStatus: { not: "DRAFT" } },
        select: { version: true, orderVersion: { select: { orderId: true, contentHash: true } } },
      },
    },
  });
  const changed = new Set(
    org.orders.filter((row) => row.changeAfterQuote).map((row) => row.title ?? ""),
  );
  for (const order of orders) {
    const now = await loadOrderContent({ context, orderId: order.id });
    const where = `${org.slug}: order #${order.reference}`;
    if (now && order.versions[0]?.contentHash !== now.hash) {
      failures.push(`${where}: its newest version is not the order now`);
    }
    for (const quote of order.quotes) {
      if (quote.orderVersion?.orderId !== order.id) {
        failures.push(`${where}: quote v${quote.version} has no version of the order`);
      }
    }
  }
  const titled = await context.db.order.findMany({
    where: { title: { in: [...changed] } },
    select: { id: true, reference: true, quotes: { select: { orderVersion: true } } },
  });
  for (const order of titled) {
    const now = await loadOrderContent({ context, orderId: order.id });
    const sent = order.quotes.find((quote) => quote.orderVersion)?.orderVersion;
    if (!sent || sent.contentHash === now?.hash) {
      failures.push(`${org.slug}: order #${order.reference} still equals its quote's version`);
    }
  }
  return failures;
}
