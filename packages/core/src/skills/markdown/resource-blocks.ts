import type { SkillResource } from "../../features/skill/schema";

const BLOCK = /<!-- okazi:resource name="([^"\n]+)" -->\n([\s\S]*?)\n?<!-- \/okazi:resource -->/g;

export type ExtractResourceBlocksInput = { body: string };
export type ExtractResourceBlocksOutput = { body: string; resources: SkillResource[] };

/** Pulls `<!-- okazi:resource name="x" -->…<!-- /okazi:resource -->` blocks out of a SKILL.md body. */
export function extractResourceBlocks({
  body,
}: ExtractResourceBlocksInput): ExtractResourceBlocksOutput {
  const resources: SkillResource[] = [];
  const stripped = body.replace(BLOCK, (_match, name: string, content: string) => {
    resources.push({ name, content });
    return "";
  });
  return { body: stripped.trim(), resources };
}

export type RenderResourceBlocksInput = { resources: readonly SkillResource[] };

export function renderResourceBlocks({ resources }: RenderResourceBlocksInput): string {
  return resources
    .map(({ name, content }) => `<!-- okazi:resource name="${name}" -->\n${content}\n<!-- /okazi:resource -->`)
    .join("\n\n");
}
