import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

export const tabsListVariants = cva("inline-flex w-fit items-center text-muted-foreground", {
  variants: {
    variant: {
      /** Segmented: a muted track with the open tab raised. */
      pill: "h-9 justify-center rounded-lg bg-muted p-1",
      /** Page tabs along a header's bottom edge: plain labels, the open one underlined. */
      line: "h-auto gap-6",
    },
  },
  defaultVariants: { variant: "pill" },
});

export type TabsListProps = ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>;

export function TabsList({ className, variant, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant ?? "pill"}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

export const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        pill: "rounded-md px-3 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        line: "relative rounded-sm px-0.5 pt-1 pb-3 hover:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:text-primary data-[state=active]:after:bg-primary",
      },
    },
    defaultVariants: { variant: "pill" },
  },
);

export type TabsTriggerProps = ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>;

export function TabsTrigger({ className, variant, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  );
}
