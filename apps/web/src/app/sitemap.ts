import { getEnv } from "@bibi/config";
import { routing } from "@bibi/i18n/routing";
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPublicHost } from "@/server/host-routing";

export const dynamic = "force-dynamic";

/** The public site's front page in every locale; the app host has nothing to list. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { PUBLIC_URL } = getEnv();
  const host = (await headers()).get("host") ?? "";
  if (!PUBLIC_URL || !isPublicHost({ host, publicUrl: PUBLIC_URL })) return [];
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${PUBLIC_URL}/${l}`]));
  return routing.locales.map((locale) => ({
    url: `${PUBLIC_URL}/${locale}`,
    alternates: { languages },
  }));
}
