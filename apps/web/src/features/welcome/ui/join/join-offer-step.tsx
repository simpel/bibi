import type { DomainOffer } from "@bibi/core/domain-join";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { JOIN_PATHS } from "../../lib/join-paths";
import { WelcomeStepFrame } from "../welcome-step-frame";
import { JoinOfferButton } from "./join-offer-button";

/**
 * `/welcome` when the user's work domain is claimed (ADR 0076): "Join <organization>", with a
 * ghost button for another organization (an invite code) under it.
 */
export function JoinOfferStep({ offer }: { offer: DomainOffer }) {
  const t = useTranslations("welcome.join");
  return (
    <WelcomeStepFrame
      title={t("offerTitle", { organization: offer.name })}
      description={t("offerDescription", { domain: offer.domain, organization: offer.name })}
    >
      <div className="grid gap-2">
        <JoinOfferButton organizationId={offer.organizationId} name={offer.name} />
        <Button asChild variant="ghost" className="w-full">
          <Link href={JOIN_PATHS.code}>{t("different")}</Link>
        </Button>
        <Button asChild variant="link" className="w-full text-muted-foreground">
          <Link href={JOIN_PATHS.create}>{t("createInstead")}</Link>
        </Button>
      </div>
    </WelcomeStepFrame>
  );
}
