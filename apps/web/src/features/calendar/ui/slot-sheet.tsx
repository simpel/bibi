import { type AssetBooking, Button, type CalendarAsset } from "@bibi/ui";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect } from "react";
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

/** Escape closes the panel before the dialog around it (window capture runs before Radix). */
function useEscapeFirst({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Browser keyboard: Escape closes the sheet before anything under it.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onClose();
      },
      { capture: true, signal: controller.signal },
    );
    return () => controller.abort();
  }, [open, onClose]);
}

/**
 * One booking of the read-only calendar in a side panel INSIDE the surrounding dialog (not a
 * page-wide sheet): its ticket, customer, state, line, resource, period, quantity and hold. The
 * dim overlay covers only the dialog; a click on it (or Escape) closes the panel, a click outside
 * the dialog closes the dialog. Fields the caller may not read are left out; nothing navigates.
 */
export function SlotSheet({ slot, assets, onClose }: SlotSheetProps) {
  const t = useTranslations("calendar.slot");
  const common = useTranslations("common");
  useEscapeFirst({ open: slot !== null, onClose });
  if (!slot) return null;
  return (
    <>
      <button
        type="button"
        aria-label={common("close")}
        className="absolute inset-0 z-20 cursor-default bg-foreground/20"
        onClick={onClose}
      />
      <aside
        aria-label={slot.ticket ?? slot.name ?? t("title")}
        className="absolute inset-y-0 right-0 z-30 flex w-full flex-col overflow-y-auto border-l bg-background shadow-lg sm:max-w-md"
      >
        <div className="flex items-start justify-between gap-2 p-4">
          <div className="grid gap-1">
            <h3 className="font-serif text-lg">{slot.ticket ?? slot.name ?? t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={common("close")}
            onClick={onClose}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </div>
        <SlotFacts slot={slot} assets={assets} />
      </aside>
    </>
  );
}
