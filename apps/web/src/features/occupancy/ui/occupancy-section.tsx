import { listOccupancies } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateOccupancyButton } from "./create-occupancy-button";
import { OccupancyTable } from "./occupancy-table";

export type OccupancySectionProps = { locale: Locale; itemId: string };

/** A bookable item's current and upcoming occupancy, with blocks staff add by hand. */
export async function OccupancySection({ locale, itemId }: OccupancySectionProps) {
  const t = await getTranslations("occupancy");
  const abilities = await getCallerAbilities();
  const access = {
    canEdit: can({ abilities, permission: "ticket:write" }),
    canRemove: can({ abilities, permission: "ticket:delete" }),
  };
  const occupancies = await runOperation({
    operation: listOccupancies,
    input: { itemId, from: new Date(), limit: 100 },
  });
  if (!occupancies.ok && occupancies.error.code === "FORBIDDEN") return null;
  if (!occupancies.ok) {
    return <ErrorState errorKey={handleLoadError({ error: occupancies.error, locale })} />;
  }
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("plural")}</h2>
        {can({ abilities, permission: "ticket:write" }) ? (
          <CreateOccupancyButton itemId={itemId} />
        ) : null}
      </div>
      {occupancies.value.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <OccupancyTable occupancies={occupancies.value.items} access={access} />
      )}
    </section>
  );
}
