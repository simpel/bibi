import { AppError } from "../../errors/app-error";
import { fromZodError } from "../../errors/from-zod-error";
import { err, ok, type Result } from "../../errors/result";
import { type SkillContent, SkillContentSchema } from "../../features/skill/schema";
import { slugify } from "../../features/skill/slugify";
import { type FrontmatterValue, parseFrontmatter } from "./parse-frontmatter";
import { extractResourceBlocks } from "./resource-blocks";
import { splitFrontmatter } from "./split-frontmatter";

type FieldInput = { value: FrontmatterValue | undefined };

const asString = ({ value }: FieldInput): string => (typeof value === "string" ? value : "");

const asMap = ({ value }: FieldInput): Record<string, string> =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

/** Agent Skills use a space-delimited string; comma lists and YAML lists are accepted too. */
const asToolList = ({ value }: FieldInput): string[] => {
  if (Array.isArray(value)) return value;
  return asString({ value })
    .split(/[\s,]+/)
    .filter(Boolean);
};

export type ParseSkillMarkdownInput = { markdown: string };

/**
 * SKILL.md → skill content. Frontmatter `name` becomes the slug, `metadata.title` (or `title`)
 * the display name, `allowed-tools` the tool list; the body (minus resource blocks) the
 * instructions. Imported content is data: it is validated, never executed.
 */
export function parseSkillMarkdown({ markdown }: ParseSkillMarkdownInput): Result<SkillContent> {
  const split = splitFrontmatter({ markdown });
  if (!split) {
    const message = "SKILL.md must start with YAML frontmatter between --- lines";
    return err({ error: new AppError({ code: "VALIDATION", message }) });
  }
  const frontmatter = parseFrontmatter({ yaml: split.yaml });
  if (!frontmatter.ok) return frontmatter;
  const fields = frontmatter.value;
  const { body, resources } = extractResourceBlocks({ body: split.body });
  const name = asString({ value: fields.name }).trim();
  const title = asMap({ value: fields.metadata }).title ?? asString({ value: fields.title });
  const parsed = SkillContentSchema.safeParse({
    slug: slugify({ text: name }),
    name: title.trim() || name,
    description: asString({ value: fields.description }),
    instructions: body,
    allowedTools: asToolList({ value: fields["allowed-tools"] ?? fields.allowedTools }),
    resources,
  });
  return parsed.success ? ok({ value: parsed.data }) : err({ error: fromZodError({ error: parsed.error }) });
}
