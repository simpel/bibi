import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { JOIN_PATHS } from "../../lib/join-paths";
import { WelcomeStepFrame } from "../welcome-step-frame";
import { InvitationList } from "./invitation-list";
import { OrganizationList } from "./organization-list";

/** `/welcome`: join through an invitation, open an organization, or create a new one. */
export function WelcomeStart({ email }: { email: string }) {
  const t = useTranslations("welcome.start");
  return (
    <WelcomeStepFrame title={t("title")} description={t("description")} width="wide">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="grid gap-6 pt-6">
            <InvitationList email={email} />
            <Button asChild variant="ghost" className="w-full">
              <Link href={JOIN_PATHS.code}>{t("haveCode")}</Link>
            </Button>
            <OrganizationList />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("createTitle")}</CardTitle>
            <CardDescription>{t("createDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={JOIN_PATHS.create}>{t("create")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </WelcomeStepFrame>
  );
}
