import { describe, expect, it } from "vitest";
import {
  execute,
  exportSkill,
  importSkill,
  parseSkillMarkdown,
  renderSkillMarkdown,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";

const SKILL_MD = `---
name: quote-for-customer
description: >
  Compile a quote
  for a conference.
allowed-tools:
  - venue_get
  - room_list
metadata:
  title: 'Quote for customer'
---

# Quote

1. Read the venue with \`venue_get\`.

<!-- bibi:resource name="template.md" -->
Hello {customer},
<!-- /bibi:resource -->
`;

describe("SKILL.md import/export", () => {
  it("parses frontmatter variants, resources and the body", () => {
    const parsed = unwrap({ result: parseSkillMarkdown({ markdown: SKILL_MD }) });
    expect(parsed).toEqual({
      slug: "quote-for-customer",
      name: "Quote for customer",
      description: "Compile a quote for a conference.",
      instructions: "# Quote\n\n1. Read the venue with `venue_get`.",
      allowedTools: ["venue_get", "room_list"],
      resources: [{ name: "template.md", content: "Hello {customer}," }],
    });
    const inline = unwrap({
      result: parseSkillMarkdown({
        markdown:
          '---\nname: A b\ndescription: "Line 1\\nLine 2" # x\nallowed-tools: search, room_get\n---\nBody',
      }),
    });
    expect(inline).toMatchObject({
      slug: "a-b",
      name: "A b",
      allowedTools: ["search", "room_get"],
    });
    expect(inline.description).toBe("Line 1\nLine 2");
  });

  it("round-trips render → parse exactly", () => {
    const content = {
      slug: "x-y",
      name: 'Name with "quotes" and: colon',
      description: "Description – åäö\nwith line break",
      instructions: "# Heading\n\nText",
      allowedTools: ["search"],
      resources: [{ name: "a.txt", content: "line 1\n\nline 3\n" }],
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
    const context = testContext({ access: "write" });
    const skill = unwrap({
      result: await execute({ operation: importSkill, input: { markdown: SKILL_MD }, context }),
    });
    expect(skill).toMatchObject({
      scope: "PERSONAL",
      status: "DRAFT",
      source: "import",
      version: 1,
    });
    const exported = unwrap({
      result: await execute({ operation: exportSkill, input: { id: skill.id }, context }),
    });
    expect(exported.filename).toBe("quote-for-customer/SKILL.md");
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
