import type { ItemDemandDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { createItemDemandAction, updateItemDemandAction } from "../actions";
import {
  type DemandFormOutput,
  type DemandFormValues,
  demandFormDefaults,
  demandFormSchema,
  toDemandUpdate,
} from "./demand-form-schema";

export type UseDemandFormInput = {
  itemId: string;
  /** Present = edit mode, absent = create mode. */
  demand?: ItemDemandDto | undefined;
  onDone: () => void;
};

/** Demand form state; a failed save is a toast and field issues on the fields. */
export function useDemandForm({ itemId, demand, onDone }: UseDemandFormInput) {
  const t = useTranslations("itemDemand");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const form = useForm<DemandFormValues, unknown, DemandFormOutput>({
    resolver: zodResolver(demandFormSchema({ itemId, demand }), {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: demandFormDefaults({ demand }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      demand
        ? updateItemDemandAction({ input: toDemandUpdate({ demand, values }) })
        : createItemDemandAction({ input: values }),
    messages: { pending: common("saving"), success: t(demand ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
