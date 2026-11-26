"use client";

import { Label, Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateBookingPageAction } from "../actions";

export type BookingPagePublishedSwitchProps = {
  published: boolean;
  canEdit: boolean;
  /** Without an address the page cannot be published. */
  hasSlug: boolean;
};

/** Published saves as soon as it changes; an error (no address yet) puts it back. */
export function BookingPagePublishedSwitch({
  published,
  canEdit,
  hasSlug,
}: BookingPagePublishedSwitchProps) {
  const t = useTranslations("tableBooking.page");
  const common = useTranslations("common");
  const router = useRouter();
  const id = useId();
  const { run, pending } = useToastAction();
  const [current, setCurrent] = useState(published);
  const change = ({ next }: { next: boolean }) => {
    const previous = current;
    setCurrent(next);
    run({
      action: () => updateBookingPageAction({ input: { published: next } }),
      messages: {
        pending: common("saving"),
        success: next ? t("publishedOn") : t("publishedOff"),
      },
      onSuccess: () => router.refresh(),
      onError: () => setCurrent(previous),
    });
  };
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={current}
        disabled={!canEdit || pending || (!hasSlug && !current)}
        onCheckedChange={(next) => change({ next })}
      />
      <Label htmlFor={id}>{t("published")}</Label>
    </div>
  );
}
