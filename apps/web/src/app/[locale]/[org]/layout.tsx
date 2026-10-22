import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionState } from "@/server/session";

type OrgLayoutProps = { children: ReactNode; params: Promise<{ locale: string; org: string }> };

/**
 * Organization-scoped area `/:locale/:org/...` (ADR 0062). The proxy has already made the slug's
 * organization active when the user is a member, so a slug that is still not the active one
 * belongs to an organization the user cannot open: 404. Access itself comes from the session.
 */
export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { org } = await params;
  const state = await getSessionState();
  if (state.status === "ready" && state.organizationSlug !== org) notFound();
  return children;
}
