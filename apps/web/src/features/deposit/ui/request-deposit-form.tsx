import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { CopyField } from "@/components/copy-field";
import { TextField } from "@/components/form/text-field";
import type { DepositSuggestionView } from "./request-deposit-button";
import { useRequestDepositForm } from "./use-request-deposit-form";

export type RequestDepositFormProps = {
  ticketId: string;
  suggestion: DepositSuggestionView;
  onDone: () => void;
};

/** Amount (prefilled from the deposit rule) and text of the deposit to request. */
export function RequestDepositForm({ ticketId, suggestion, onDone }: RequestDepositFormProps) {
  const t = useTranslations("deposit.request");
  const common = useTranslations("common");
  const { basis, defaultAmount, total } = suggestion;
  const { form, submit, pending, paymentUrl } = useRequestDepositForm({
    ticketId,
    defaultAmount,
    amountRequired: basis === "NONE",
  });
  if (paymentUrl) return <DepositLink url={paymentUrl} onDone={onDone} />;
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField
          form={form}
          name="amountMinor"
          label={t("amount")}
          type="number"
          step="0.01"
          required={basis === "NONE"}
        />
        <p className="-mt-2 text-xs text-muted-foreground">{t(`hint.${basis}`, { total })}</p>
        <TextField form={form} name="description" label={t("text")} required />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

type DepositLinkProps = { url: string; onDone: () => void };

function DepositLink({ url, onDone }: DepositLinkProps) {
  const t = useTranslations("deposit.request");
  const payment = useTranslations("payment");
  const common = useTranslations("common");
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t("linkReady")}</p>
      <CopyField
        id="deposit-payment-link"
        label={t("link")}
        value={url}
        messages={{ copy: t("copy"), copied: t("copied"), copyFailed: t("copyFailed") }}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {common("close")}
        </Button>
        <Button asChild>
          <a href={url} target="_blank" rel="noreferrer">
            {payment("openLink")}
          </a>
        </Button>
      </DialogFooter>
    </div>
  );
}
