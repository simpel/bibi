import "server-only";
import type { Locale } from "@bibi/i18n";
import { handleLoadError } from "@/server/load-error";
import { loadWelcomeState, type WelcomeState } from "./load-welcome-state";

/** `loadWelcomeState` for a step page: a load error redirects or 404s like any page. */
export async function loadStepState({ locale }: { locale: Locale }): Promise<WelcomeState> {
  const state = await loadWelcomeState();
  if (!state.ok) {
    handleLoadError({ error: state.error, locale });
    throw state.error;
  }
  return state.value;
}
