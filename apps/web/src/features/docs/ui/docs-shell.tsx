import {
  Separator,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@bibi/ui";
import { BookOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { DocsNav } from "./docs-nav";

export type DocsShellProps = { children: ReactNode };

/** Public docs layout: same sidebar primitives as the app and admin, no session needed. */
export function DocsShell({ children }: DocsShellProps) {
  const t = useTranslations("docs");
  return (
    <SidebarProvider>
      <Sidebar mobileTitle={t("title")} mobileDescription={t("description")}>
        <SidebarHeader>
          <Link href="/docs" className="flex items-center gap-2 px-2 py-1.5 font-semibold">
            <BookOpenIcon className="size-4 shrink-0" />
            <span className="truncate">{t("title")}</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <DocsNav />
        </SidebarContent>
        <SidebarRail label={t("toggleSidebar")} />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger label={t("toggleSidebar")} />
          <Separator orientation="vertical" className="h-4" />
          <span className="flex-1 text-sm font-medium">{t("title")}</span>
          <Link href={ROUTES.login} className="text-sm text-muted-foreground hover:text-foreground">
            {t("signIn")}
          </Link>
        </header>
        <div className="min-w-0 flex-1 p-4 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
