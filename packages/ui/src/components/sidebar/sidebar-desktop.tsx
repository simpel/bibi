import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import type { SidebarCollapsible, SidebarSide, SidebarVariant } from "./sidebar-panel";

export type SidebarDesktopProps = ComponentProps<"div"> & {
  side: SidebarSide;
  variant: SidebarVariant;
  collapsible: SidebarCollapsible;
  state: "expanded" | "collapsed";
};

type FloatingInput = { floating: boolean };

function SidebarGap({ floating }: FloatingInput) {
  return (
    <div
      data-slot="sidebar-gap"
      className={cn(
        "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
        "group-data-[collapsible=offcanvas]:w-0",
        "group-data-[side=right]:rotate-180",
        floating
          ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
          : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
      )}
    />
  );
}

type ContainerProps = ComponentProps<"div"> & FloatingInput & { side: SidebarSide };

function SidebarContainer({ floating, side, className, children, ...props }: ContainerProps) {
  return (
    <div
      data-slot="sidebar-container"
      className={cn(
        "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
        side === "left"
          ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
          : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
        floating
          ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
          : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
        className,
      )}
      {...props}
    >
      <div
        data-sidebar="sidebar"
        data-slot="sidebar-inner"
        className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
      >
        {children}
      </div>
    </div>
  );
}

export function SidebarDesktop(props: SidebarDesktopProps) {
  const { side, variant, collapsible, state, ...rest } = props;
  const floating = variant === "floating" || variant === "inset";
  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <SidebarGap floating={floating} />
      <SidebarContainer floating={floating} side={side} {...rest} />
    </div>
  );
}
