import { Link } from "@bibi/i18n/navigation";
import { DropdownMenuItem } from "@bibi/ui";
import { UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";

/** First entry of the user menu (ADR 0036): opens the profile page. */
export function ProfileMenuItem() {
  const t = useTranslations("shell");
  return (
    <DropdownMenuItem asChild>
      <Link href={ROUTES.profile}>
        <UserIcon />
        {t("profile")}
      </Link>
    </DropdownMenuItem>
  );
}
