import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

/**
 * Width tiers of a contained page (ADR 0038). Full-width pages (the calendar, the assistant home)
 * are not containers: they live in the app's `(canvas)` route group.
 */
export const pageContainerVariants = cva("mx-auto w-full", {
  variants: {
    width: {
      narrow: "max-w-2xl",
      default: "max-w-5xl",
      wide: "max-w-7xl",
    },
    gutter: {
      true: "px-4 py-4 sm:px-6 sm:py-6",
      false: "",
    },
  },
  defaultVariants: { width: "default", gutter: true },
});

export type PageContainerProps = ComponentProps<"div"> & VariantProps<typeof pageContainerVariants>;

/** Centres page content at one of three widths and supplies the page gutter. A page that needs a
 * narrower tier than its layout nests one with `gutter={false}`. */
export function PageContainer({ className, width, gutter, ...props }: PageContainerProps) {
  return (
    <div
      data-slot="page-container"
      className={cn(pageContainerVariants({ width, gutter }), className)}
      {...props}
    />
  );
}

/**
 * A band of a contained page (ADR 0038): edge to edge, with its own background. The first child
 * is a `PageContainer`, which centres and pads the content.
 */
export const pageSectionVariants = cva("w-full", {
  variants: {
    tone: {
      default: "",
      card: "bg-card",
      muted: "bg-muted",
    },
    divided: {
      true: "border-t",
      false: "",
    },
  },
  defaultVariants: { tone: "default", divided: false },
});

export type PageSectionProps = ComponentProps<"section"> & VariantProps<typeof pageSectionVariants>;

/** Full-width section of a page. `tone="card"` is the white band; `divided` adds a top border. */
export function PageSection({ className, tone, divided, ...props }: PageSectionProps) {
  return (
    <section
      data-slot="page-section"
      className={cn(pageSectionVariants({ tone, divided }), className)}
      {...props}
    />
  );
}

export type PageBandsProps = ComponentProps<"div">;

/**
 * A page of several `PageSection` bands (ADR 0038): every other band on a muted background, a
 * rule between bands. A band whose container renders nothing is hidden.
 */
export function PageBands({ className, ...props }: PageBandsProps) {
  return (
    <div
      data-slot="page-bands"
      className={cn(
        "[&>section:nth-of-type(even)]:bg-muted/50 [&>section+section]:border-t",
        "[&>section:has(>[data-slot=page-container]:empty)]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export type PageBandProps = PageSectionProps & {
  /** Classes for the inner container, e.g. its gap or columns. */
  containerClassName?: string;
};

/** One band of `PageBands`: a `PageSection` with its content in a padded `PageContainer` grid. */
export function PageBand({ containerClassName, children, ...props }: PageBandProps) {
  return (
    <PageSection {...props}>
      <PageContainer className={cn("grid grid-cols-1 py-8 sm:py-10", containerClassName)}>
        {children}
      </PageContainer>
    </PageSection>
  );
}

export type SimplePageProps = PageContainerProps & Pick<PageSectionProps, "tone">;

/** A page of one section: the usual list, detail or form. Several sections compose `PageSection`. */
export function SimplePage({ tone, ...props }: SimplePageProps) {
  return (
    <PageSection {...(tone ? { tone } : {})}>
      <PageContainer {...props} />
    </PageSection>
  );
}
