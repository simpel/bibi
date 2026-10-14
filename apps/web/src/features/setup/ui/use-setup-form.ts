import { zodResolver } from "@hookform/resolvers/zod";
import type { SetupCreateInput, SetupDto } from "@okazi/core";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import { type SetupFormValues, setupFormDefaults, setupFormSchema } from "./setup-form-schema";

export type UseSetupFormInput = { setup?: SetupDto | undefined };

/** react-hook-form wired to core's setup schema with localized validation messages. */
export function useSetupForm({ setup }: UseSetupFormInput) {
  return useForm<SetupFormValues, unknown, SetupCreateInput>({
    resolver: zodResolver(setupFormSchema, useZodMessages()),
    defaultValues: setupFormDefaults({ setup }),
  });
}
