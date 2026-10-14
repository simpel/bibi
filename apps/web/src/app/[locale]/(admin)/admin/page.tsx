import { resolveLocale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";

type AdminPageProps = { params: Promise<{ locale: string }> };

export default async function AdminPage({ params }: AdminPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  redirect({ href: ROUTES.adminLogs, locale });
}
