import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";

gsap.registerPlugin(useGSAP);

const DURATION = 0.5;
const STAGGER = 0.05;
/** How far the unphased column slides in from, in px. */
const NUDGE = 24;

type Targets = { unphased: HTMLElement | null; columns: HTMLElement[]; faces: HTMLElement[] };

const findTargets = ({ root }: { root: HTMLElement }): Targets => ({
  unphased: root.querySelector<HTMLElement>('[data-slot="kanban-unphased-column"]'),
  columns: gsap.utils.toArray<HTMLElement>('[data-kanban-motion="phase"]', root),
  faces: gsap.utils.toArray<HTMLElement>('[data-slot="kanban-flip-inner"]', root),
});

/** Each target's values with the board turned (`on`) or not; columns off sit `shift` to the left. */
const state = ({ on, shift }: { on: boolean; shift: number }) => ({
  column: { x: on ? 0 : -shift },
  face: { rotationY: on ? 180 : 0 },
  unphased: { autoAlpha: on ? 1 : 0, x: on ? 0 : -NUDGE },
});

type FlipInput = { root: HTMLElement; flipped: boolean; animate: boolean; onComplete: () => void };

/** Sets or tweens the columns, their faces and the unphased column to the `flipped` state. */
function flipTo({ root, flipped, animate, onComplete }: FlipInput) {
  const { unphased, columns, faces } = findTargets({ root });
  const gap = Number.parseFloat(getComputedStyle(root).columnGap) || 0;
  const shift = unphased ? unphased.offsetWidth + gap : 0;
  const [from, to] = [state({ on: !flipped, shift }), state({ on: flipped, shift })];
  if (!animate) {
    gsap.set(columns, to.column);
    gsap.set(faces, to.face);
    if (unphased) gsap.set(unphased, to.unphased);
    return;
  }
  // Moving right the rightmost column leads, moving left the leftmost, so no two overlap.
  const stagger = { each: STAGGER, from: flipped ? ("end" as const) : ("start" as const) };
  const tl = gsap.timeline({
    defaults: { duration: DURATION, ease: "power2.inOut", overwrite: true },
    onComplete,
  });
  tl.fromTo(columns, from.column, { ...to.column, stagger }, 0);
  tl.fromTo(faces, from.face, { ...to.face, stagger }, 0);
  if (!unphased) return;
  // The leftmost column sits over the unphased one while shifted: fade in once it has mostly
  // moved off (it starts last), and out quickly before it slides back over.
  const fadeIn = STAGGER * Math.max(columns.length - 1, 0) + DURATION * 0.4;
  tl.fromTo(
    unphased,
    from.unphased,
    { ...to.unphased, duration: flipped ? DURATION : DURATION / 2 },
    flipped ? fadeIn : 0,
  );
}

export type UsePhaseFlipMotionInput = {
  scope: RefObject<HTMLElement | null>;
  flipped: boolean;
  /** Called when a turn has finished (at once under `prefers-reduced-motion`). */
  onFlipEnd?: (input: { flipped: boolean }) => void;
};

/**
 * Turns the columns over with GSAP, one slightly after the other. Turning to their backs they
 * slide right to make room for the unphased column on the far left, which fades in; turning back
 * reverses it. The first run only sets the start state.
 */
export function usePhaseFlipMotion({ scope, flipped, onFlipEnd }: UsePhaseFlipMotionInput) {
  const last = useRef<boolean | null>(null);
  const onEnd = useRef(onFlipEnd);
  onEnd.current = onFlipEnd;
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const turning = last.current !== null && last.current !== flipped;
      last.current = flipped;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const done = () => onEnd.current?.({ flipped });
      flipTo({ root, flipped, animate: turning && !reduced, onComplete: done });
      if (turning && reduced) done();
    },
    { dependencies: [flipped], scope },
  );
}
