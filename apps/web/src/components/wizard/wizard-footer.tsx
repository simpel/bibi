import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";

export type WizardFooterProps = {
  first: boolean;
  last: boolean;
  pending: boolean;
  /** False while the last step cannot be saved yet, e.g. no type picked. */
  canSave: boolean;
  onBack: () => void;
  onNext: () => void;
};

/** Back (Cancel on the first step) and Next (Save on the last step). */
export function WizardFooter({ first, last, pending, canSave, onBack, onNext }: WizardFooterProps) {
  const common = useTranslations("common");
  return (
    <div className="flex justify-between gap-2">
      <Button type="button" variant="outline" onClick={onBack}>
        {first ? common("cancel") : common("back")}
      </Button>
      {last ? (
        <Button type="submit" disabled={pending || !canSave}>
          {common("save")}
        </Button>
      ) : (
        <Button type="button" onClick={onNext}>
          {common("next")}
        </Button>
      )}
    </div>
  );
}
