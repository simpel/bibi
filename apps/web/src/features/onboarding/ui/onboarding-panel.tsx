import { Card, CardContent } from "@okazi/ui";
import { useTranslations } from "next-intl";

/** Panel slot for the first version; empty until the assistant has a draft. */
export function OnboardingPanel() {
  const t = useTranslations("onboarding");
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="max-w-sm border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {t("panelEmpty")}
        </CardContent>
      </Card>
    </div>
  );
}
