"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { joinOfferAction } from "../../join-actions";
import { JOIN_PATHS } from "../../lib/join-paths";

export type JoinOfferButtonProps = {
  organizationId: string;
  name: string;
  /** Stay on the page (the list) instead of going on to it (the offer step). */
  stay?: boolean;
  variant?: "default" | "outline";
};

/** Joins a domain offer (ADR 0078), then shows every organization the user can join. */
export function JoinOfferButton({ organizationId, name, stay, variant }: JoinOfferButtonProps) {
  const t = useTranslations("welcome.join");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const join = () =>
    run({
      action: () => joinOfferAction({ input: { organizationId } }),
      messages: {
        pending: t("joining", { organization: name }),
        success: ({ value }) =>
          value === "held"
            ? t("held", { organization: name })
            : t("joined", { organization: name }),
      },
      // A held join is no membership yet: stay and let the page show the offer as it is.
      onSuccess: ({ value }) =>
        stay || value === "held" ? router.refresh() : router.push(JOIN_PATHS.organizations),
    });
  return (
    <Button
      type="button"
      variant={variant}
      className={stay ? undefined : "w-full"}
      disabled={pending}
      onClick={join}
    >
      {stay ? t("join") : t("joinOrganization", { organization: name })}
    </Button>
  );
}
