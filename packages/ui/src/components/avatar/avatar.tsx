import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
  {
    variants: {
      size: {
        xs: "size-5 text-[0.5625rem]",
        sm: "size-6 text-[0.625rem]",
        md: "size-8 text-xs",
        lg: "size-16 text-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type AvatarProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof avatarVariants> & {
    /** Full name: gives the initials and the accessible label. */
    name: string;
    photoUrl?: string | null;
  };

export function initialsOf({ name }: { name: string }): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** A person's photo, or their initials while there is none. */
export function Avatar({ name, photoUrl, size, className, ...props }: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      role="img"
      aria-label={name}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initialsOf({ name })}</span>
      )}
    </span>
  );
}
