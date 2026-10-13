import type { ComponentProps, CSSProperties } from "react";
import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

export type ToasterProps = ComponentProps<typeof Sonner>;

/** Sonner toaster themed through design tokens. Mount once near the app root. */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      } as CSSProperties}
      {...props}
    />
  );
}
