import { getCustomer } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { customerRoute } from "@/lib/routes";
import { runOperation } from "@/server/run-operation";

export type PackageOwnerProps = { customerId: string };

/** "Package for <customer>" on a customer-specific item; nothing if the customer is unreadable. */
export async function PackageOwner({ customerId }: PackageOwnerProps) {
  const t = await getTranslations("item");
  const customer = await runOperation({ operation: getCustomer, input: { id: customerId } });
  if (!customer.ok) return null;
  return (
    <Link
      href={customerRoute({ id: customerId })}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      {t("packageFor", { customer: customer.value.name })}
    </Link>
  );
}
