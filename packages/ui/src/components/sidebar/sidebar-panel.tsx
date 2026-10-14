import type { ComponentProps, CSSProperties } from "react";
import { cn } from "../../lib/cn";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../sheet/sheet";
import { SIDEBAR_WIDTH_MOBILE } from "./sidebar-context";

export type SidebarSide = "left" | "right";
export type SidebarVariant = "sidebar" | "floating" | "inset";
export type SidebarCollapsible = "offcanvas" | "icon" | "none";

export type SidebarStaticProps = ComponentProps<"div">;

export function SidebarStatic({ className, children, ...props }: SidebarStaticProps) {
  return (
    <div
      data-slot="sidebar"
      className={cn(
        "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type SidebarMobileProps = ComponentProps<"div"> & {
  side: SidebarSide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
};

export function SidebarMobile({
  side,
  open,
  onOpenChange,
  title,
  description,
  children,
}: SidebarMobileProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-sidebar="sidebar"
        data-slot="sidebar"
        data-mobile="true"
        className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
        style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as CSSProperties}
        side={side}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex h-full w-full flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
