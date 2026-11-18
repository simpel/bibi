import { getTranslations } from "next-intl/server";
import type { TourLabels } from "./tour-card";
import { TOURS, type TourId } from "./tour-defs";
import { TourRunner } from "./tour-runner";

export type PageTourProps = { tour: TourId };

/** The tour of a page type (spec: page tours): its steps are `tour.<tour>.<step>` in the messages. */
export async function PageTour({ tour }: PageTourProps) {
  const t = await getTranslations("tour");
  const steps = TOURS[tour].steps.map((step) => ({
    step,
    title: t(`${tour}.${step}.title` as Parameters<typeof t>[0]),
    body: t(`${tour}.${step}.body` as Parameters<typeof t>[0]),
  }));
  const labels = {
    skip: t("skip"),
    back: t("back"),
    next: t("next"),
    done: t("done"),
    progress: t.raw("progress") as string,
  } satisfies TourLabels;
  return <TourRunner tour={tour} steps={steps} labels={labels} />;
}
