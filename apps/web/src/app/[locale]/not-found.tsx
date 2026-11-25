import { Button } from "@bibi/ui";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatusPage } from "@/components/states/status-page";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for not-found.
export default function NotFoundPage() {
  const t = useTranslations("errors.page");
  return (
    <StatusPage
      code={t("notFound.code")}
      title={t("notFound.title")}
      description={t("notFound.description")}
      actions={
        <>
          <Button asChild>
            <Link href={ROUTES.app}>
              {t("home")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={ROUTES.support}>
              <LifeBuoy aria-hidden />
              {t("help")}
            </Link>
          </Button>
        </>
      }
    />
  );
}
