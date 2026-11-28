"use client";

import { Button } from "@bibi/ui";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import type { SlotChoice } from "../lib/group-slots";
import { type CaptchaProps, GuestDetailsForm } from "./guest-details-form";
import type { NeedLists } from "./needs-section";
import { SlotPicker, type SlotPickerProps } from "./slot-picker";

export type BookingFlowProps = Omit<SlotPickerProps, "onPick" | "selected"> & {
  slug: string;
  roomSlug: string;
  /** The chosen day in words, e.g. "Friday 4 December", prepared on the server. */
  dayLabel: string;
  policy: string | null;
  captcha: CaptchaProps;
  needLists: NeedLists;
};

/**
 * The guest's booking (ADR 0119): party, day and time, then their details. The time step is the
 * URL's (`?party=&date=`); the details step is local, so Back keeps what was typed nowhere else.
 */
export function BookingFlow(props: BookingFlowProps) {
  const t = useTranslations("guestBooking");
  const router = useRouter();
  const [slot, setSlot] = useState<SlotChoice | null>(null);
  if (!slot) {
    return (
      <SlotPicker
        {...props}
        calendar={{ slug: props.slug, roomSlug: props.roomSlug }}
        onPick={({ slot: picked }) => setSlot(picked)}
      />
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 rounded-xl border bg-muted/50 px-4 py-3">
        <p className="font-medium">
          {t("summary", {
            date: props.dayLabel,
            time: slot.time,
            party: t("party.option", { count: props.party }),
          })}
        </p>
        <Button
          type="button"
          variant="link"
          className="h-auto self-start p-0 text-foreground underline"
          onClick={() => setSlot(null)}
        >
          <ArrowLeftIcon aria-hidden />
          {t("details.back")}
        </Button>
      </div>
      <h2 className="text-base font-semibold">{t("details.title")}</h2>
      <GuestDetailsForm
        slug={props.slug}
        roomSlug={props.roomSlug}
        party={props.party}
        slot={slot}
        policy={props.policy}
        captcha={props.captcha}
        needLists={props.needLists}
        onTaken={() => {
          setSlot(null);
          router.refresh();
        }}
      />
    </div>
  );
}
