import type { SkillResource } from "@okazi/core";
import { Card } from "@okazi/ui";
import { getTranslations } from "next-intl/server";

export type SkillResourcesProps = { resources: SkillResource[] };

/** The skill's named text resources (content shown as plain text). */
export async function SkillResources({ resources }: SkillResourcesProps) {
  const t = await getTranslations("skills");
  if (resources.length === 0) return null;
  return (
    <section className="grid gap-2">
      <h2 className="text-lg font-semibold">{t("sections.resources")}</h2>
      {resources.map((resource) => (
        <Card key={resource.name} className="overflow-hidden shadow-none">
          <p className="border-b bg-muted/50 px-4 py-2 font-mono text-xs">{resource.name}</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs">
            {resource.content}
          </pre>
        </Card>
      ))}
    </section>
  );
}
