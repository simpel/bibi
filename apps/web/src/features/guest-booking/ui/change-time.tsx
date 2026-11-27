"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { changeGuestReservationAction } from "../actions";
import { guestErrorKey } from "../lib/guest-error";
import { SlotPicker, type SlotPickerProps } from "./slot-picker";

export type ChangeTimeProps = Omit<SlotPickerProps, "onPick"> & { token: string };

/** The manage page's change step: the same picker; a picked time moves the booking at once. */
export function ChangeTime({ token, ...picker }: ChangeTimeProps) {
  const t = useTranslations("guestBooking");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const back = `/book/manage/${token}`;
  return (
    <section aria-labelledby="change-heading" aria-busy={pending} className="flex flex-col gap-5">
      <h2 id="change-heading" className="text-base font-semibold">
        {t("manage.changeTitle")}
      </h2>
      <SlotPicker
        {...picker}
        onPick={({ slot }) => {
          if (pending) return;
          run({
            action: () =>
              changeGuestReservationAction({
                token,
                startsAt: slot.startsAt,
                partySize: picker.party,
              }),
            messages: { pending: t("manage.changePending"), success: t("manage.changed") },
            errorMessage: ({ error }) => {
              const key = guestErrorKey({ error });
              return key ? t(`errors.${key}`) : null;
            },
            onSuccess: () => router.replace(back),
            onError: () => router.refresh(),
          });
        }}
      />
      <Button asChild variant="outline" className="h-11 w-full">
        <Link href={back}>{t("manage.keepTime")}</Link>
      </Button>
    </section>
  );
}
