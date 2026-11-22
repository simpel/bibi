"use client";

import { Button } from "@bibi/ui";
import { EyeIcon, EyeOffIcon } from "lucide-react";
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
 * have no work in. Says what a click does ("Follow", "Unfollow"), with an eye to match.
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
  return (
    <Button variant="outline" onClick={toggle} disabled={pending} aria-pressed={following}>
      {/* An eye, never the bell (that is notifications). */}
      {following ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
      {following ? t("unfollow") : t("follow")}
    </Button>
  );
}
