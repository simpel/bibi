import { Button } from "@okazi/ui";
import { Link } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";

export default function NotFoundPage() {
  const t = useTranslations("errors");
  const common = useTranslations("common");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t("notFound")}</h1>
      <Button asChild>
        <Link href={ROUTES.home}>{common("back")}</Link>
      </Button>
    </main>
  );
}
