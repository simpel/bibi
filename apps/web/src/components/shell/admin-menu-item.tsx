import { Link } from "@okazi/i18n/navigation";
import { DropdownMenuItem } from "@okazi/ui";
import { ShieldCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";

/** User-menu entry to `/admin`; rendered only for platform admins (ADR 0015). */
export function AdminMenuItem() {
  const t = useTranslations("admin");
  return (
    <DropdownMenuItem asChild>
      <Link href={ROUTES.admin}>
        <ShieldCheckIcon />
        {t("navLabel")}
      </Link>
    </DropdownMenuItem>
  );
}
