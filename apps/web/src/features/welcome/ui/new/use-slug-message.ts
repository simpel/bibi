"use client";

import { useTranslations } from "next-intl";
import type { SlugCheckState } from "./use-slug-check";

/** The sentence under the address field for the current check result. */
export function useSlugMessage({ check }: { check: SlugCheckState }): string {
  const t = useTranslations("welcome.new");
  const slug = check.slug;
  if (check.status === "checking") return t("slugChecking", { slug });
  if (check.status === "free") return t("slugFree", { slug });
  if (check.status === "invalid") return t("slugInvalid");
  return t(check.status === "taken" ? "slugTaken" : "slugReserved", {
    slug,
    suggestion: check.suggestion ?? "",
  });
}
