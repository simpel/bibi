import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import { SkillForm } from "./skill-form";

/** `/skills/new`: the create form. */
export async function SkillCreate() {
  const t = await getTranslations("skills");
  return (
    <div className="grid gap-6">
      <PageHeader title={t("create")} description={t("createDescription")} />
      <SkillForm />
    </div>
  );
}
