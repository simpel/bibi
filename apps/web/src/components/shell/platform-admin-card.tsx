import { Link } from "@bibi/i18n/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { ShieldCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";

/**
 * The superadmin's way into `/mothership` (ADR 0015): a card with one button at the foot of the
 * sidebar, after shadcn's sidebar-06 block. The caller renders it only for superadmins.
 */
export function PlatformAdminCard() {
  const t = useTranslations("shell");
  return (
    <Card className="shadow-none">
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
