"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button, Skeleton } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { afterOrganization } from "./after-organization";
import { useAuthFormAction } from "./use-auth-form-action";

type Choice = { id: string; name: string };

/** Lists the user's organizations; picking one makes it the active organization. */
export function OrganizationPicker() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { data: organizations, isPending } = authClient.useListOrganizations();
  const { pending, run } = useAuthFormAction();
  if (isPending) return <Skeleton className="h-10 w-full" />;
  if (!organizations || organizations.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noOrganizations")}</p>;
  }
  const choose = ({ id, name }: Choice) =>
    run({
      call: () => authClient.organization.setActive({ organizationId: id }),
      messages: {
        pending: t("switchingOrganization"),
        success: t("organizationSelected", { organization: name }),
      },
      onSuccess: () => afterOrganization({ router }),
    });
  return (
    <div className="grid gap-2">
      <h2 className="text-sm font-medium">{t("yourOrganizations")}</h2>
      <ul className="grid gap-2">
        {organizations.map((org) => (
          <li key={org.id}>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled={pending}
              onClick={() => choose({ id: org.id, name: org.name })}
            >
              {org.name}
              <span className="text-xs text-muted-foreground">{t("continue")}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
