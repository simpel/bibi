import { getBookingPage } from "@bibi/core";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { runOperation } from "@/server/run-operation";
import { tableBookingRoomRoute } from "../lib/routes";
import { slugOf } from "../lib/slug";
import { loadDiningRoom, loadSittings } from "../load-room-settings";
import { EnableTableBookingButton } from "./enable-table-booking-button";

export type ItemTableBookingSectionProps = {
  itemId: string;
  name: string;
  timeZone: string;
};

/**
 * A room's table booking on its own page: where an admin switches it on, and, once on, the
 * address, how far ahead guests can book and the way to its settings and reservations.
 */
export async function ItemTableBookingSection({
  itemId,
  name,
  timeZone,
}: ItemTableBookingSectionProps) {
  const [t, abilities, room, format] = await Promise.all([
    getTranslations("tableBooking.itemSection"),
    getCallerAbilities(),
    loadDiningRoom({ itemId }),
    getDateTimeFormat(),
  ]);
  if (!can({ abilities, permission: "diningSetup:read" })) return null;
  const canWrite = can({ abilities, permission: "diningSetup:write" });
  if (!room.ok) {
    if (room.error.code !== "NOT_FOUND") return null;
    return (
      <section className="grid gap-3">
        <h2 className="text-xl">{t("title")}</h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t("explanation")}</p>
        {canWrite ? (
          <div>
            <EnableTableBookingButton itemId={itemId} suggestedSlug={slugOf({ name })} />
          </div>
        ) : null}
      </section>
    );
  }
  const [page, sittings] = await Promise.all([
    runOperation({ operation: getBookingPage, input: {} }),
    loadSittings({ roomItemId: itemId }),
  ]);
  const pageSlug = page.ok ? page.value.slug : null;
  const address = pageSlug ? `/book/${pageSlug}/${room.value.slug}` : `/${room.value.slug}`;
  const openUntil = room.value.openUntil
    ? format.date({ instant: room.value.openUntil, timeZone, year: true })
    : t("noLimit");
  const facts = [
    { label: t("address"), value: address },
    { label: t("openUntil"), value: openUntil },
    { label: t("sittings"), value: sittings.ok ? String(sittings.value.length) : "–" },
  ];
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{t("title")}</h2>
        <div className="flex gap-2">
          {can({ abilities, permission: "reservation:read" }) ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${ROUTES.reservations}?room=${encodeURIComponent(itemId)}`}>
                {t("reservations")}
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href={tableBookingRoomRoute({ itemId })}>{t("settings")}</Link>
          </Button>
        </div>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        {facts.map(({ label, value }) => (
          <div key={label} className="grid gap-0.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
