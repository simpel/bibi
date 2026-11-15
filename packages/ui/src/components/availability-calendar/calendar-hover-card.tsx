"use client";

import type { ReactNode } from "react";
import { toneOfLine } from "../booking-tone/booking-tone";
import { CursorHoverCard } from "../cursor-hover/cursor-hover-card";
import {
  CalendarHoverDetails,
  type CalendarHoverDetailsProps,
} from "../cursor-hover/cursor-hover-details";

export type CalendarHoverCardProps = CalendarHoverDetailsProps & {
  children: ReactNode;
  /** Replaces the line card, e.g. the booking card in availability. */
  card?: ReactNode;
  content?: ReactNode;
  /** Never peek, e.g. while the item is open in a sheet beside it. */
  disabled?: boolean;
  asChild?: boolean;
  className?: string;
};

/**
 * Wraps a calendar item so its details follow the mouse cursor on hover.
 * Unifies hover behavior across all availability calendar views.
 */
export function CalendarHoverCard({
  children,
  card,
  content,
  disabled,
  asChild = true,
  className,
  ...details
}: CalendarHoverCardProps) {
  const line = details.booking ?? details.line;
  const tone = line ? toneOfLine({ line }) : undefined;
  const cardContent = content ?? card ?? <CalendarHoverDetails detailed tone={tone} {...details} />;
  return (
    <CursorHoverCard
      disabled={disabled}
      content={cardContent}
      asChild={asChild}
      className={className}
      tone={tone}
    >
      {children}
    </CursorHoverCard>
  );
}
