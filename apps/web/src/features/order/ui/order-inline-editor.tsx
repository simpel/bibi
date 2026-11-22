"use client";

import type { OrderDto } from "@bibi/core";
import { Button, Form, Spinner } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Suspense, use } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { TypeFields } from "@/components/typed-fields/type-fields";
import {
  BuyerFields,
  ContactFields,
  HeadcountFields,
  MoneyAndNoteFields,
  PeriodFields,
} from "./order-core-fields";
import type { OrderFormData } from "./order-form-data";
import type { OrderEditGroup } from "./order-form-schema";
import { useOrderEdit } from "./use-order-edit";

export type OrderInlineEditorProps = {
  order: OrderDto;
  /** The order's form data, read by the page without waiting for it (ADR 0097); null: failed. */
  data: Promise<OrderFormData | null>;
  groups: readonly OrderEditGroup[];
};

type EditorProps = Omit<OrderInlineEditorProps, "data"> & { data: OrderFormData };

/** The fields of the edited groups with Save and Cancel. */
function Editor({ order, data, groups }: EditorProps) {
  const common = useTranslations("common");
  const { form, submit, pending, type, close } = useOrderEdit({ order, data, groups });
  const shows = new Set<OrderEditGroup>(groups);
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {shows.has("contact") ? <ContactFields form={form} data={data} /> : null}
        {shows.has("period") ? <PeriodFields form={form} /> : null}
        {shows.has("headcount") ? <HeadcountFields form={form} /> : null}
        {shows.has("buyer") ? <BuyerFields form={form} /> : null}
        {shows.has("money") ? <MoneyAndNoteFields form={form} /> : null}
        {shows.has("fields") && type ? (
          <TypeFields control={form.control} type={type} data={data} />
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={pending}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function Loaded({ data, ...props }: OrderInlineEditorProps) {
  const loaded = use(data);
  if (!loaded) return <InlineLoadError errorKey={null} />;
  return <Editor {...props} data={loaded} />;
}

/** Edits part of an order in place (a fact's popover, a section's form), sending only that part. */
export function OrderInlineEditor(props: OrderInlineEditorProps) {
  const common = useTranslations("common");
  return (
    <Suspense fallback={<Spinner label={common("loading")} className="mx-auto" />}>
      <Loaded {...props} />
    </Suspense>
  );
}
