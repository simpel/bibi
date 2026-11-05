import { Loading } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

/** What every `loading.tsx` shows while its route loads: the breathing wordmark, centred (ADR 0097). */
export async function RouteLoading() {
  const t = await getTranslations("common");
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <Loading label={t("loading")} />
    </div>
  );
}
