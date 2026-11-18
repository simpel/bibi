import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { canPermission } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { ShellAccess } from "./shell-types";

export type HeaderCreateOrderButtonProps = { access: ShellAccess };

/**
 * The top bar's primary action: the order intake (ADR 0081). Icon only below `sm`, so the
 * breadcrumb keeps its room. Hidden without `order:write`.
 */
export function HeaderCreateOrderButton({ access }: HeaderCreateOrderButtonProps) {
  const t = useTranslations("nav");
  if (!canPermission({ permissions: access.permissions, permission: "order:write" })) return null;
  return (
    <Button asChild size="sm" className="max-sm:size-8 max-sm:p-0">
      <Link href={ROUTES.orderNew} aria-label={t("newOrder")}>
        <PlusIcon />
        <span className="max-sm:hidden">{t("newOrder")}</span>
      </Link>
    </Button>
  );
}
