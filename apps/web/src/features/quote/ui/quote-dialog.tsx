import type { QuoteDto } from "@okazi/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { NamedOption } from "@/components/form/named-option";
import { TextField } from "@/components/form/text-field";
import type { QuoteFormTarget } from "./quote-form-schema";
import { QuoteLineRows } from "./quote-line-rows";
import { useQuoteForm } from "./use-quote-form";

type QuoteFormProps = {
  target: QuoteFormTarget;
  quote?: QuoteDto;
  items: readonly NamedOption[];
  onDone: () => void;
};

function QuoteForm({ target, quote, items, onDone }: QuoteFormProps) {
  const t = useTranslations("quote.fields");
  const common = useTranslations("common");
  const { form, submit, pending } = useQuoteForm({ target, onDone, ...(quote ? { quote } : {}) });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="validUntil" label={t("validUntil")} type="date" />
        <TextField form={form} name="terms" label={t("terms")} multiline />
        <QuoteLineRows form={form} items={items} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export type QuoteDialogProps = Omit<QuoteFormProps, "onDone"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Create a quote for an inquiry, or edit a draft: validity, terms and order lines. */
export function QuoteDialog({ open, onOpenChange, ...props }: QuoteDialogProps) {
  const t = useTranslations("quote");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{props.quote ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        {open ? <QuoteForm {...props} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
