"use client";

import type { SlugCheck } from "@bibi/auth";
import { useLiveQuery } from "@/lib/use-live-query";
import { checkSlugAction } from "../../slug-actions";

const DEBOUNCE_MS = 300;

export type SlugCheckState = { status: "checking"; slug: string } | SlugCheck;

/** A missing answer (bad input, no session) stays "checking", as the form cannot go on. */
async function checkSlug({ slug }: { slug: string }) {
  const check = await checkSlugAction({ slug });
  if (check) return { ok: true as const, value: check };
  return {
    ok: false as const,
    error: { code: "VALIDATION" as const, message: "No slug check", issues: [] },
  };
}

/** Checks `slug` 300 ms after it stops changing; the latest answer wins. */
export function useSlugCheck({ slug }: { slug: string }): SlugCheckState {
  const state = useLiveQuery({ input: { slug }, load: checkSlug, waitMs: DEBOUNCE_MS });
  return state.status === "ready" ? state.value : { status: "checking", slug };
}
