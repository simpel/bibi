"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { RoleCreateInput, RoleDto } from "@okazi/core";
import { RoleCreateInputSchema } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodMessageMap } from "@/lib/zod-error-map";

export type UseRoleFormInput = { role?: RoleDto | undefined };

/** react-hook-form wired to core's role schema with localized validation messages. */
export function useRoleForm({ role }: UseRoleFormInput) {
  const t = useTranslations("errors");
  const resolver = zodResolver(RoleCreateInputSchema, {
    error: zodMessageMap({ translate: (key) => t(key) }),
  });
  return useForm<RoleCreateInput, unknown, RoleCreateInput>({
    resolver,
    defaultValues: { name: role?.name ?? "", permissions: role?.permissions ?? {} },
  });
}
