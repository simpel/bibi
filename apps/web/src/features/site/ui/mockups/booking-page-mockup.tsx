import { Button, cn } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { MockupField as Field } from "./mockup-field";
import { MockupFrame } from "./mockup-frame";

const PARTY = [1, 2, 3, 4, 5, 6] as const;
const SLOTS = [
  { key: "slot1", state: "open" },
  { key: "slot2", state: "selected" },
  { key: "slot3", state: "open" },
  { key: "slot4", state: "full" },
] as const;

/** The guest's side: the venue's own booking page with its logo and accent colour (ADR 0119). */
export async function BookingPageMockup() {
  const t = await getTranslations("site.mockup.bookingPage");
  return (
    <MockupFrame title={t("address")}>
      <div className="flex items-center gap-3 rounded-lg bg-chart-1 px-4 py-5 text-background">
        <span className="grid size-10 place-items-center rounded-full bg-background font-serif text-lg text-chart-1">
          {t("logo")}
        </span>
        <div className="grid">
          <span className="font-serif text-xl">{t("venue")}</span>
          <span className="text-xs opacity-80">{t("heading")}</span>
        </div>
      </div>
      <Field label={t("party")}>
        <div className="flex flex-wrap gap-1.5">
          {PARTY.map((size) => (
            <span
              key={size}
              className={cn(
                "grid size-8 place-items-center rounded-md border tabular-nums",
                size === 2 && "border-chart-1 bg-chart-1 text-background",
              )}
            >
              {size}
            </span>
          ))}
        </div>
      </Field>
      <Field label={t("date")}>
        <span className="rounded-md border px-3 py-1.5">{t("dateValue")}</span>
      </Field>
      <Field label={t("time")}>
        <div className="grid grid-cols-4 gap-1.5">
          {SLOTS.map(({ key, state }) => (
            <span
              key={key}
              className={cn(
                "rounded-md border py-1.5 text-center tabular-nums",
                state === "selected" && "border-chart-1 bg-chart-1 text-background",
                state === "full" && "text-muted-foreground line-through",
              )}
            >
              {t(key)}
            </span>
          ))}
        </div>
      </Field>
      <Field label={t("needs")}>
        <div className="flex items-center justify-between rounded-md border px-3 py-1.5">
          <span>{t("need")}</span>
          <span className="tabular-nums">{t("needCount")}</span>
        </div>
      </Field>
      <Button tabIndex={-1} className="bg-chart-1 text-background hover:bg-chart-1">
        {t("submit")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("powered")}</p>
    </MockupFrame>
  );
}
