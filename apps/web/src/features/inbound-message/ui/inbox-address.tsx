import { listInboundEndpoints } from "@bibi/core";
import { ADMIN_ROLE } from "@bibi/core/schemas";
import { Alert, AlertDescription, Button } from "@bibi/ui";
import { AlertCircleIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

export type InboxAddressProps = {
  isAdmin?: boolean;
};

/** The organization's inbox mail address, to forward the venue's booking mail to (ADR 0085). */
export async function InboxAddress({ isAdmin: passedIsAdmin }: InboxAddressProps = {}) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("inbox"),
    passedIsAdmin === undefined ? getCallerAbilities() : null,
    runOperation({
      operation: listInboundEndpoints,
      input: { channel: "EMAIL" },
    }),
  ]);
  const isAdmin =
    passedIsAdmin ??
    (abilities?.role === ADMIN_ROLE ||
      (abilities ? can({ abilities, permission: "configuration:write" }) : false));
  const address = result.ok ? result.value.items.find((item) => item.active)?.address : null;

  if (address) {
    return (
      <p className="text-sm text-muted-foreground">
        {t.rich("address", {
          address,
          code: (chunks) => <code className="text-foreground">{chunks}</code>,
        })}
      </p>
    );
  }

  if (!isAdmin) return null;

  return (
    <Alert>
      <AlertCircleIcon className="size-4" />
      <div className="col-start-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AlertDescription className="text-foreground">{t("noAddress")}</AlertDescription>
        <Button asChild size="sm" variant="outline" className="shrink-0 self-start sm:self-center">
          <Link href={ROUTES.adminGeneral}>{t("configureAddress")}</Link>
        </Button>
      </div>
    </Alert>
  );
}
