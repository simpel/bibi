import { type InquiryDto, listInquiries } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import {
  type MineFilter,
  MineFilterLinks,
  minePageInput,
} from "@/features/assignment/ui/mine-filter";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadInquiryData } from "../load-inquiry-data";
import { CreateInquiryButton } from "./create-inquiry-button";
import { InquiryTable } from "./inquiry-table";

export type InquiryListProps = {
  locale: Locale;
  cursor?: string | undefined;
  /** Only inquiries the signed-in member is assigned to or follows (ADR 0034). */
  mine?: MineFilter | undefined;
};

const PAGE_SIZE = 20;

const GoToTypes = ({ label }: { label: string }) => (
  <Button asChild variant="outline">
    <Link href={ROUTES.settingsTypes}>{label}</Link>
  </Button>
);

/** Inquiries page body: header with create, the table (or an empty state) and pagination. */
export async function InquiryList({ locale, cursor, mine }: InquiryListProps) {
  const t = await getTranslations("inquiry");
  const { inquiryWrite, userId } = await getCallerAbilities();
  const [data, result] = await Promise.all([
    loadInquiryData(),
    runOperation({
      operation: listInquiries,
      input: minePageInput({ limit: PAGE_SIZE, cursor, mine, userId }),
    }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const noTypes = data.value.types.length === 0;
  const create = inquiryWrite && !noTypes ? <CreateInquiryButton data={data.value} /> : undefined;
  const page: { items: InquiryDto[]; nextCursor: string | null } = result.value;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
      <MineFilterLinks pathname={ROUTES.inquiries} mine={mine} />
      {page.items.length === 0 && !cursor && !mine ? (
        <EmptyState
          title={t("empty")}
          description={noTypes ? t("noTypes") : t("emptyDescription")}
          action={noTypes ? <GoToTypes label={t("goToTypes")} /> : create}
        />
      ) : (
        <>
          <InquiryTable inquiries={page.items} data={data.value} />
          <CursorPagination
            pathname={ROUTES.inquiries}
            cursor={cursor}
            nextCursor={page.nextCursor}
            query={mine ? { mine } : {}}
          />
        </>
      )}
    </div>
  );
}
