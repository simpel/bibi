"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useHelp } from "../help/help-provider";
import { TourCard, type TourLabels } from "./tour-card";
import { TOUR_SELECTORS, TOURS, type TourId } from "./tour-defs";

export type TourStepText = { step: string; title: string; body: string };

export type TourRunnerProps = {
  tour: TourId;
  steps: readonly TourStepText[];
  labels: TourLabels;
};

const GAP = 12;
const PAD = 6;
const CARD_WIDTH = 320;
/** Sections stream in (ADR 0097), so the tour waits a moment before it looks for them. */
const START_DELAY_MS = 900;

/** The first element of a step that is on screen (a toolbar has a wide and a narrow copy). */
const findTarget = ({ tour, step }: { tour: TourId; step: string }): HTMLElement | null => {
  const key = `${tour}.${step}`;
  const selector = TOUR_SELECTORS[key] ?? `[data-tour="${key}"]`;
  const found = [...document.querySelectorAll<HTMLElement>(selector)];
  return found.find((element) => element.offsetWidth > 0 && element.offsetHeight > 0) ?? null;
};

type Placement = { spot: DOMRect; card: React.CSSProperties };

/** The highlighted box and where the card goes: under the element, else over it, else docked. */
const place = ({
  element,
  cardHeight,
}: {
  element: HTMLElement;
  cardHeight: number;
}): Placement => {
  const rect = element.getBoundingClientRect();
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  const spot = new DOMRect(rect.left, top, rect.width, Math.max(bottom - top, 0));
  const left = Math.min(Math.max(rect.left, GAP), window.innerWidth - CARD_WIDTH - GAP);
  const fitsBelow = bottom + GAP + cardHeight <= window.innerHeight;
  const fitsAbove = top - GAP - cardHeight >= 0;
  if (fitsBelow) return { spot, card: { top: bottom + PAD + GAP, left } };
  if (fitsAbove) return { spot, card: { top: top - PAD - GAP - cardHeight, left } };
  return { spot, card: { bottom: GAP, left } };
};

/**
 * The page tour: a dimmed page with the current element lit and a card with Back, Next and Skip.
 * It starts by itself the first time, once per user (closing it stores `help.dismissed.tour-*`,
 * like a hint), and again when the user asks for it. Steps whose element is missing are skipped.
 */
export function TourRunner({ tour, steps, labels }: TourRunnerProps) {
  const help = useHelp();
  const finished = help.isDismissed({ id: TOURS[tour].hint });
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [available, setAvailable] = useState<readonly TourStepText[]>([]);

  useEffect(() => {
    // Waits for the page's streamed sections (a timer), then starts if the tour is not finished.
    if (finished) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => {
      const present = steps.filter(({ step }) => findTarget({ tour, step }));
      setAvailable(present);
      setIndex(0);
      setRunning(present.length > 0);
    }, START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [finished, steps, tour]);

  const current = running ? available[index] : undefined;
  const close = useCallback(() => {
    setRunning(false);
    help.dismiss({ id: TOURS[tour].hint });
  }, [help, tour]);

  useEffect(() => {
    // Follows the element on the screen: scrolls it into view, measures it again on resize or scroll.
    if (!current) return;
    const element = findTarget({ tour, step: current.step });
    if (!element) {
      // The element left the page: on to the next step, or the end.
      if (index >= available.length - 1) close();
      else setIndex((i) => i + 1);
      return;
    }
    element.scrollIntoView({ block: "nearest", behavior: "instant" });
    const measure = () => setPlacement(place({ element, cardHeight: 190 }));
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current, tour, index, available.length, close]);

  useEffect(() => {
    // Keyboard: Escape skips, the arrows step.
    if (!running) return;
    const onKey = ({ key }: KeyboardEvent) => {
      if (key === "Escape") close();
      if (key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (key === "ArrowRight") setIndex((i) => Math.min(i + 1, available.length - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, available.length, close]);

  if (!current || !placement) return null;
  const { spot, card } = placement;
  return createPortal(
    <>
      <div aria-hidden className="fixed inset-0 z-[60]" />
      <div
        aria-hidden
        className="pointer-events-none fixed z-[65] rounded-lg shadow-[0_0_0_9999px] shadow-foreground/40 ring-2 ring-primary transition-all duration-200"
        style={{
          top: spot.top - PAD,
          left: spot.left - PAD,
          width: spot.width + PAD * 2,
          height: spot.height + PAD * 2,
        }}
      />
      <TourCard
        key={current.step}
        title={current.title}
        body={current.body}
        index={index}
        total={available.length}
        labels={labels}
        style={card}
        onBack={() => setIndex((i) => Math.max(i - 1, 0))}
        onNext={() => (index === available.length - 1 ? close() : setIndex((i) => i + 1))}
        onSkip={close}
      />
    </>,
    document.body,
  );
}
