import { Badge } from "../../components/badge/badge";
import { SidebarHeader } from "../../components/sidebar/sidebar-layout";
import { Wordmark } from "../../components/wordmark/wordmark";

export function AppSidebarHeader() {
  return (
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
  );
}
