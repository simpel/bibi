import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { SwitchQuestion } from "./complete-step";
import type { SwitchChoice } from "./draft-lines";

export type SwitchDialogProps = {
  question: SwitchQuestion;
  count: number;
  onChoice: (input: { choice: SwitchChoice }) => void;
  onCancel: () => void;
};

/** The answers per question: another package replaces or adds; a one-off keeps or empties. */
const CHOICES = {
  TO_PACKAGE: [
    { choice: "REPLACE", key: "replace" },
    { choice: "ADD", key: "add" },
  ],
  TO_ONE_OFF: [
    { choice: "KEEP", key: "keep" },
    { choice: "EMPTY", key: "empty" },
  ],
} as const satisfies Record<
  SwitchQuestion,
  readonly { choice: SwitchChoice; key: "replace" | "add" | "keep" | "empty" }[]
>;

/**
 * Lines exist and another pick is taken (spec "Switching"): another package replaces them or adds
 * its lines; a one-off keeps them for editing or starts empty.
 */
export function SwitchDialog({ question, count, onChoice, onCancel }: SwitchDialogProps) {
  const t = useTranslations("ticketIntake.switch");
  const common = useTranslations("common");
  const toPackage = question === "TO_PACKAGE";
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{toPackage ? t("toPackage") : t("toOneOff")}</DialogTitle>
          <DialogDescription>{t("description", { count })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {CHOICES[question].map(({ choice, key }) => (
            <Button
              key={choice}
              type="button"
              variant="outline"
              onClick={() => onChoice({ choice })}
            >
              {t(key)}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {common("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
