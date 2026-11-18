"use client";

import { Button } from "@bibi/ui";
import { BellIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { followAction, unfollowAction } from "../actions";
import type { AssignSubject } from "./assign-form-schema";

export type FollowButtonProps = {
  subject: AssignSubject;
  /** The signed-in member. */
  userId: string;
  following: boolean;
};

/**
 * Follow or unfollow as the signed-in member: what anyone does to keep up with something they
 * have no work in. An icon button as tall as its neighbours; the bell is filled while following.
 */
export function FollowButton({ subject, userId, following }: FollowButtonProps) {
  const t = useTranslations("assignment");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const toggle = () => {
    const input = { ...subject, userId };
    run({
      action: () => (following ? unfollowAction({ input }) : followAction({ input })),
      messages: { pending: common("saving"), success: following ? t("unfollowed") : t("followed") },
      onSuccess: () => router.refresh(),
    });
  };
  const label = following ? t("unfollow") : t("follow");
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      aria-label={label}
      title={label}
    >
      <BellIcon aria-hidden className={following ? "fill-current" : undefined} />
    </Button>
  );
}
