import type { InquiryDto } from "@okazi/core";
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
import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { OwnerFormValues } from "./owner-form-schema";
import { useAssignOwnerForm, useQualifyForm } from "./use-owner-forms";

export type OwnerDialogProps = {
  /** `qualify` moves the inquiry to QUALIFIED; `assign` only changes the salesperson. */
  mode: "qualify" | "assign";
  inquiry: InquiryDto;
  members: readonly NamedOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type OwnerFormProps = Omit<OwnerDialogProps, "open" | "onOpenChange"> & { onDone: () => void };

type OwnerFormBodyProps<O> = Pick<OwnerFormProps, "mode" | "members" | "onDone"> & {
  form: UseFormReturn<OwnerFormValues, unknown, O>;
  submit: FormEventHandler;
  pending: boolean;
};

function OwnerFormBody<O>({ mode, members, onDone, form, submit, pending }: OwnerFormBodyProps<O>) {
  const common = useTranslations("common");
  const t = useTranslations("inquiry");
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="salesOwnerId"
          label={t("fields.salesOwner")}
          options={members}
          {...(mode === "assign" ? { noneLabel: t("noOwner") } : {})}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {mode === "qualify" ? t("qualify") : common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function QualifyForm(props: OwnerFormProps) {
  return <OwnerFormBody {...props} {...useQualifyForm(props)} />;
}

function AssignOwnerForm(props: OwnerFormProps) {
  return <OwnerFormBody {...props} {...useAssignOwnerForm(props)} />;
}

/** Qualify the inquiry or change its salesperson; both pick a member. */
export function OwnerDialog({ open, onOpenChange, ...props }: OwnerDialogProps) {
  const t = useTranslations("inquiry");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{props.mode === "qualify" ? t("qualify") : t("assign")}</DialogTitle>
          <DialogDescription>
            {props.mode === "qualify" ? t("qualifyDescription") : t("assignDescription")}
          </DialogDescription>
        </DialogHeader>
        {props.mode === "qualify" ? (
          <QualifyForm {...props} onDone={() => onOpenChange(false)} />
        ) : (
          <AssignOwnerForm {...props} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
