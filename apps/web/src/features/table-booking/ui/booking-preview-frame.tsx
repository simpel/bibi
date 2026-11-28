"use client";

import {
  Button,
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import { ExternalLinkIcon, MonitorIcon, RotateCcwIcon, SmartphoneIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const START = "start";

export type BookingPreviewFrameProps = {
  slug: string;
  rooms: readonly { slug: string; name: string }[];
};

/** The live guest pages in a frame: a phone or a computer, from the start page or one room. */
export function BookingPreviewFrame({ slug, rooms }: BookingPreviewFrameProps) {
  const t = useTranslations("tableBooking.preview");
  const locale = useLocale();
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [target, setTarget] = useState(START);
  const [run, setRun] = useState(0);
  const path = `/${locale}/book/${encodeURIComponent(slug)}${target === START ? "" : `/${encodeURIComponent(target)}`}`;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={device === "phone" ? "default" : "outline"}
          aria-pressed={device === "phone"}
          onClick={() => setDevice("phone")}
        >
          <SmartphoneIcon />
          {t("phone")}
        </Button>
        <Button
          variant={device === "desktop" ? "default" : "outline"}
          aria-pressed={device === "desktop"}
          onClick={() => setDevice("desktop")}
        >
          <MonitorIcon />
          {t("desktop")}
        </Button>
        <Select
          value={target}
          onValueChange={(next) => {
            setTarget(next);
            setRun(run + 1);
          }}
        >
          <SelectTrigger aria-label={t("start")} className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={START}>{t("start")}</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.slug} value={room.slug}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setRun(run + 1)}>
          <RotateCcwIcon />
          {t("reload")}
        </Button>
        <Button asChild variant="outline" className="ml-auto">
          <a href={path} target="_blank" rel="noreferrer">
            <ExternalLinkIcon />
            {t("openNew")}
          </a>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("liveNote")}</p>
      <div className="overflow-x-auto rounded-xl border bg-muted/40 p-4">
        <iframe
          key={`${path}-${run}`}
          src={path}
          title={t("frameTitle")}
          className={cn(
            "mx-auto block h-[780px] border bg-background",
            device === "phone"
              ? "w-[390px] max-w-full rounded-[2rem] border-8 border-foreground/80"
              : "w-full rounded-lg",
          )}
        />
      </div>
    </div>
  );
}
