import { Loading } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ViewportCenter } from "./viewport-center";

/** What every `loading.tsx` shows while its route loads: the breathing wordmark, centred on the viewport (ADR 0097). */
export async function RouteLoading() {
  const t = await getTranslations("common");
  return (
    <ViewportCenter>
      <Loading label={t("loading")} />
    </ViewportCenter>
  );
}
