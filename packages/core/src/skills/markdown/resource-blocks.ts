import type { SkillResource } from "../../features/skill/schema";

const BLOCK = /<!-- bibi:resource name="([^"\n]+)" -->\n([\s\S]*?)\n?<!-- \/bibi:resource -->/g;

export type ExtractResourceBlocksInput = { body: string };
export type ExtractResourceBlocksOutput = { body: string; resources: SkillResource[] };

/** Pulls `<!-- bibi:resource name="x" -->…<!-- /bibi:resource -->` blocks out of a SKILL.md body. */
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
    .map(
      ({ name, content }) =>
        `<!-- bibi:resource name="${name}" -->\n${content}\n<!-- /bibi:resource -->`,
    )
    .join("\n\n");
}
