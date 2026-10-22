import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { OrgOption } from "./org-menu-items";

/** The member's organizations and switching between them (Better Auth organization client). */
export function useOrgSwitch() {
  const t = useTranslations("shell");
  const router = useRouter();
  const { data, isPending } = authClient.useListOrganizations();
  // The URL names the organization (ADR 0062): switching opens its pipeline.
  const select = async ({ id, name, slug }: OrgOption) => {
    await authClient.organization.setActive({ organizationId: id });
    toast.success(t("switchedOrganization", { name }));
    router.push(ROUTES.pipeline, { org: slug });
  };
  const create = () => router.push(`${ROUTES.welcome}/new`);
  return { organizations: data ?? [], isPending, select, create };
}
