import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bibi/ui";
import { ShieldCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/**
 * The superadmin's way into `/mothership` (ADR 0015): a card with one button at the foot of the
 * sidebar, after shadcn's sidebar-06 block; one icon with a tooltip while the sidebar is collapsed.
 * The caller renders it only for superadmins.
 */
export function PlatformAdminCard() {
  const t = useTranslations("shell");
  return (
    <>
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={t("platformAdminOpen")}>
            <Link href={ROUTES.mothership}>
              <ShieldCheckIcon />
              <span>{t("platformAdminOpen")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <PlatformAdminFullCard />
    </>
  );
}

function PlatformAdminFullCard() {
  const t = useTranslations("shell");
  return (
    <Card className="shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="gap-1 p-4 pb-3">
        <CardTitle className="text-sm">{t("platformAdminTitle")}</CardTitle>
        <CardDescription className="text-xs">{t("platformAdminDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Button asChild size="sm" className="w-full shadow-none">
          <Link href={ROUTES.mothership}>
            <ShieldCheckIcon />
            {t("platformAdminOpen")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
