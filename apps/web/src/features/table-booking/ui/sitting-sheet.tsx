"use client";

import {
  Button,
  Form,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { saveSittingAction } from "../actions";
import {
  NEW_SITTING,
  type SittingFormOutput,
  type SittingFormValues,
  sittingFormSchema,
} from "../lib/sitting-form";
import type { LayoutOption } from "../lib/sitting-row";
import { SittingFields } from "./sitting-fields";

export type SittingSheetProps = {
  roomItemId: string;
  layouts: readonly LayoutOption[];
  /** The sitting being edited; none = a new one. */
  sitting?: { id: string; values: SittingFormValues } | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormProps = Omit<SittingSheetProps, "open">;

function SittingForm({ roomItemId, layouts, sitting, onOpenChange }: FormProps) {
  const t = useTranslations("tableBooking.sittings");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const first = layouts[0]?.id ?? "";
  const form = useForm<SittingFormValues, unknown, SittingFormOutput>({
    mode: "onBlur",
    resolver: zodResolver(sittingFormSchema, {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: sitting?.values ?? { ...NEW_SITTING, layoutId: first },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => saveSittingAction({ roomItemId, id: sitting?.id, values }),
    messages: { pending: common("saving"), success: t(sitting ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onOpenChange(false);
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-6 px-4 pb-4">
        <SittingFields form={form} layouts={layouts} />
        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {sitting ? common("save") : t("create")}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

/** Create or edit one sitting; the form is remounted on every open, so it starts from the row. */
export function SittingSheet({ open, onOpenChange, ...rest }: SittingSheetProps) {
  const t = useTranslations("tableBooking.sittings");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{rest.sitting ? t("edit") : t("create")}</SheetTitle>
          <SheetDescription>{t("sheetDescription")}</SheetDescription>
        </SheetHeader>
        {open ? (
          <SittingForm key={rest.sitting?.id ?? "new"} {...rest} onOpenChange={onOpenChange} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
