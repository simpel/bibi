"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button, Skeleton } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ErrorBanner } from "@/components/states/error-banner";
import { authClient } from "@/lib/auth-client";
import { afterOrganization } from "./after-organization";
import { useAuthSubmit } from "./use-auth-submit";

/** Lists the user's organizations; picking one makes it the active organization. */
export function OrganizationPicker() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { data: organizations, isPending } = authClient.useListOrganizations();
  const { pending, errorKey, run } = useAuthSubmit();
  if (isPending) return <Skeleton className="h-10 w-full" />;
  if (!organizations || organizations.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noOrganizations")}</p>;
  }
  const choose = ({ organizationId }: { organizationId: string }) =>
    run({
      call: () => authClient.organization.setActive({ organizationId }),
      onSuccess: () => afterOrganization({ router }),
    });
  return (
    <div className="grid gap-2">
      <h2 className="text-sm font-medium">{t("yourOrganizations")}</h2>
      <ErrorBanner errorKey={errorKey} />
      <ul className="grid gap-2">
        {organizations.map((org) => (
          <li key={org.id}>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled={pending}
              onClick={() => choose({ organizationId: org.id })}
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
