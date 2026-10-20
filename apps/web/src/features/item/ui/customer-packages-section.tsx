import { listItems } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadItemFormData } from "../load-item-form-data";
import { ItemTable } from "./item-table";
import { SavePackageButton } from "./save-package-button";

export type CustomerPackagesSectionProps = { locale: Locale; customerId: string };

/**
 * The customer's own packages (customer-specific items, ADR 0021) and "Save as package", which
 * offers only COMPOSABLE types and parts from the catalog or the customer's own packages.
 */
export async function CustomerPackagesSection(props: CustomerPackagesSectionProps) {
  const abilities = await getCallerAbilities();
  if (!can({ abilities, permission: "item:read" })) return null;
  return <PackagesBody {...props} abilities={abilities} />;
}

async function PackagesBody({
  locale,
  customerId,
  abilities,
}: CustomerPackagesSectionProps & { abilities: CallerAbilities }) {
  const t = await getTranslations("item");
  const [packages, data] = await Promise.all([
    runOperation({ operation: listItems, input: { customerId, onlyCustomer: true, limit: 100 } }),
    loadItemFormData({ customerId }),
  ]);
  if (!packages.ok) {
    return <ErrorState errorKey={handleLoadError({ error: packages.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const types = data.value.types.filter((type) => type.behaviours.includes("COMPOSABLE"));
  const { items } = packages.value;
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("packages")}</h2>
        {can({ abilities, permission: "item:write" }) && types.length > 0 ? (
          <SavePackageButton customerId={customerId} data={{ ...data.value, types }} />
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {types.length === 0 ? t("packagesNoTypes") : t("packagesEmpty")}
        </p>
      ) : (
        <ItemTable
          items={items}
          types={data.value.types}
          venues={data.value.venues}
          venuesHidden={data.value.venuesHidden}
          locale={locale}
        />
      )}
    </section>
  );
}
