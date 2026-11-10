import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { EllipsisIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { TEMPLATES, type TemplateKey } from "../lib/layout-templates";

export type LayoutMenuProps = {
  /** Null on the floor plan tab, which has no capacity. */
  capacity: { typed: number | null; seats: number } | null;
  onTypeCapacity: () => void;
  onUseSeats: () => void;
  onTemplate: ((template: TemplateKey) => void) | null;
  onRoomSize: (() => void) | null;
  /** Floor plan only: straight walls again. */
  onRectangle: (() => void) | null;
  /** Layouts only: rename (stored with the next Save) and delete. */
  onRename: (() => void) | null;
  onDelete: (() => void) | null;
};

/** What is rare: the capacity rule, starting over from a template, the room's size. */
export function LayoutMenu({
  capacity,
  onTypeCapacity,
  onUseSeats,
  onTemplate,
  onRoomSize,
  onRectangle,
  onRename,
  onDelete,
}: LayoutMenuProps) {
  const t = useTranslations("floorPlan.menu");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="absolute top-3 right-3 bg-card shadow-sm"
          aria-label={t("label")}
        >
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {capacity ? (
          <>
            <DropdownMenuLabel>{t("capacity")}</DropdownMenuLabel>
            {capacity.typed === null ? (
              <DropdownMenuItem onSelect={onTypeCapacity}>
                {t("typeCapacity", { seats: capacity.seats })}
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onSelect={onTypeCapacity}>
                  {t("editCapacity", { capacity: capacity.typed })}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onUseSeats}>
                  {t("useSeats", { seats: capacity.seats })}
                </DropdownMenuItem>
              </>
            )}
          </>
        ) : null}
        {onTemplate ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("startOver")}</DropdownMenuLabel>
            {TEMPLATES.map((template) => (
              <DropdownMenuItem key={template} onSelect={() => onTemplate(template)}>
                {t(`templates.${template}`)}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
        {onRoomSize ? (
          <DropdownMenuItem onSelect={onRoomSize}>{t("roomSize")}</DropdownMenuItem>
        ) : null}
        {onRectangle ? (
          <DropdownMenuItem onSelect={onRectangle}>{t("rectangle")}</DropdownMenuItem>
        ) : null}
        {onRename || onDelete ? <DropdownMenuSeparator /> : null}
        {onRename ? <DropdownMenuItem onSelect={onRename}>{t("rename")}</DropdownMenuItem> : null}
        {onDelete ? (
          <DropdownMenuItem destructive onSelect={onDelete}>
            {t("delete")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
