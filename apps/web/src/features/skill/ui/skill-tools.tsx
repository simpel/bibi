import { Badge } from "@okazi/ui";
import { getTranslations } from "next-intl/server";

export type SkillToolsProps = { tools: string[] };

/** The MCP tools the skill is limited to (none = no extra limit). */
export async function SkillTools({ tools }: SkillToolsProps) {
  const t = await getTranslations("skills");
  return (
    <section className="grid gap-2">
      <h2 className="text-lg font-semibold">{t("sections.allowedTools")}</h2>
      {tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noToolLimits")}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {tools.map((tool) => (
            <Badge key={tool} variant="secondary" className="font-mono">
              {tool}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
