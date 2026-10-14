"use client";

import type { SkillDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ErrorBanner } from "@/components/states/error-banner";
import { skillRoute } from "@/lib/routes";
import { useActionSubmit } from "@/lib/use-action-submit";
import { createSkillAction, updateSkillAction } from "../actions";
import type { SkillCreateInput } from "../skill-types";
import { SkillFormFields } from "./skill-form-fields";
import { useSkillForm } from "./use-skill-form";

export type SkillFormProps = { skill?: SkillDto | undefined };

/** Create (no `skill`) or edit form; saves through the skill server actions, then opens it. */
export function SkillForm({ skill }: SkillFormProps) {
  const t = useTranslations("skills");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useSkillForm({ skill });
  const { pending, errorKey, run } = useActionSubmit<SkillDto>({
    onSuccess: (saved) => {
      toast.success(t(skill ? "updated" : "created"));
      router.push(skillRoute({ id: saved.id }));
      router.refresh();
    },
  });
  const save = ({ values }: { values: SkillCreateInput }) => {
    if (!skill) return createSkillAction({ input: values });
    const { scope: _scope, ...content } = values;
    return updateSkillAction({ input: { id: skill.id, ...content } });
  };
  const onSubmit = form.handleSubmit((values) => run({ action: () => save({ values }) }));
  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-2xl gap-4">
      <ErrorBanner errorKey={errorKey} />
      <SkillFormFields form={form} editing={skill !== undefined} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {common("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {common("save")}
        </Button>
      </div>
    </form>
  );
}
