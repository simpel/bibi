import { useRouter } from "@okazi/i18n/navigation";
import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";
import type { OrgOption } from "./org-menu-items";

/** The member's organizations and switching between them (Better Auth organization client). */
export function useOrgSwitch() {
  const t = useTranslations("shell");
  const router = useRouter();
  const { data, isPending } = authClient.useListOrganizations();
  const select = async ({ id, name }: OrgOption) => {
    await authClient.organization.setActive({ organizationId: id });
    toast.success(t("switchedOrganization", { name }));
    router.refresh();
  };
  const create = () => router.push(ROUTES.selectOrganization);
  return { organizations: data ?? [], isPending, select, create };
}
