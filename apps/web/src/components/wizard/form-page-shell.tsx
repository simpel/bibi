import type { ReactNode } from "react";
import { PageHeader } from "@/components/states/page-header";

export type FormPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/** Frame of a create or update page: header, then the form or wizard. */
export function FormPageShell({ title, description, children }: FormPageShellProps) {
  return (
    <div className="grid gap-6">
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}
