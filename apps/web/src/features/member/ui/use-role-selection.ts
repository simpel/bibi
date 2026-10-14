"use client";

import type { MemberDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useActionSubmit } from "@/lib/use-action-submit";

export type UseRoleSelectionInput = { member: MemberDto; onDone: () => void };

/** Selected role names plus the save state of the assignment action. */
export function useRoleSelection({ member, onDone }: UseRoleSelectionInput) {
  const t = useTranslations("member");
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(member.roles);
  const submit = useActionSubmit<MemberDto>({
    onSuccess: () => {
      toast.success(t("updated"));
      onDone();
      router.refresh();
    },
  });
  const toggle = ({ name, checked }: { name: string; checked: boolean }) =>
    setSelected((current) => (checked ? [...current, name] : current.filter((n) => n !== name)));
  return { selected, toggle, ...submit };
}
