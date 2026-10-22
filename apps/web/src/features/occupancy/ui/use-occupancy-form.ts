import type { OccupancyDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { createOccupancyAction, updateOccupancyAction } from "../actions";
import {
  type OccupancyFormOutput,
  type OccupancyFormValues,
  occupancyFormDefaults,
  occupancyFormSchema,
  toOccupancyUpdate,
} from "./occupancy-form-schema";

export type UseOccupancyFormInput = {
  itemId: string;
  /** Present = edit mode, absent = create mode. */
  occupancy?: OccupancyDto | undefined;
  onDone: () => void;
};

/** Block form state; an overlap (CONFLICT) is also shown on the start field. */
export function useOccupancyForm({ itemId, occupancy, onDone }: UseOccupancyFormInput) {
  const t = useTranslations("occupancy");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const form = useForm<OccupancyFormValues, unknown, OccupancyFormOutput>({
    resolver: zodResolver(occupancyFormSchema({ itemId }), {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: occupancyFormDefaults({ occupancy }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      occupancy
        ? updateOccupancyAction({ input: toOccupancyUpdate({ occupancy, values }) })
        : createOccupancyAction({ input: values }),
    messages: { pending: common("saving"), success: t(occupancy ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("startsAt", { message: t("overlap") });
    },
  });
  return { form, submit, pending };
}
