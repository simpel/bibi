import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type OldSettingsPageProps = {
  params: Promise<{ locale: string; org: string; path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Pages that changed name when settings moved into the administration area. */
const RENAMED: Record<string, string> = { organization: "general" };

/** Old `/settings/*` links (bookmarks, mails) open the same page under `/admin/*` (ADR 0036). */
export default async function OldSettingsRedirect({ params, searchParams }: OldSettingsPageProps) {
  const [{ locale, org, path = [] }, query] = await Promise.all([params, searchParams]);
  const [first, ...rest] = path;
  const segments = first ? [RENAMED[first] ?? first, ...rest] : [];
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const one of [value ?? []].flat()) search.append(key, one);
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  const href = `${[ROUTES.admin, ...segments.map(encodeURIComponent)].join("/")}${suffix}`;
  redirect({ href, locale: resolveLocale({ value: locale }), org });
}
