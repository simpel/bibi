import {
  type AssetBooking,
  type CalendarAsset,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { plainDayText } from "@/lib/time/plain-day";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";

export type SlotSheetProps = {
  /** The booking clicked; null closes the sheet. */
  slot: AssetBooking | null;
  assets: readonly CalendarAsset[];
  onClose: () => void;
};

function Fact({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function SlotFacts({ slot, assets }: { slot: AssetBooking; assets: SlotSheetProps["assets"] }) {
  const t = useTranslations("calendar.slot");
  const dates = useDateTimeFormat();
  const timeZone = useOrganizationTimeZone();
  const day = plainDayText({ day: slot.date, timeZone, dates });
  const hold = slot.state.hold === "none" ? null : t(slot.state.hold === "hard" ? "hard" : "soft");
  return (
    <dl className="grid divide-y px-4">
      <Fact label={t("ticket")}>{slot.ticket}</Fact>
      <Fact label={t("customer")}>{slot.customer}</Fact>
      <Fact label={t("state")}>{slot.state.name}</Fact>
      <Fact label={t("line")}>{slot.name}</Fact>
      <Fact label={t("resource")}>{assets.find(({ id }) => id === slot.assetId)?.name}</Fact>
      <Fact label={t("period")}>{`${day} ${slot.start}–${slot.end}`}</Fact>
      <Fact label={t("quantity")}>{slot.quantity}</Fact>
      <Fact label={t("hold")}>{hold}</Fact>
    </dl>
  );
}

/**
 * One booking of the read-only calendar, over it: its ticket, customer, state, line, resource,
 * period, quantity and hold. Fields the caller may not read are not in the booking, so they are
 * left out. Nothing here navigates.
 */
export function SlotSheet({ slot, assets, onClose }: SlotSheetProps) {
  const t = useTranslations("calendar.slot");
  return (
    <Sheet open={slot !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{slot?.ticket ?? slot?.name ?? t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        {slot ? <SlotFacts slot={slot} assets={assets} /> : null}
      </SheetContent>
    </Sheet>
  );
}
