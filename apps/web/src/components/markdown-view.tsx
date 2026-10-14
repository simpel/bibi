"use client";

import { useMemo } from "react";
import { parseBlocks } from "@/lib/markdown/parse-blocks";
import type { Block } from "@/lib/markdown/types";
import { MarkdownInline } from "./markdown-inline";

export type MarkdownViewProps = { markdown: string };

type BlockOf<T extends Block["type"]> = { block: Extract<Block, { type: T }> };

const HEADINGS = { 1: "h3", 2: "h4", 3: "h5" } as const;
const HEADING_CLASS = {
  1: "text-base font-semibold",
  2: "text-sm font-semibold",
  3: "text-sm font-medium",
};

function HeadingBlock({ block }: BlockOf<"heading">) {
  const Tag = HEADINGS[block.level];
  return (
    <Tag className={HEADING_CLASS[block.level]}>
      <MarkdownInline nodes={block.children} />
    </Tag>
  );
}

function ListBlock({ block }: BlockOf<"list">) {
  const Tag = block.ordered ? "ol" : "ul";
  return (
    <Tag className={block.ordered ? "list-decimal pl-5" : "list-disc pl-5"}>
      {block.items.map((item) => (
        <li key={item.key}>
          <MarkdownInline nodes={item.children} />
        </li>
      ))}
    </Tag>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} />;
    case "list":
      return <ListBlock block={block} />;
    case "code":
      return (
        <pre className="overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs">
          {block.text}
        </pre>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 pl-3 text-muted-foreground">
          <MarkdownInline nodes={block.children} />
        </blockquote>
      );
    case "paragraph":
      return (
        <p>
          <MarkdownInline nodes={block.children} />
        </p>
      );
  }
}

/** Safe markdown (no raw HTML, no `dangerouslySetInnerHTML`) for assistant and skill text. */
export function MarkdownView({ markdown }: MarkdownViewProps) {
  const blocks = useMemo(() => parseBlocks({ markdown }), [markdown]);
  return (
    <div data-slot="markdown" className="grid gap-2 text-sm leading-relaxed break-words">
      {blocks.map((block) => (
        <BlockView key={block.key} block={block} />
      ))}
    </div>
  );
}
