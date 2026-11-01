import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { createAndDownload } from "../lib/create-and-download";

export type UseCreateExportInput = { onDone: () => void };

/** Creates the SIE export and saves its file in one toast flow, then refreshes the page. */
export function useCreateExport({ onDone }: UseCreateExportInput) {
  const t = useTranslations("finance.export");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const confirm = () =>
    run({
      action: createAndDownload,
      messages: { pending: common("saving"), success: t("created") },
      onSuccess: () => {
        onDone();
        router.refresh();
      },
    });
  return { confirm, pending };
}
