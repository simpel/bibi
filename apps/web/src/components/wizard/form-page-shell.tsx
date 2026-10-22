import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";

export type FormPageShellProps = {
  backHref: string;
  title: string;
  description: string;
  children: ReactNode;
};

/** Frame of a create or update page: back link, header, then the form or wizard. */
export async function FormPageShell({
  backHref,
  title,
  description,
  children,
}: FormPageShellProps) {
  const common = await getTranslations("common");
  return (
    <div className="grid gap-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}
