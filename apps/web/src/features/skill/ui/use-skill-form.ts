"use client";

import type { SkillDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import { type SkillFormValues, skillFormDefaults, skillFormSchema } from "../skill-form-schema";
import type { SkillCreateInput } from "../skill-types";

export type UseSkillFormInput = { skill?: SkillDto | undefined };

/** react-hook-form wired to core's skill schema with localized validation messages. */
export function useSkillForm({ skill }: UseSkillFormInput) {
  const resolver = zodResolver(skillFormSchema, useZodMessages());
  return useForm<SkillFormValues, unknown, SkillCreateInput>({
    resolver,
    defaultValues: skillFormDefaults({ skill }),
  });
}
