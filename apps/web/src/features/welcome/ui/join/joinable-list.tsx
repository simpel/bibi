import type { JoinableOrganizations } from "@bibi/auth";
import { Card, CardContent } from "@bibi/ui";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { WelcomeStepFrame } from "../welcome-step-frame";
import { AcceptInvitationButton } from "./accept-invitation-button";
import { JoinOfferButton } from "./join-offer-button";
import { PrimaryOrganizationPicker } from "./primary-organization-picker";

function Row({ name, detail, action }: { name: string; detail: string; action: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="grid">
        <span className="font-medium">{name}</span>
        <span className="text-sm text-muted-foreground">{detail}</span>
      </div>
      {action}
    </li>
  );
}

type JoinableProps = { joinable: JoinableOrganizations };

/** One row per organization: joined (ticked), offered by domain, or invited. */
function JoinableRows({ joinable }: JoinableProps) {
  const t = useTranslations("welcome.join");
  const { offers, invitations, memberships } = joinable;
  const joined = (
    <span className="flex items-center gap-1 text-sm text-muted-foreground">
      <CheckIcon aria-hidden className="size-4" />
      {t("isMember")}
    </span>
  );
  return (
    <ul className="grid gap-2">
      {memberships.map((m) => (
        <Row key={m.organizationId} name={m.name} detail={t("member")} action={joined} />
      ))}
      {offers.map((o) => (
        <Row
          key={o.organizationId}
          name={o.name}
          detail={t("byDomain", { domain: o.domain })}
          action={
            <JoinOfferButton
              organizationId={o.organizationId}
              name={o.name}
              stay
              variant="outline"
            />
          }
        />
      ))}
      {invitations.map((i) => (
        <Row
          key={i.id}
          name={i.name}
          detail={t("invited")}
          action={<AcceptInvitationButton invitationId={i.id} name={i.name} />}
        />
      ))}
    </ul>
  );
}

/**
 * `/welcome/organizations` (ADR 0076): the organizations the user belongs to (ticked), the ones
 * they can join by domain or invitation, then the primary organization and Continue.
 */
export function JoinableList({ joinable }: JoinableProps) {
  const t = useTranslations("welcome.join");
  const { offers, invitations, memberships } = joinable;
  const empty = offers.length + invitations.length + memberships.length === 0;
  return (
    <WelcomeStepFrame title={t("listTitle")} description={t("listDescription")}>
      <Card>
        <CardContent className="grid gap-2 pt-6">
          <JoinableRows joinable={joinable} />
          {empty ? <p className="text-sm text-muted-foreground">{t("nothing")}</p> : null}
        </CardContent>
      </Card>
      <PrimaryOrganizationPicker memberships={memberships} />
    </WelcomeStepFrame>
  );
}
