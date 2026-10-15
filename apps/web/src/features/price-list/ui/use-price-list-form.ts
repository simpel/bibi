import { zodResolver } from "@hookform/resolvers/zod";
import type { PriceListDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createPriceListAction, updatePriceListAction } from "../actions";
import {
  type PriceListFormOutput,
  type PriceListFormValues,
  priceListFormDefaults,
  priceListFormSchema,
} from "./price-list-form-schema";

export type UsePriceListFormInput = { priceList?: PriceListDto | undefined; onDone: () => void };

type SaveInput = { priceList: PriceListDto | undefined; values: PriceListFormOutput };

const save = ({ priceList, values }: SaveInput) =>
  priceList
    ? updatePriceListAction({ input: { id: priceList.id, ...values } })
    : createPriceListAction({ input: values });

/** Create (no `priceList`) or edit form state, wired to core's schema and the toast flow. */
export function usePriceListForm({ priceList, onDone }: UsePriceListFormInput) {
  const t = useTranslations("priceList");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<PriceListFormValues, unknown, PriceListFormOutput>({
    resolver: zodResolver(priceListFormSchema, useZodMessages()),
    defaultValues: priceListFormDefaults({ priceList }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ priceList, values }),
    messages: { pending: common("saving"), success: t(priceList ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
