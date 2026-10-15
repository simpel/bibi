"use client";

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
import { BanIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
import { useCancelSeriesForm } from "./use-cancel-series-form";

type CancelSeriesFormProps = { id: string; onDone: () => void };

function CancelSeriesForm({ id, onDone }: CancelSeriesFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("bookingSeries");
  const { form, submit, pending } = useCancelSeriesForm({ id, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="reason" label={t("fields.cancelReason")} multiline required />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {t("cancelSeries")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Opens the dialog that cancels every upcoming occurrence (`bookingSeries.cancel`). */
export function CancelSeriesButton({ id }: { id: string }) {
  const t = useTranslations("bookingSeries");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <BanIcon />
        {t("cancelSeries")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("cancelSeries")}</DialogTitle>
            <DialogDescription>{t("cancelSeriesDescription")}</DialogDescription>
          </DialogHeader>
          <CancelSeriesForm id={id} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
