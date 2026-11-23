"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { PackageIcon } from "lucide-react";
import { DynamicIcon, type IconName, iconNames } from "lucide-react/dynamic";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export const visualTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground",
  {
    variants: {
      size: {
        xs: "size-5 rounded-sm [&_svg]:size-3.5",
        sm: "size-9 [&_svg]:size-4.5",
        md: "size-12 [&_svg]:size-6",
        lg: "size-24 rounded-lg [&_svg]:size-10",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

const KNOWN = new Set<string>(iconNames);

/** Whether `name` is a Lucide icon this build can draw. */
export function isIconName({ name }: { name: string | null | undefined }): boolean {
  return typeof name === "string" && KNOWN.has(name);
}

const Fallback = () => <PackageIcon />;

export type VisualTileProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof visualTileVariants> & {
    /** An image URL; wins over the icon. */
    src?: string | null;
    /** A Lucide icon name, drawn when there is no image. */
    icon?: string | null;
    /** The image's text alternative; omit when a name sits next to the tile. */
    alt?: string;
  };

/**
 * A record's picture as a square tile: its image, else its Lucide icon, else a neutral package
 * icon. Decorative unless `alt` is given.
 */
export function VisualTile({ src, icon, alt, size, className, ...props }: VisualTileProps) {
  return (
    <span
      data-slot="visual-tile"
      className={cn(visualTileVariants({ size }), className)}
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      {...props}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : isIconName({ name: icon }) && icon ? (
        <DynamicIcon name={icon as IconName} fallback={Fallback} />
      ) : (
        <PackageIcon />
      )}
    </span>
  );
}
