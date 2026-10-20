import { listItems } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadItemFormData } from "../load-item-form-data";
import { ItemTable } from "./item-table";
import { SaveBundleButton } from "./save-bundle-button";

export type CustomerBundlesSectionProps = { locale: Locale; customerId: string };

/**
 * The customer's own bundles (customer-specific items, ADR 0021) and "Save as bundle", which
 * offers only BUNDLE types and parts from the catalog or the customer's own bundles.
 */
export async function CustomerBundlesSection(props: CustomerBundlesSectionProps) {
  const abilities = await getCallerAbilities();
  if (!can({ abilities, permission: "item:read" })) return null;
  return <BundlesBody {...props} abilities={abilities} />;
}

async function BundlesBody({
  locale,
  customerId,
  abilities,
}: CustomerBundlesSectionProps & { abilities: CallerAbilities }) {
  const t = await getTranslations("item");
  const [bundles, data] = await Promise.all([
    runOperation({ operation: listItems, input: { customerId, onlyCustomer: true, limit: 100 } }),
    loadItemFormData({ customerId }),
  ]);
  if (!bundles.ok) {
    return <ErrorState errorKey={handleLoadError({ error: bundles.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const types = data.value.types.filter((type) => type.capabilities.includes("BUNDLE"));
  const { items } = bundles.value;
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("bundles")}</h2>
        {can({ abilities, permission: "item:write" }) && types.length > 0 ? (
          <SaveBundleButton customerId={customerId} data={{ ...data.value, types }} />
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {types.length === 0 ? t("bundlesNoTypes") : t("bundlesEmpty")}
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
