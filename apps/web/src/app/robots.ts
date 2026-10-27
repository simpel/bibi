import { getEnv } from "@bibi/config";
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPublicHost } from "@/server/host-routing";

export const dynamic = "force-dynamic";

/** The public site may be indexed (ADR 0073); the app and every other host may not. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { PUBLIC_URL } = getEnv();
  const host = (await headers()).get("host") ?? "";
  if (!PUBLIC_URL || !isPublicHost({ host, publicUrl: PUBLIC_URL })) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${PUBLIC_URL}/sitemap.xml` };
}
