import { Button } from "@bibi/ui";
import { PencilRulerIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type CustomBookingButtonProps = {
  /** The booking is already custom: the button says so and reopens its build step. */
  picked: boolean;
  onClick: () => void;
};

/** Under step 3's tabs: build the booking line by line instead of from a package. */
export function CustomBookingButton({ picked, onClick }: CustomBookingButtonProps) {
  const t = useTranslations("ticketIntake.package.custom");
  return (
    <div className="flex flex-wrap items-center gap-3 border-t pt-4">
      <Button type="button" variant={picked ? "secondary" : "outline"} onClick={onClick}>
        <PencilRulerIcon aria-hidden />
        {t("button")}
      </Button>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
