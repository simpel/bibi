import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ImportKindsButton } from "./import-kinds-button";

export type NoKindsProps = { crumbs: ReactNode; canImport: boolean };

/** No furniture library yet: one click imports the starter library, or ask an admin. */
export async function NoKinds({ crumbs, canImport }: NoKindsProps) {
  const t = await getTranslations("floorPlan");
  const action = canImport ? (
    <ImportKindsButton />
  ) : (
    <Button variant="outline" disabled>
      {t("noKinds.askAdmin")}
    </Button>
  );
  return (
    <div className="p-4 sm:p-6">
      {crumbs}
      <EmptyState
        title={t("noKinds.title")}
        description={t("noKinds.description")}
        action={action}
      />
    </div>
  );
}
