import { getEnv } from "@bibi/config";
import { routing } from "@bibi/i18n/routing";
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPublicHost } from "@/server/host-routing";

export const dynamic = "force-dynamic";

/** The public site's front page in every locale; the app host has nothing to list. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { PUBLIC_ORIGIN } = getEnv();
  const host = (await headers()).get("host") ?? "";
  if (!PUBLIC_ORIGIN || !isPublicHost({ host, publicUrl: PUBLIC_ORIGIN })) return [];
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${PUBLIC_ORIGIN}/${l}`]));
  return routing.locales.map((locale) => ({
    url: `${PUBLIC_ORIGIN}/${locale}`,
    alternates: { languages },
  }));
}
