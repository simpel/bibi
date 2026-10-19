import { getCustomer } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { customerRoute } from "@/lib/routes";
import { runOperation } from "@/server/run-operation";

export type PackageOwnerProps = { customerId: string };

/** "Package for <customer>" on a customer-specific item; the name reads "Hidden" without `customer:view`. */
export async function PackageOwner({ customerId }: PackageOwnerProps) {
  const t = await getTranslations("item");
  const customer = await runOperation({ operation: getCustomer, input: { id: customerId } });
  if (!customer.ok && customer.error.code !== "FORBIDDEN") return null;
  const common = await getTranslations("common");
  const name = customer.ok ? customer.value.name : common("hidden");
  return (
    <Link
      href={customerRoute({ id: customerId })}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      {t("packageFor", { customer: name })}
    </Link>
  );
}
