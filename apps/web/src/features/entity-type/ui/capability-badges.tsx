import type { EntityTypeDto } from "@bibi/core";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type CapabilityBadgesProps = { capabilities: EntityTypeDto["capabilities"] };

/** The type's capabilities as outline badges. */
export function CapabilityBadges({ capabilities }: CapabilityBadgesProps) {
  const t = useTranslations("entityType");
  return (
    <div className="flex flex-wrap gap-1">
      {capabilities.map((capability) => (
        <Badge key={capability} variant="outline">
          {t(`capabilities.${capability}`)}
        </Badge>
      ))}
    </div>
  );
}
