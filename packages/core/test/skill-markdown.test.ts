import { describe, expect, it } from "vitest";
import { execute, exportSkill, importSkill, parseSkillMarkdown, renderSkillMarkdown } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";

const SKILL_MD = `---
name: offert-till-kund
description: >
  Sammanställ en offert
  för en konferens.
allowed-tools:
  - venue_get
  - room_list
metadata:
  title: 'Offert till kund'
---

# Offert

1. Läs anläggningen med \`venue_get\`.

<!-- okazi:resource name="mall.md" -->
Hej {kund},
<!-- /okazi:resource -->
`;

describe("SKILL.md import/export", () => {
  it("parses frontmatter variants, resources and the body", () => {
    const parsed = unwrap({ result: parseSkillMarkdown({ markdown: SKILL_MD }) });
    expect(parsed).toEqual({
      slug: "offert-till-kund",
      name: "Offert till kund",
      description: "Sammanställ en offert för en konferens.",
      instructions: "# Offert\n\n1. Läs anläggningen med `venue_get`.",
      allowedTools: ["venue_get", "room_list"],
      resources: [{ name: "mall.md", content: "Hej {kund}," }],
    });
    const inline = unwrap({
      result: parseSkillMarkdown({
        markdown: '---\nname: A b\ndescription: "Rad 1\\nRad 2" # x\nallowed-tools: search, room_get\n---\nBody',
      }),
    });
    expect(inline).toMatchObject({ slug: "a-b", name: "A b", allowedTools: ["search", "room_get"] });
    expect(inline.description).toBe("Rad 1\nRad 2");
  });

  it("round-trips render → parse exactly", () => {
    const content = {
      slug: "x-y",
      name: 'Namn med "citat" och: kolon',
      description: "Beskrivning – åäö\nmed radbrytning",
      instructions: "# Rubrik\n\nText",
      allowedTools: ["search"],
      resources: [{ name: "a.txt", content: "rad 1\n\nrad 3\n" }],
    };
    const markdown = renderSkillMarkdown({ content, version: 3 });
    expect(unwrap({ result: parseSkillMarkdown({ markdown }) })).toEqual(content);
  });

  it("rejects documents without valid frontmatter or required fields", () => {
    for (const markdown of ["# no frontmatter", "---\nname: x\n---\nbody", "---\n  bad\n---\nb"]) {
      expect(errorCode({ result: parseSkillMarkdown({ markdown }) })).toBe("VALIDATION");
    }
  });

  it("imports as a DRAFT and exports the same SKILL.md content", async () => {
    const context = testContext({ roles: ["member"] });
    const skill = unwrap({
      result: await execute({ operation: importSkill, input: { markdown: SKILL_MD }, context }),
    });
    expect(skill).toMatchObject({ scope: "PERSONAL", status: "DRAFT", source: "import", version: 1 });
    const exported = unwrap({ result: await execute({ operation: exportSkill, input: { id: skill.id }, context }) });
    expect(exported.filename).toBe("offert-till-kund/SKILL.md");
    expect(exported.markdown).toContain('version: "1"');
    const reparsed = unwrap({ result: parseSkillMarkdown({ markdown: exported.markdown }) });
    expect(reparsed).toEqual(unwrap({ result: parseSkillMarkdown({ markdown: SKILL_MD }) }));
    const orgImport = await execute({
      operation: importSkill,
      input: { markdown: SKILL_MD, scope: "ORGANIZATION" },
      context,
    });
    expect(errorCode({ result: orgImport })).toBe("FORBIDDEN");
  });
});
