import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-2 border-b pb-6">
      {typeof title === "string" ? (
        <h1 className="font-serif text-3xl font-light tracking-tight text-black dark:text-white">
          {title}
        </h1>
      ) : (
        title
      )}
      <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">{description}</p>
    </header>
  );
}
