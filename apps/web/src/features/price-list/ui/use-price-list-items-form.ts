import type { PriceListDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { setPriceListItemsAction } from "../actions";
import {
  type PriceListItemsFormOutput,
  type PriceListItemsFormValues,
  priceListItemsDefaults,
  priceListItemsFormSchema,
} from "./price-list-items-form-schema";

export type UsePriceListItemsFormInput = { priceList: PriceListDto; onDone: () => void };

/** Item prices form state; core's issues (e.g. a general discount is set) land on `items`. */
export function usePriceListItemsForm({ priceList, onDone }: UsePriceListItemsFormInput) {
  const t = useTranslations("priceList.items");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<PriceListItemsFormValues, unknown, PriceListItemsFormOutput>({
    resolver: zodResolver(priceListItemsFormSchema({ id: priceList.id }), useZodMessages()),
    defaultValues: priceListItemsDefaults({ priceList }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setPriceListItemsAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
