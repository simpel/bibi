import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { welcomePath } from "@/features/welcome/lib/welcome-step";
import { loadWelcomeState } from "@/features/welcome/load-welcome-state";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";

type WelcomeRouterProps = { params: Promise<{ locale: string; org: string }> };

/** Renders nothing: sends the member to their next welcome step, or into the app (ADR 0061). */
export default async function WelcomeRouter({ params }: WelcomeRouterProps) {
  const { locale: raw, org } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  const state = await loadWelcomeState();
  if (!state.ok) handleLoadError({ error: state.error, locale });
  const next = state.ok ? state.value.next : null;
  redirect({ href: next ? welcomePath({ step: next }) : ROUTES.pipeline, locale, org });
}
