import { SettingsIcon } from "lucide-react";
import { SidebarFooter } from "../../components/sidebar/sidebar-layout";
import { SidebarMenu, SidebarMenuItem } from "../../components/sidebar/sidebar-menu";
import { SidebarMenuButton } from "../../components/sidebar/sidebar-menu-button";
import type { NavItemKey } from "./app-screen-shell";

export type AppSidebarFooterProps = {
  activeNav: NavItemKey;
};

export function AppSidebarFooter({ activeNav }: AppSidebarFooterProps) {
  return (
    <SidebarFooter className="border-t border-sidebar-border p-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton isActive={activeNav === "settings"} tooltip="Settings">
            <SettingsIcon className="size-4" />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <div className="flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-serif font-semibold text-primary-foreground">
              EL
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-medium text-sidebar-foreground">
                Elin Lindqvist
              </span>
              <span className="truncate text-[10px] text-muted-foreground">Venue Admin</span>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
