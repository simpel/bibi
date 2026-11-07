import type { Locale } from "@bibi/i18n";
import { Badge } from "@bibi/ui";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadEntityType } from "@/features/entity-type/load-entity-type";
import { FieldSection } from "@/features/field-definition/ui/field-section";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { ArchiveEntityTypeButton } from "./archive-entity-type-button";
import { EntityTypeForm } from "./entity-type-form";

export type EntityTypeDetailProps = { locale: Locale; id: string };

/** Type detail page: rename, capabilities (one form, saved together), fields and archive. */
export async function EntityTypeDetail({ locale, id }: EntityTypeDetailProps) {
  const [t, common, abilities, result] = await Promise.all([
    getTranslations("entityType"),
    getTranslations("common"),
    getCallerAbilities(),
    loadEntityType({ id }),
  ]);
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const entityType = result.value;
  const archive = can({ abilities, permission: "configuration:delete" }) ? (
    <ArchiveEntityTypeButton entityType={entityType} redirectToList />
  ) : undefined;
  return (
    <div className="grid gap-6">
      <CrumbName href={`/admin/types/${id}`} name={entityType.name} />
      <div className="grid gap-4">
        <Link
          href={ROUTES.adminTypes}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {common("back")}
        </Link>
        <PageHeader title={entityType.name} actions={archive} />
        <Badge variant="outline" className="w-fit">
          {t(`bases.${entityType.base}`)}
        </Badge>
      </div>
      {can({ abilities, permission: "configuration:write" }) ? (
        <section className="grid max-w-xl gap-4">
          <h2 className="text-xl">{t("edit")}</h2>
          <EntityTypeForm entityType={entityType} />
        </section>
      ) : null}
      <FieldSection entityType={entityType} />
    </div>
  );
}
