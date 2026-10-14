"use client";

import { PanelLeftIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { useSidebar } from "./sidebar-context";
import { SidebarDesktop } from "./sidebar-desktop";
import {
  type SidebarCollapsible,
  SidebarMobile,
  type SidebarSide,
  SidebarStatic,
  type SidebarVariant,
} from "./sidebar-panel";

export type SidebarProps = ComponentProps<"div"> & {
  side?: SidebarSide;
  variant?: SidebarVariant;
  collapsible?: SidebarCollapsible;
  mobileTitle?: string;
  mobileDescription?: string;
};

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  mobileTitle = "Sidebar",
  mobileDescription = "Navigation",
  children,
  ...props
}: SidebarProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") return <SidebarStatic {...props}>{children}</SidebarStatic>;
  if (isMobile) {
    return (
      <SidebarMobile
        side={side}
        open={openMobile}
        onOpenChange={setOpenMobile}
        title={mobileTitle}
        description={mobileDescription}
      >
        {children}
      </SidebarMobile>
    );
  }
  return (
    <SidebarDesktop
      side={side}
      variant={variant}
      collapsible={collapsible}
      state={state}
      {...props}
    >
      {children}
    </SidebarDesktop>
  );
}

export type SidebarTriggerProps = ComponentProps<typeof Button> & { label?: string };

export function SidebarTrigger({
  className,
  onClick,
  label = "Toggle sidebar",
  ...props
}: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

export type SidebarRailProps = ComponentProps<"button"> & { label?: string };

export function SidebarRail({ className, label = "Toggle sidebar", ...props }: SidebarRailProps) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label={label}
      tabIndex={-1}
      onClick={toggleSidebar}
      title={label}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}
