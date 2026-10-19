import { type EntityTypeDto, listEntityTypes } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateEntityTypeButton } from "./create-entity-type-button";
import { EntityTypeTable } from "./entity-type-table";
import { ImportConfigurationTemplateButton } from "./import-configuration-template-button";

export type EntityTypeListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 100;
const CREATE = "configuration:create";

function groupByBase({ types }: { types: EntityTypeDto[] }) {
  const groups = new Map<EntityTypeDto["base"], EntityTypeDto[]>();
  for (const type of types) groups.set(type.base, [...(groups.get(type.base) ?? []), type]);
  return [...groups.entries()];
}

/** Import the starter pack next to create: types that already exist are skipped. */
function HeaderActions({ create }: { create: ReactNode }) {
  return (
    <>
      <ImportConfigurationTemplateButton />
      {create}
    </>
  );
}

/** Types page body: header with create, one table per base entity, cursor pagination. */
export async function EntityTypeList({ locale, cursor }: EntityTypeListProps) {
  const t = await getTranslations("entityType");
  const abilities = await getCallerAbilities();
  const result = await runOperation({
    operation: listEntityTypes,
    input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
  });
  const create = can({ abilities, permission: CREATE }) ? <CreateEntityTypeButton /> : undefined;
  const actions = create && <HeaderActions create={create} />;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const { items, nextCursor } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 && !cursor ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        groupByBase({ types: items }).map(([base, types]) => (
          <section key={base} className="grid gap-2">
            <h2 className="text-lg font-semibold">{t(`bases.${base}`)}</h2>
            <EntityTypeTable types={types} />
          </section>
        ))
      )}
      <CursorPagination pathname={ROUTES.settingsTypes} cursor={cursor} nextCursor={nextCursor} />
    </div>
  );
}
