"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type SkillImportInput,
  type SkillImportValues,
  skillImportDefaults,
  skillImportSchema,
} from "../skill-import-schema";

/** react-hook-form wired to core's skill import schema with localized validation messages. */
export function useImportSkillForm() {
  const resolver = zodResolver(skillImportSchema, useZodMessages());
  return useForm<SkillImportValues, unknown, SkillImportInput>({
    resolver,
    defaultValues: skillImportDefaults,
  });
}
