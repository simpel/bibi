import { resolveLocale } from "@bibi/i18n";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export type PageTitleInput = {
  locale?: string;
  namespace?: string;
  key: string;
  values?: Record<string, string | number>;
};

/** Resolves an i18n key into a page metadata title formatted by the root layout template. */
export async function pageTitle({
  locale,
  namespace = "nav",
  key,
  values,
}: PageTitleInput): Promise<Metadata> {
  const t = (await getTranslations({
    locale: resolveLocale({ value: locale }),
    namespace: namespace as never,
  })) as unknown as (k: string, v?: Record<string, string | number>) => string;
  return {
    title: t(key, values),
  };
}

export type EntityTitleInput = {
  name?: string | null;
  fallback?: string;
  prefix?: string;
};

/** Formats an entity title (e.g. record name or reference) for page metadata. */
export function entityTitle({ name, fallback = "Details", prefix }: EntityTitleInput): Metadata {
  const base = name?.trim() || fallback;
  return {
    title: prefix ? `${prefix} · ${base}` : base,
  };
}
