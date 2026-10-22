"use client";

import type { SlugCheck } from "@bibi/auth";
import { useEffect, useState } from "react";
import { checkSlugAction } from "../../slug-actions";

const DEBOUNCE_MS = 300;

export type SlugCheckState = { status: "checking"; slug: string } | SlugCheck;

/** Checks `slug` 300 ms after it stops changing; the latest answer wins. */
export function useSlugCheck({ slug }: { slug: string }): SlugCheckState {
  const [state, setState] = useState<SlugCheckState>({ status: "checking", slug });
  useEffect(() => {
    let live = true;
    setState({ status: "checking", slug });
    const timer = setTimeout(() => {
      checkSlugAction({ slug }).then((check) => {
        if (live && check) setState(check);
      });
    }, DEBOUNCE_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [slug]);
  return state;
}
