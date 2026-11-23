import { useTranslations } from "next-intl";

/** The guest range as "8–20 guests", "From 8 guests", "Up to 20 guests" or "Any number". */
export function useGuestRange() {
  const t = useTranslations("orderIntake.package");
  return ({ min, max }: { min: number | null; max: number | null }) => {
    if (min !== null && max !== null) return t("range.both", { min, max });
    if (min !== null) return t("range.min", { min });
    if (max !== null) return t("range.max", { max });
    return t("range.any");
  };
}
