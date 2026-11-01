import { useTranslations } from "next-intl";
import { WelcomeStepFrame } from "../welcome-step-frame";
import { InviteCodeForm } from "./invite-code-form";

/** `/welcome/join`: "Join a different organization" with the code from its invitation mail. */
export function InviteCodeStep({ code }: { code: string }) {
  const t = useTranslations("welcome.join");
  return (
    <WelcomeStepFrame title={t("codeTitle")} description={t("codeDescription")}>
      <InviteCodeForm code={code} />
    </WelcomeStepFrame>
  );
}
