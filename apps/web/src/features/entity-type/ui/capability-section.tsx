import type { ItemCapability } from "@bibi/core/schemas";
import { Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type CapabilitySectionProps = {
  capability: ItemCapability;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Title of the section this one needs, shown as a hint. */
  requires: string | null;
  children?: ReactNode;
};

/** A titled section with a switch; its settings show while it is on. */
export function CapabilitySection({
  capability,
  checked,
  onChange,
  requires,
  children,
}: CapabilitySectionProps) {
  const t = useTranslations("entityType");
  const id = `section-${capability}`;
  return (
    <section className="grid gap-3 rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <label htmlFor={id} className="text-sm font-medium leading-none">
            {t(`sections.${capability}.title`)}
          </label>
          <p className="text-xs text-muted-foreground">
            {t(`sections.${capability}.description`)}
            {requires ? ` ${t("needs", { section: requires })}` : ""}
          </p>
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onChange} />
      </div>
      {children}
    </section>
  );
}
