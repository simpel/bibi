"use client";

import { Spinner } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { loadMyWorkAction } from "../actions";
import { windowFrom } from "../lib/my-work-window";
import { MyWorkDays } from "./my-work-days";
import type { MyWorkCardWireish } from "./my-work-wireish";

export type MyWorkLaterProps = { next: string | null; timeZone: string };

/**
 * Later, read on as the member scrolls: each time the end of the list comes into view, the next
 * window from the first day with a card (`next`) is read and its cards added (spec: home).
 */
export function MyWorkLater({ next, timeZone }: MyWorkLaterProps) {
  const t = useTranslations("myWork");
  const dates = useDateTimeFormat();
  const [cards, setCards] = useState<MyWorkCardWireish[]>([]);
  const [cursor, setCursor] = useState(next);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  // IntersectionObserver: reads the next window when the end of the list scrolls into view.
  useEffect(() => {
    const target = end.current;
    if (!cursor || pending || error || !target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      startTransition(async () => {
        const result = await loadMyWorkAction(windowFrom({ from: cursor }));
        if (!result.ok) return setError(errorKeyForCode({ code: result.error.code }));
        setCards((shown) => [...shown, ...(result.value.cards ?? [])]);
        setCursor(result.value.next);
      });
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [cursor, pending, error]);

  return (
    <>
      <MyWorkDays cards={cards} now={new Date()} timeZone={timeZone} dates={dates} />
      <InlineLoadError errorKey={error} />
      <div
        ref={end}
        className="flex min-h-8 items-center justify-center text-sm text-muted-foreground"
      >
        {pending ? <Spinner label={t("loading")} /> : cursor ? null : t("end")}
      </div>
    </>
  );
}
