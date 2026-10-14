"use client";

import { type ComponentProps, type CSSProperties, createContext, useContext, useMemo } from "react";
import { cn } from "../../lib/cn";
import { TooltipProvider } from "../tooltip/tooltip";
import { useIsMobile } from "./use-mobile";
import { useSidebarState } from "./use-sidebar-state";

export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3rem";

export type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextProps | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

export type SidebarProviderProps = ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SidebarProvider(props: SidebarProviderProps) {
  const { defaultOpen = true, open: openProp, onOpenChange, className, style, ...rest } = props;
  const isMobile = useIsMobile();
  const sidebarState = useSidebarState({ defaultOpen, open: openProp, onOpenChange, isMobile });
  const { open, setOpen, openMobile, setOpenMobile, toggleSidebar } = sidebarState;
  const state = open ? "expanded" : "collapsed";

  const value = useMemo<SidebarContextProps>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
            className,
          )}
          {...rest}
        />
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}
