"use client";

import { useMemo } from "react";
import { parseBlocks } from "@/lib/markdown/parse-blocks";
import type { Block } from "@/lib/markdown/types";
import { MarkdownInline } from "./markdown-inline";

/** `compact` for chat and cards, `document` for long-form pages such as the public docs. */
export type MarkdownVariant = "compact" | "document";

export type MarkdownViewProps = { markdown: string; variant?: MarkdownVariant };

type BlockOf<T extends Block["type"]> = { block: Extract<Block, { type: T }> };

const HEADINGS = { 1: "h3", 2: "h4", 3: "h5" } as const;
const DOCUMENT_HEADINGS = { 1: "h2", 2: "h3", 3: "h4" } as const;

const HEADING_CLASS: Record<MarkdownVariant, Record<1 | 2 | 3, string>> = {
  compact: { 1: "text-base font-semibold", 2: "text-sm font-semibold", 3: "text-sm font-medium" },
  document: {
    1: "mt-6 scroll-mt-20 text-xl font-semibold tracking-tight",
    2: "mt-4 scroll-mt-20 text-lg font-semibold tracking-tight",
    3: "mt-2 text-base font-semibold",
  },
};

const CONTAINER_CLASS: Record<MarkdownVariant, string> = {
  compact: "grid gap-2 text-sm leading-relaxed break-words",
  document: "grid gap-4 text-[0.95rem] leading-7 break-words",
};

function HeadingBlock({ block, variant }: BlockOf<"heading"> & { variant: MarkdownVariant }) {
  const Tag = (variant === "document" ? DOCUMENT_HEADINGS : HEADINGS)[block.level];
  return (
    <Tag className={HEADING_CLASS[variant][block.level]}>
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

function BlockView({ block, variant }: { block: Block; variant: MarkdownVariant }) {
  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} variant={variant} />;
    case "list":
      return <ListBlock block={block} />;
    case "code":
      return (
        <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-5">
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
export function MarkdownView({ markdown, variant = "compact" }: MarkdownViewProps) {
  const blocks = useMemo(() => parseBlocks({ markdown }), [markdown]);
  return (
    <div data-slot="markdown" className={CONTAINER_CLASS[variant]}>
      {blocks.map((block) => (
        <BlockView key={block.key} block={block} variant={variant} />
      ))}
    </div>
  );
}
