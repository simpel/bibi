import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type QrCodeProps = Omit<ComponentProps<"svg">, "children"> & {
  /** `modules[y][x]` true for a dark module, from an encoder such as the web app's `encodeQr`. */
  modules: readonly (readonly boolean[])[];
  /** What the code is for, read by screen readers. */
  label: string;
};

const QUIET_ZONE = 4;

/**
 * A QR code drawn as one SVG path (dark modules on a light square with the standard four-module
 * quiet zone), so it stays sharp at any size and scans in dark mode too.
 */
export function QrCode({ modules, label, className, ...props }: QrCodeProps) {
  const size = modules.length + QUIET_ZONE * 2;
  const path = modules
    .flatMap((row, y) =>
      row.map((dark, x) => (dark ? `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z` : "")),
    )
    .join("");
  return (
    <svg
      data-slot="qr-code"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cn("size-48 rounded-md bg-white text-black", className)}
      {...props}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
