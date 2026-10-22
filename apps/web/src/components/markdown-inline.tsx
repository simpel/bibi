import { Link } from "@bibi/i18n/navigation";
import type { ReactNode } from "react";
import type { Inline } from "@/lib/markdown/types";

export type MarkdownInlineProps = { nodes: Inline[] };

type NodeInput = { node: Inline };

function renderNode({ node }: NodeInput): ReactNode {
  switch (node.type) {
    case "text":
      return node.text;
    case "bold":
      return <strong className="font-semibold">{renderNodes({ nodes: node.children })}</strong>;
    case "italic":
      return <em>{renderNodes({ nodes: node.children })}</em>;
    case "code":
      return (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{node.text}</code>
      );
    case "link":
      if (node.href.startsWith("/")) {
        return (
          <Link href={node.href} className="text-primary underline underline-offset-2">
            {renderNodes({ nodes: node.children })}
          </Link>
        );
      }
      return (
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2"
        >
          {renderNodes({ nodes: node.children })}
        </a>
      );
  }
}

function renderNodes({ nodes }: MarkdownInlineProps): ReactNode[] {
  return nodes.map((node) => <span key={node.key}>{renderNode({ node })}</span>);
}

/** Inline markdown nodes as React elements (text is always escaped by React). */
export function MarkdownInline({ nodes }: MarkdownInlineProps) {
  return <>{renderNodes({ nodes })}</>;
}
