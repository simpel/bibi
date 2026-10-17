import type { ReactNode } from "react";
import { MarkdownView } from "@/components/markdown-view";

export type DocArticleProps = {
  title: string;
  lead: string;
  markdown?: string;
  children?: ReactNode;
};

/** A docs page: title, lead paragraph and markdown body (from i18n, rendered without raw HTML). */
export function DocArticle({ title, lead, markdown, children }: DocArticleProps) {
  return (
    <article className="mx-auto grid max-w-3xl gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-lg text-muted-foreground">{lead}</p>
      </header>
      {markdown && <MarkdownView markdown={markdown} variant="document" />}
      {children}
    </article>
  );
}
