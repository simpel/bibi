import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { MATRIX_RESOURCES, type PermissionSetValue } from "../permission-model";

export type PermissionSummaryProps = { permissions: PermissionSetValue; all?: boolean };

/** Compact "venue: write" badges (highest action per resource); `all` = every permission. */
export function PermissionSummary({ permissions, all = false }: PermissionSummaryProps) {
  const t = useTranslations("role");
  if (all) return <Badge variant="secondary">{t("allPermissions")}</Badge>;
  const entries = MATRIX_RESOURCES.flatMap((resource) => {
    const top = permissions[resource]?.at(-1);
    return top ? [{ resource, top }] : [];
  });
  if (entries.length === 0) return <span className="text-muted-foreground">–</span>;
  return (
    <ul className="flex flex-wrap gap-1">
      {entries.map(({ resource, top }) => (
        <li key={resource}>
          <Badge variant="secondary">
            {t(`resources.${resource}`)}: {t(`actions.${top}`)}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
