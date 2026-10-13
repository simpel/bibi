import { describe, expect, it } from "vitest";
import { parseBlocks } from "./parse-blocks";
import { parseInline } from "./parse-inline";

const strip = ({ nodes }: { nodes: unknown }): unknown =>
  JSON.parse(JSON.stringify(nodes, (key, value) => (key === "key" ? undefined : value)));

describe("parseInline", () => {
  it("parses bold, italic, code and safe links", () => {
    expect(strip({ nodes: parseInline({ text: "a **b** *c* `d` [e](https://x.se)" }) })).toEqual([
      { type: "text", text: "a " },
      { type: "bold", children: [{ type: "text", text: "b" }] },
      { type: "text", text: " " },
      { type: "italic", children: [{ type: "text", text: "c" }] },
      { type: "text", text: " " },
      { type: "code", text: "d" },
      { type: "text", text: " " },
      { type: "link", href: "https://x.se", children: [{ type: "text", text: "e" }] },
    ]);
  });

  it("gives siblings unique keys", () => {
    const keys = parseInline({ text: "a **b** *c* d" }).map((node) => node.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("never makes anchors of javascript: or protocol-relative links", () => {
    const nodes = parseInline({ text: "[x](javascript:alert(1)) [y](//evil.com)" });
    expect(nodes.some((node) => node.type === "link")).toBe(false);
  });

  it("keeps raw HTML as plain text", () => {
    expect(strip({ nodes: parseInline({ text: "<img src=x onerror=alert(1)>" }) })).toEqual([
      { type: "text", text: "<img src=x onerror=alert(1)>" },
    ]);
  });
});

describe("parseBlocks", () => {
  it("parses headings, lists, code fences and paragraphs", () => {
    const blocks = parseBlocks({
      markdown: "# Titel\n\nText rad ett\nrad två\n\n- a\n- b\n\n1. x\n2. y\n\n```\ncode\n```",
    });
    expect(blocks.map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "list",
      "list",
      "code",
    ]);
    expect(blocks[1]).toMatchObject({ children: [{ text: "Text rad ett rad två" }] });
    expect(blocks[3]).toMatchObject({ ordered: true });
    expect(blocks[4]).toMatchObject({ type: "code", text: "code" });
  });

  it("terminates on an unclosed code fence", () => {
    expect(parseBlocks({ markdown: "```\nabc" })).toMatchObject([{ type: "code", text: "abc" }]);
  });
});
