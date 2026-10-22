import { SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Separator } from "../../components/separator/separator";
import { SidebarTrigger } from "../../components/sidebar/sidebar";

export type AppScreenHeaderProps = {
  pageTitle: string;
  breadcrumbs: string[];
  headerActions?: ReactNode;
};

export function AppScreenHeader({ pageTitle, breadcrumbs, headerActions }: AppScreenHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span>Bibi</span>
          <span>/</span>
          {breadcrumbs.map((crumb) => (
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
  );
}
