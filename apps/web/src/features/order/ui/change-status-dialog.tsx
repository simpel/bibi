import type { OrderDto } from "@bibi/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { useChangeStatusForm } from "./use-change-status-form";

export type ChangeStatusDialogProps = {
  order: OrderDto;
  /** The statuses the organization allows from the order's current status. */
  targets: readonly NamedOption[];
  /** The status picked in the status menu; the form starts on it. */
  statusId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ChangeStatusFormProps = Pick<ChangeStatusDialogProps, "order" | "targets" | "statusId"> & {
  onDone: () => void;
};

function ChangeStatusForm({ order, targets, statusId, onDone }: ChangeStatusFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("order");
  const { form, submit, pending } = useChangeStatusForm({ order, statusId, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="statusId"
          label={t("fields.newStatus")}
          options={targets}
        />
        <TextField form={form} name="reason" label={t("fields.statusReason")} multiline />
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

/** Move an order along one of the organization's transitions (`order.changeStatus`). */
export function ChangeStatusDialog({
  order,
  targets,
  statusId,
  open,
  onOpenChange,
}: ChangeStatusDialogProps) {
  const t = useTranslations("order");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("changeStatus")}</DialogTitle>
          <DialogDescription>{t("changeStatusDescription")}</DialogDescription>
        </DialogHeader>
        <ChangeStatusForm
          key={statusId}
          order={order}
          targets={targets}
          statusId={statusId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
