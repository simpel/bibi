import type { AccountingExportRangeInput } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { createAndDownload } from "../lib/create-and-download";

export type UseCreateExportInput = { onDone: () => void };

/** Creates the SIE export of a range and saves its file in one toast flow, then refreshes. */
export function useCreateExport({ onDone }: UseCreateExportInput) {
  const t = useTranslations("finance.export");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const confirm = ({ range }: { range: AccountingExportRangeInput }) =>
    run({
      action: () => createAndDownload({ range }),
      messages: { pending: common("saving"), success: t("created") },
      onSuccess: () => {
        onDone();
        router.refresh();
      },
    });
  return { confirm, pending };
}
