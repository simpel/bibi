import { Button, DangerZone, DangerZoneRow } from "@bibi/ui";
import { ArchiveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

/** The open state the archive row hands its feature's confirm dialog. */
export type ArchiveDialogState = { open: boolean; onOpenChange: (open: boolean) => void };

export type ArchiveDangerAreaProps = {
  /** The feature's archive label ("Archive venue"): the row's title and its button. */
  label: string;
  /** What archiving does, usually the feature's confirm text. */
  description: ReactNode;
  /** The feature's own archive confirm dialog. */
  dialog: (state: ArchiveDialogState) => ReactNode;
};

/**
 * A record's danger area with its one Archive row (spec: danger-area), last on its page or its
 * last tab. Each feature wraps it in its `<Feature>DangerArea` client component.
 */
export function ArchiveDangerArea({ label, description, dialog }: ArchiveDangerAreaProps) {
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <DangerZone title={common("dangerArea")}>
      <DangerZoneRow
        title={label}
        description={description}
        action={
          <Button variant="outline" className="text-destructive" onClick={() => setArchiving(true)}>
            <ArchiveIcon aria-hidden />
            {label}
          </Button>
        }
      />
      {dialog({ open: archiving, onOpenChange: setArchiving })}
    </DangerZone>
  );
}
