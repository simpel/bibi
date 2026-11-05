import { cva, type VariantProps } from "class-variance-authority";
import { Avatar as AvatarPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
  {
    variants: {
      size: {
        xs: "size-5 text-[0.5625rem]",
        sm: "size-6 text-[0.625rem]",
        md: "size-8 text-xs",
        lg: "size-16 text-lg",
        xl: "size-24 text-2xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type AvatarProps = ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants> & {
    /** Full name: gives the initials and the accessible label when used without children. */
    name?: string;
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

/** shadcn / Radix Avatar image */
export function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

/** shadcn / Radix Avatar fallback */
export function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("flex size-full items-center justify-center rounded-full bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Standard shadcn Avatar: composable with `<AvatarImage>` and `<AvatarFallback>`,
 * or used with `name` and `photoUrl` convenience props.
 */
export function Avatar({ name, photoUrl, size, className, children, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      role={name ? "img" : undefined}
      aria-label={name}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {children ?? (
        <>
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback aria-hidden={Boolean(name)}>
            {name ? initialsOf({ name }) : null}
          </AvatarFallback>
        </>
      )}
    </AvatarPrimitive.Root>
  );
}
