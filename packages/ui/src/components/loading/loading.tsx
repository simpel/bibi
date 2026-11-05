"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type ComponentProps, useRef } from "react";
import { cn } from "../../lib/cn";
import { Wordmark, type WordmarkProps } from "../wordmark/wordmark";

gsap.registerPlugin(useGSAP);

/** Seconds for one swell; the release takes the same, so a full breath is twice this. */
const SWELL = 1.3;
/** Delay between letters, which makes the wave travel through the word from left to right. */
const STAGGER = 0.4;
/** A letter pulses between this scale and 1. */
const SMALLEST = 0.9;

/** `icon` is as big as an icon in a button and shows only the B; the rest grow to the full wordmark. */
export type LoadingSize = "icon" | "sm" | "md" | "lg" | "xl" | "2xl";

const WORDMARK_SIZES = {
  icon: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  "2xl": 96,
} satisfies Record<LoadingSize, NonNullable<WordmarkProps["size"]>>;

export type LoadingProps = Omit<ComponentProps<"span">, "children"> & {
  /** Accessible name; the caller passes a localized one. */
  label: string;
  size?: LoadingSize;
};

/** The Bibi wordmark breathing: its letters pulse in a slow wave from left to right, looping forever. */
export function Loading({ label, size = "lg", className, ...props }: LoadingProps) {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The glyph paths are drawn right to left, so reverse them to read left to right.
        const letters = gsap.utils.toArray<SVGPathElement>("path", root.current).reverse();
        gsap.set(letters, { scale: SMALLEST, transformOrigin: "50% 50%" });
        letters.forEach((letter, index) => {
          gsap.to(letter, {
            scale: 1,
            duration: SWELL,
            ease: "sine.inOut",
            delay: index * STAGGER,
            repeat: -1,
            yoyo: true,
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <span
      ref={root}
      role="status"
      aria-label={label}
      data-slot="loading"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <Wordmark
        size={WORDMARK_SIZES[size]}
        variant={size === "icon" ? "initial" : "wordmark"}
        aria-hidden="true"
        className="overflow-visible text-inherit"
      />
    </span>
  );
}
