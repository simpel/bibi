import "server-only";
import { type JsonValue, listUserPreferences } from "@okazi/core";
import { getLogger } from "@okazi/logger";
import { unstable_rethrow } from "next/navigation";
import { runOperation } from "@/server/run-operation";

export type LoadUserPreferencesInput = { prefix?: string };

/**
 * The signed-in user's own preferences (ADR 0039) as key → value, optionally only keys starting
 * with `prefix`. Preferences are a convenience: signed out or on any error the page renders
 * with defaults, so this returns `{}` and never throws (Next's own control-flow errors, e.g.
 * dynamic rendering, are rethrown).
 */
export async function loadUserPreferences({
  prefix,
}: LoadUserPreferencesInput = {}): Promise<Record<string, JsonValue>> {
  try {
    const input = prefix === undefined ? {} : { prefix };
    const result = await runOperation({ operation: listUserPreferences, input });
    if (!result.ok) return {};
    return Object.fromEntries(result.value.items.map(({ key, value }) => [key, value ?? null]));
  } catch (error) {
    unstable_rethrow(error);
    getLogger().warn({ event: "userPreference.loadFailed", err: error });
    return {};
  }
}
