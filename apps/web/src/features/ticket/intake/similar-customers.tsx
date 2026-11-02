import type { SimilarCustomer } from "@bibi/core";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { CustomerOption } from "../../customer/actions";

export type SimilarCustomersProps = {
  name: string;
  matches: SimilarCustomer[];
  onUse: (input: { customer: CustomerOption }) => void;
  onNew: () => void;
};

/** "“<text>” looks like <customer>": use an existing customer or go on with a new one. */
export function SimilarCustomers({ name, matches, onUse, onNew }: SimilarCustomersProps) {
  const t = useTranslations("ticketIntake.who");
  return (
    <div className="grid gap-3 rounded-md border border-warning/40 bg-warning/10 p-3">
      {matches.map(({ customer }) => (
        <div key={customer.id} className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">{t("looksLike", { name, customer: customer.name })}</p>
          <Button
            type="button"
            size="sm"
            onClick={() => onUse({ customer: { id: customer.id, name: customer.name } })}
          >
            {t("useCustomer", { customer: customer.name })}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={onNew}
      >
        {t("notSimilar")}
      </Button>
    </div>
  );
}
