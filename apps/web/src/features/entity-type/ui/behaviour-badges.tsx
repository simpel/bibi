import type { EntityTypeDto } from "@okazi/core";
import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";

export type BehaviourBadgesProps = { behaviours: EntityTypeDto["behaviours"] };

/** The type's behaviours as outline badges. */
export function BehaviourBadges({ behaviours }: BehaviourBadgesProps) {
  const t = useTranslations("entityType");
  return (
    <div className="flex flex-wrap gap-1">
      {behaviours.map((behaviour) => (
        <Badge key={behaviour} variant="outline">
          {t(`behaviours.${behaviour}`)}
        </Badge>
      ))}
    </div>
  );
}
