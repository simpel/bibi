"use client";

import NumberFlow, { type Format, NumberFlowGroup, type NumberFlowProps } from "@number-flow/react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export { NumberFlow, NumberFlowGroup, type NumberFlowProps };

export type HeroNumberSize = "sm" | "md" | "lg" | "xl";

export type HeroNumberProps = Omit<ComponentProps<"div">, "children"> & {
  value: number;
  label?: string;
  unit?: string;
  prefix?: string;
  suffix?: string;
  format?: Format;
  locales?: Intl.LocalesArgument;
  size?: HeroNumberSize;
  statusBadge?: string;
  numberClassName?: string;
};

const SIZE_CLASSES: Record<HeroNumberSize, string> = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

export function HeroNumber({
  value,
  label,
  unit,
  prefix,
  suffix = unit ? ` ${unit}` : undefined,
  format,
  locales = "sv-SE",
  size = "lg",
  statusBadge,
  className,
  numberClassName,
  ...props
}: HeroNumberProps) {
  return (
    <div
      data-slot="hero-number"
      className={cn("flex flex-col gap-1.5 font-sans", className)}
      {...props}
    >
      {label || statusBadge ? (
        <div className="flex items-center justify-between gap-3">
          {label ? <span className="text-xs text-muted-foreground">{label}</span> : <span />}
          {statusBadge ? (
            <span className="rounded-sm bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              {statusBadge}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-baseline gap-2">
        <NumberFlow
          value={value}
          locales={locales}
          format={format}
          prefix={prefix}
          suffix={suffix}
          className={cn(
            "font-serif font-light tracking-tight text-black dark:text-white",
            SIZE_CLASSES[size],
            numberClassName,
          )}
        />
      </div>
    </div>
  );
}
