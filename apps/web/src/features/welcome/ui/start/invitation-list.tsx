"use client";

import { Button, Skeleton } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useAuthFormAction } from "@/features/auth/ui/use-auth-form-action";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { type UserInvitation, useUserInvitations } from "./use-user-invitations";

const ROLE_KEYS = ["member", "manager", "admin"] as const;
type RoleKey = (typeof ROLE_KEYS)[number];
const roleKey = (role: string): RoleKey | "unknown" =>
  (ROLE_KEYS as readonly string[]).includes(role) ? (role as RoleKey) : "unknown";

/** Invitations to accept. Accepting opens `/`, which redirects to the joined organization. */
export function InvitationList({ email }: { email: string }) {
  const t = useTranslations("welcome.start");
  const { invitations } = useUserInvitations();
  if (!invitations) return <Skeleton className="h-10 w-full" />;
  return (
    <div className="grid gap-2">
      <h2 className="text-sm font-medium">{t("invitations")}</h2>
      {invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noInvitations", { email })}</p>
      ) : (
        <ul className="grid gap-2">
          {invitations.map((invitation) => (
            <InvitationRow key={invitation.id} invitation={invitation} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InvitationRow({ invitation }: { invitation: UserInvitation }) {
  const t = useTranslations("welcome.start");
  const role = useTranslations("role");
  const auth = useTranslations("auth");
  const router = useRouter();
  const { pending, run } = useAuthFormAction();
  const accept = () =>
    run({
      call: () => authClient.organization.acceptInvitation({ invitationId: invitation.id }),
      messages: {
        pending: t("accepting", { organization: invitation.organizationName }),
        success: auth("invitationAccepted"),
      },
      onSuccess: () => {
        router.replace(ROUTES.home);
        router.refresh();
      },
    });
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="grid">
        <span className="font-medium">{invitation.organizationName}</span>
        <span className="text-sm text-muted-foreground">
          {t("invitedAs", { role: role(roleKey(invitation.role)) })}
        </span>
      </div>
      <Button type="button" disabled={pending} onClick={accept}>
        {t("accept")}
      </Button>
    </li>
  );
}
