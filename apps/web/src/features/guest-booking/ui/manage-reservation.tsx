import type { PublicBookingPageDto, PublicReservationDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { CircleCheckIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { getDateTimeFormat } from "@/server/date-time-format";
import { emailHint } from "../lib/guest-text";
import type { PreparedSlots } from "../server/prepare-slots";
import { BookingShell } from "./booking-shell";
import { ChangeTime } from "./change-time";
import { ManageActions } from "./manage-actions";

export type ManageReservationProps = {
  token: string;
  reservation: PublicReservationDto;
  page: PublicBookingPageDto | null;
  /** Just booked: thank the guest and say where the confirmation went. */
  booked: boolean;
  /** The change step's times, when the guest is picking a new one. */
  change: (PreparedSlots & { maxParty: number }) | null;
};

const TITLE = {
  BOOKED: "booked",
  PENDING_PAYMENT: "pending",
  CANCELLED: "cancelled",
  SEATED: "past",
  COMPLETED: "past",
  NO_SHOW: "past",
} as const satisfies Record<PublicReservationDto["state"], string>;

/** The guest's booking at `/book/manage/<token>` (ADR 0119): what, when, and what they may do. */
export async function ManageReservation({
  token,
  reservation,
  page,
  booked,
  change,
}: ManageReservationProps) {
  const [t, dates] = await Promise.all([getTranslations("guestBooking"), getDateTimeFormat()]);
  const { timeZone, startsAt } = reservation;
  const when = dates.dateTime({ instant: startsAt, timeZone, weekday: "long" });
  const party = t("party.option", { count: reservation.partySize });
  const state = TITLE[reservation.state];
  return (
    <BookingShell page={page} title={t(`manage.${state}`)}>
      <div className="flex flex-col gap-6">
        <Lead {...{ reservation, booked, state }} />
        {change ? (
          <ChangeTime
            {...change}
            token={token}
            calendar={
              reservation.pageSlug && reservation.roomSlug
                ? { slug: reservation.pageSlug, roomSlug: reservation.roomSlug, token }
                : undefined
            }
            contactPhone={page?.contactPhone ?? null}
            selected={startsAt.toISOString()}
          />
        ) : (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 rounded-xl border px-4 py-3.5 text-sm">
              <Fact term={t("manage.where")} value={reservation.roomName} />
              <Fact term={t("manage.when")} value={when} />
              <Fact term={t("manage.party")} value={party} />
              <Fact term={t("manage.name")} value={reservation.bookerName} />
              <Fact term={t("manage.phone")} value={reservation.bookerPhone} />
              <Fact term={t("manage.email")} value={reservation.bookerEmail} />
              <Fact term={t("manage.note")} value={reservation.note} />
            </dl>
            {reservation.canChange ? (
              <>
                {reservation.changeUntil ? (
                  <p className="text-sm text-muted-foreground">
                    {t("manage.changeUntil", {
                      when: dates.dateTime({ instant: reservation.changeUntil, timeZone }),
                    })}
                  </p>
                ) : null}
                <ManageActions
                  token={token}
                  cancelSummary={{ party, when }}
                  booker={{
                    bookerName: reservation.bookerName ?? "",
                    bookerPhone: reservation.bookerPhone ?? "",
                    bookerEmail: reservation.bookerEmail ?? "",
                    note: reservation.note ?? "",
                  }}
                />
              </>
            ) : null}
            {reservation.state === "BOOKED" && !reservation.canChange ? (
              <p className="rounded-lg bg-muted px-3 py-2.5 text-sm">{t("manage.tooLate")}</p>
            ) : null}
            <BookAgain reservation={reservation} label={t("manage.bookAgain")} />
          </>
        )}
      </div>
    </BookingShell>
  );
}

type LeadProps = Pick<ManageReservationProps, "reservation" | "booked"> & {
  state: (typeof TITLE)[keyof typeof TITLE];
};

/** One line under the title: thanks after booking, else what the state means. */
async function Lead({ reservation, booked, state }: LeadProps) {
  const t = await getTranslations("guestBooking.manage");
  if (state === "booked") {
    if (!booked) return null;
    return (
      <div role="status" className="flex gap-3 rounded-xl bg-muted px-4 py-3.5 text-sm">
        <CircleCheckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          <p className="font-medium">{t("bookedThanks", { name: reservation.bookerName ?? "" })}</p>
          {reservation.bookerEmail ? (
            <p className="text-muted-foreground">
              {t("sent", { email: emailHint({ email: reservation.bookerEmail }) })}
            </p>
          ) : null}
        </div>
      </div>
    );
  }
  const description = {
    pending: "pendingDescription",
    cancelled: "cancelledDescription",
    past: "pastDescription",
  } as const;
  return <p className="text-sm text-muted-foreground">{t(description[state])}</p>;
}

function Fact({ term, value }: { term: string; value: string | null }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="min-w-0 break-words font-medium">{value}</dd>
    </>
  );
}

type BookAgainProps = { reservation: PublicReservationDto; label: string };

/** After a cancellation or a visit: straight back to the same dining room. */
function BookAgain({ reservation, label }: BookAgainProps) {
  const { pageSlug, roomSlug, state } = reservation;
  if (state === "BOOKED" || state === "PENDING_PAYMENT" || !pageSlug || !roomSlug) return null;
  return (
    <Button asChild className="h-11 w-full">
      <Link href={`/book/${pageSlug}/${roomSlug}`}>{label}</Link>
    </Button>
  );
}
