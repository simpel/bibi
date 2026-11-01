import type { DevInvitationCode } from "@bibi/auth";
import { useTranslations } from "next-intl";
import { WelcomeStepFrame } from "../welcome-step-frame";
import { DevInviteCodes } from "./dev-invite-codes";
import { InviteCodeForm } from "./invite-code-form";

/** `/welcome/join`: "Join a different organization" with the code from its invitation mail. */
export type InviteCodeStepProps = {
  code: string;
  /** Pending codes for this email, only in development (ADR 0076). */
  devCodes: DevInvitationCode[];
};

export function InviteCodeStep({ code, devCodes }: InviteCodeStepProps) {
  const t = useTranslations("welcome.join");
  return (
    <WelcomeStepFrame title={t("codeTitle")} description={t("codeDescription")}>
      <InviteCodeForm code={code} />
      <DevInviteCodes codes={devCodes} />
    </WelcomeStepFrame>
  );
}
