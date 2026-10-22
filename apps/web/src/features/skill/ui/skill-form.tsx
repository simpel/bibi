"use client";

import type { SkillDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { skillRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
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
  const save = ({ values }: { values: SkillCreateInput }) => {
    if (!skill) return createSkillAction({ input: values });
    const { scope: _scope, ...content } = values;
    return updateSkillAction({ input: { id: skill.id, ...content } });
  };
  const { submit, pending } = useFormAction({
    form,
    action: save,
    messages: { pending: common("saving"), success: t(skill ? "updated" : "created") },
    onSuccess: ({ value }) => {
      router.push(skillRoute({ id: value.id }));
      router.refresh();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-2xl gap-4">
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
    </Form>
  );
}
