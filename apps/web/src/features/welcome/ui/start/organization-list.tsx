"use client";

import { Button, Skeleton } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** The user's organizations; each opens `/:slug`, where the proxy makes it active (ADR 0062). */
export function OrganizationList() {
  const t = useTranslations("welcome.start");
  const { data: organizations, isPending } = authClient.useListOrganizations();
  if (isPending) return <Skeleton className="h-10 w-full" />;
  if (!organizations || organizations.length === 0) return null;
  return (
    <div className="grid gap-2">
      <h2 className="text-sm font-medium">{t("yourOrganizations")}</h2>
      <ul className="grid gap-2">
        {organizations.map((org) => (
          <li key={org.id}>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href={ROUTES.home} org={org.slug}>
                {org.name}
                <span className="text-xs text-muted-foreground">{t("open")}</span>
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
