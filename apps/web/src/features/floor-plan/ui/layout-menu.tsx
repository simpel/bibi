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
  /** Layouts only: name, what it suits, capacity and setup and teardown minutes. */
  onEditDetails: (() => void) | null;
  onTemplate: ((template: TemplateKey) => void) | null;
  onRoomSize: (() => void) | null;
  /** Floor plan only: straight walls again. */
  onRectangle: (() => void) | null;
  /** Layouts only: delete. */
  onDelete: (() => void) | null;
};

/** What is rare: the layout's details, starting over from a template, the room's size. */
export function LayoutMenu({
  onEditDetails,
  onTemplate,
  onRoomSize,
  onRectangle,
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
        {onEditDetails ? (
          <DropdownMenuItem onSelect={onEditDetails}>{t("editDetails")}</DropdownMenuItem>
        ) : null}
        {onTemplate ? (
          <>
            {onEditDetails ? <DropdownMenuSeparator /> : null}
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
        {onDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={onDelete}>
              {t("delete")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
