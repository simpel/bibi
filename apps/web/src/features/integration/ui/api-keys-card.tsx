import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Settings → Integrations used to be the API keys page: this keeps the way there (ADR 0087). */
export async function ApiKeysCard() {
  const t = await getTranslations("integration.apiKeysCard");
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-muted-foreground">
        <p>{t("description")}</p>
        <Link href={ROUTES.adminApiKeys} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
