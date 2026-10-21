import {
  Building2Icon,
  CalendarIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../../components/badge/badge";
import { Separator } from "../../components/separator/separator";
import {
  Sidebar,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
} from "../../components/sidebar/sidebar";
import { SidebarProvider } from "../../components/sidebar/sidebar-context";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "../../components/sidebar/sidebar-group";
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "../../components/sidebar/sidebar-layout";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "../../components/sidebar/sidebar-menu";
import { SidebarMenuButton } from "../../components/sidebar/sidebar-menu-button";
import { Wordmark } from "../../components/wordmark/wordmark";

export type NavItemKey =
  | "assistant"
  | "dashboard"
  | "pipeline"
  | "tickets"
  | "customers"
  | "calendar"
  | "items"
  | "venues"
  | "settings";

export type AppScreenShellProps = {
  activeNav: NavItemKey;
  pageTitle: string;
  breadcrumbs?: string[];
  headerActions?: ReactNode;
  children: ReactNode;
};

export function AppScreenShell({
  activeNav,
  pageTitle,
  breadcrumbs = [],
  headerActions,
  children,
}: AppScreenShellProps) {
  return (
    <SidebarProvider className="h-screen w-full overflow-hidden bg-background">
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wordmark size="sm" name="Okazi" />
              <Badge variant="outline" className="text-[10px] tracking-wide uppercase">
                Estate
              </Badge>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-sidebar-foreground/70">
            <span className="truncate font-serif font-medium text-sidebar-foreground">
              Hesselby Slott
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Assistant Zone */}
          <SidebarGroup>
            <SidebarGroupLabel>Assistant</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeNav === "assistant"}
                    tooltip="AI Assistant"
                    className={
                      activeNav === "assistant"
                        ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:text-primary-foreground"
                        : ""
                    }
                  >
                    <SparklesIcon className="size-4" />
                    <span>AI Assistant</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Work Zone */}
          <SidebarGroup>
            <SidebarGroupLabel>Work</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeNav === "dashboard"} tooltip="Dashboard">
                    <LayoutDashboardIcon className="size-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeNav === "pipeline"} tooltip="Pipeline">
                    <KanbanIcon className="size-4" />
                    <span>Pipeline</span>
                    <SidebarMenuBadge>12</SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeNav === "tickets"} tooltip="Tickets">
                    <TicketIcon className="size-4" />
                    <span>Tickets</span>
                    <SidebarMenuBadge>28</SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeNav === "customers"} tooltip="Customers">
                    <UsersIcon className="size-4" />
                    <span>Customers</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeNav === "calendar"} tooltip="Calendar">
                    <CalendarIcon className="size-4" />
                    <span>Calendar</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Catalog Zone */}
          <SidebarGroup>
            <SidebarGroupLabel>Catalog</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeNav === "items"} tooltip="Items & Menus">
                    <PackageIcon className="size-4" />
                    <span>Items & Menus</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeNav === "venues"} tooltip="Venues & Rooms">
                    <Building2Icon className="size-4" />
                    <span>Venues & Spaces</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

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
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Top Bar Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span>Okazi</span>
              <span>/</span>
              {breadcrumbs.map((crumb, _idx) => (
                <span key={crumb} className="flex items-center gap-1.5">
                  <span>{crumb}</span>
                  <span>/</span>
                </span>
              ))}
              <span className="font-medium text-foreground">{pageTitle}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-input bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground sm:flex">
              <SearchIcon className="size-3.5" />
              <span>Search bookings, menus, guests…</span>
              <kbd className="rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            {headerActions}
          </div>
        </header>

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
