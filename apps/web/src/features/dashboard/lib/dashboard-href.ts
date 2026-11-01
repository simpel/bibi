import { periodHref } from "@/features/finance/lib/finance-href";
import type { Period } from "@/features/finance/lib/finance-period";
import { ROUTES } from "@/lib/routes";

/** `/dashboard/{from}/{to}`: inclusive plain days (ADR 0064). */
export const dashboardHref = ({ from, to }: Period) =>
  periodHref({ base: ROUTES.dashboard, from, to });
