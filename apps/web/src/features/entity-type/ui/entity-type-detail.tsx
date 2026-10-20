import { getEntityType } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { Badge } from "@okazi/ui";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { FieldSection } from "@/features/field-definition/ui/field-section";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ArchiveEntityTypeButton } from "./archive-entity-type-button";
import { EntityTypeForm } from "./entity-type-form";

export type EntityTypeDetailProps = { locale: Locale; id: string };

/** Type detail page: rename, behaviours (one form, saved together), fields and archive. */
export async function EntityTypeDetail({ locale, id }: EntityTypeDetailProps) {
  const t = await getTranslations("entityType");
  const common = await getTranslations("common");
  const abilities = await getCallerAbilities();
  const result = await runOperation({ operation: getEntityType, input: { id } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const entityType = result.value;
  const archive = can({ abilities, permission: "configuration:delete" }) ? (
    <ArchiveEntityTypeButton entityType={entityType} redirectToList />
  ) : undefined;
  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <Link
          href={ROUTES.settingsTypes}
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
          <h2 className="text-xl font-semibold">{t("edit")}</h2>
          <EntityTypeForm entityType={entityType} />
        </section>
      ) : null}
      <FieldSection entityType={entityType} />
    </div>
  );
}
