import type { EntityTypeDto } from "@okazi/core";
import { Badge } from "@okazi/ui";
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
