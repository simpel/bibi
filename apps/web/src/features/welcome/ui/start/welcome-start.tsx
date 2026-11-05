"use client";

import type { JoinableInvitation, JoinedOrganization } from "@bibi/auth";
import type { DomainOffer } from "@bibi/core/domain-join";
import { Avatar, Button, Card, CardContent, Separator } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { JOIN_PATHS } from "../../lib/join-paths";
import { AcceptInvitationButton } from "../join/accept-invitation-button";
import { InviteCodeForm } from "../join/invite-code-form";
import { JoinOfferButton } from "../join/join-offer-button";
import { WelcomeStepFrame } from "../welcome-step-frame";
import { OrganizationList } from "./organization-list";

export type WelcomeStartProps = {
  email: string;
  invitations?: JoinableInvitation[];
  offers?: DomainOffer[];
  memberships?: JoinedOrganization[];
  targetInvitationId?: string;
  initialCode?: string;
};

/**
 * `/welcome`: join an assigned organization, create a new one, or redeem an invite code (ADR 0078).
 */
export function WelcomeStart({
  invitations = [],
  offers = [],
  memberships = [],
  targetInvitationId,
  initialCode = "",
}: WelcomeStartProps) {
  const t = useTranslations("welcome.start");
  const tJoin = useTranslations("welcome.join");
  const tCommon = useTranslations("common");
  const [mode, setMode] = useState<"default" | "code">(initialCode ? "code" : "default");

  const activeInvitation = invitations.find((i) => i.id === targetInvitationId) ?? invitations[0];
  const activeOffer = offers[0];
  const activeMembership = memberships.find((m) => m.primary) ?? memberships[0];

  const hasAssignedOrg = Boolean(activeInvitation || activeOffer || activeMembership);
  const orgName = activeInvitation?.name ?? activeOffer?.name ?? activeMembership?.name ?? "";
  const orgLogo = activeInvitation?.logo ?? activeOffer?.logo ?? activeMembership?.logo ?? null;

  const logoNode =
    hasAssignedOrg && mode !== "code" ? (
      <Avatar
        name={orgName}
        photoUrl={orgLogo}
        size="lg"
        className="size-16 border shadow-xs text-xl font-semibold"
      />
    ) : undefined;

  const frameTitle =
    mode === "code"
      ? t("haveCode")
      : activeInvitation
        ? activeInvitation.inviterName
          ? t("invitedTitle", {
              inviter: activeInvitation.inviterName,
              organization: activeInvitation.name,
            })
          : t("invitedTitleNoInviter", { organization: activeInvitation.name })
        : activeOffer
          ? tJoin("offerTitle", { organization: activeOffer.name })
          : activeMembership
            ? tJoin("continue", { organization: activeMembership.name })
            : t("title");

  const frameDescription =
    mode === "code"
      ? tJoin("codeDescription")
      : activeOffer
        ? tJoin("offerDescription", {
            domain: activeOffer.domain,
            organization: activeOffer.name,
          })
        : activeMembership
          ? undefined
          : activeInvitation
            ? undefined
            : t("description");

  return (
    <WelcomeStepFrame logo={logoNode} title={frameTitle} description={frameDescription}>
      <Card className="w-full">
        <CardContent className="grid gap-4 pt-6">
          {mode === "code" ? (
            <>
              {/* Primary: Invite code form */}
              <InviteCodeForm code={initialCode} />

              {/* Separator with centered "or" */}
              <OrSeparator label={tCommon("or")} />

              {/* Secondary buttons */}
              <div className="grid gap-2">
                {hasAssignedOrg ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setMode("default")}
                  >
                    {activeMembership
                      ? tJoin("continue", { organization: orgName })
                      : tJoin("joinOrganization", { organization: orgName })}
                  </Button>
                ) : null}
                <Button
                  asChild={hasAssignedOrg}
                  type={hasAssignedOrg ? undefined : "button"}
                  variant="secondary"
                  className="w-full"
                  onClick={hasAssignedOrg ? undefined : () => setMode("default")}
                >
                  {hasAssignedOrg ? (
                    <Link href={JOIN_PATHS.create}>{t("create")}</Link>
                  ) : (
                    t("create")
                  )}
                </Button>
              </div>
            </>
          ) : hasAssignedOrg ? (
            <>
              {/* Primary: Big join/continue org button */}
              {activeInvitation ? (
                <AcceptInvitationButton
                  invitationId={activeInvitation.id}
                  name={activeInvitation.name}
                  size="lg"
                />
              ) : activeOffer ? (
                <JoinOfferButton
                  organizationId={activeOffer.organizationId}
                  name={activeOffer.name}
                  size="lg"
                />
              ) : activeMembership ? (
                <Button asChild size="lg" className="w-full">
                  <Link href={ROUTES.home} org={activeMembership.slug}>
                    {tJoin("continue", { organization: activeMembership.name })}
                  </Link>
                </Button>
              ) : null}

              {/* Separator with centered "or" */}
              <OrSeparator label={tCommon("or")} />

              {/* 2 secondary buttons */}
              <div className="grid gap-2">
                <Button asChild variant="secondary" className="w-full">
                  <Link href={JOIN_PATHS.create}>{t("create")}</Link>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setMode("code")}
                >
                  {t("haveCode")}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Primary: Create organization button */}
              <Button asChild size="lg" className="w-full">
                <Link href={JOIN_PATHS.create}>{t("create")}</Link>
              </Button>

              {/* Separator with centered "or" */}
              <OrSeparator label={tCommon("or")} />

              {/* Secondary button: I have an invite code */}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setMode("code")}
              >
                {t("haveCode")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {memberships.length > 1 ? (
        <div className="grid gap-2">
          <OrganizationList />
        </div>
      ) : null}
    </WelcomeStepFrame>
  );
}

function OrSeparator({ label }: { label: string }) {
  return (
    <div className="relative my-2 text-center text-xs uppercase text-muted-foreground">
      <div className="absolute inset-0 flex items-center">
        <Separator className="w-full" />
      </div>
      <span className="relative z-10 bg-card px-2 font-medium">{label}</span>
    </div>
  );
}
