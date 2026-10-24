import type { LineExpandBundleInput } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { expandBundleAction } from "../actions";
import {
  type ExpandBundleDefaultsInput,
  type ExpandBundleFormValues,
  type ExpandBundleSchemaInput,
  expandBundleDefaults,
  expandBundleSchema,
} from "./expand-bundle-schema";
import { lineTimeZone } from "./line-time-zone";

export type UseExpandBundleFormInput = Omit<ExpandBundleDefaultsInput, "timeZone"> & {
  ticketId: string;
  zones: ExpandBundleSchemaInput["zones"];
  onDone: () => void;
};

/** The form state of `line.expandBundle`; the ticket page reloads with the new lines. */
export function useExpandBundleForm({
  ticketId,
  zones,
  onDone,
  ...defaults
}: UseExpandBundleFormInput) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const router = useRouter();
  const schema = useMemo(() => expandBundleSchema({ ticketId, zones }), [ticketId, zones]);
  const timeZone = lineTimeZone({ data: zones, itemId: defaults.itemId });
  const form = useForm<ExpandBundleFormValues, unknown, LineExpandBundleInput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: expandBundleDefaults({ ...defaults, timeZone }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => expandBundleAction({ input: values }),
    messages: { pending: common("saving"), success: t("bundleExpanded") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("startsAt", { message: t("occupied") });
    },
  });
  return { form, submit, pending };
}
