import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@bibi/ui";
import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { AdminNav } from "./admin-nav";

export type AdminSidebarProps = { email: string };

/** Collapsible (icon rail) sidebar of the admin area; a sheet on mobile. */
export function AdminSidebar({ email }: AdminSidebarProps) {
  const t = useTranslations("admin");
  return (
    <Sidebar
      collapsible="icon"
      mobileTitle={t("sidebarTitle")}
      mobileDescription={t("sidebarDescription")}
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 font-semibold">
          <ShieldCheckIcon className="size-4 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">{t("title")}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <AdminNav />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("backToApp")}>
              <Link href={ROUTES.home}>
                <ArrowLeftIcon />
                <span>{t("backToApp")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="truncate px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {email}
        </p>
      </SidebarFooter>
      <SidebarRail label={t("toggleSidebar")} />
    </Sidebar>
  );
}
