const FRONTMATTER = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/;

export type SplitFrontmatterInput = { markdown: string };
export type SplitFrontmatterOutput = { yaml: string; body: string };

/** Splits `---\n<yaml>\n---\n<body>`; null when the document has no frontmatter. */
export function splitFrontmatter({
  markdown,
}: SplitFrontmatterInput): SplitFrontmatterOutput | null {
  const match = FRONTMATTER.exec(markdown);
  if (!match) return null;
  return { yaml: match[1] ?? "", body: match[2] ?? "" };
}
