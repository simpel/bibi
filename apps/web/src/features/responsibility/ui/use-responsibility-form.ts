import type { ResponsibilityCreateInput, ResponsibilityDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type ResponsibilityFormValues,
  responsibilityFormDefaults,
  responsibilityFormSchema,
} from "./responsibility-form-schema";

export type UseResponsibilityFormInput = { responsibility?: ResponsibilityDto | undefined };

/** react-hook-form wired to core's responsibility schema with localized messages. */
export function useResponsibilityForm({ responsibility }: UseResponsibilityFormInput) {
  return useForm<ResponsibilityFormValues, unknown, ResponsibilityCreateInput>({
    resolver: zodResolver(responsibilityFormSchema, useZodMessages()),
    defaultValues: responsibilityFormDefaults({ responsibility }),
  });
}
