import type { PlacedElement } from "@bibi/core/schemas";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FloorDrawing,
  Input,
  Label,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { KindMap } from "../lib/draft";
import {
  buildTemplate,
  type Room,
  TEMPLATES,
  type TemplateKey,
  templateKind,
} from "../lib/layout-templates";
import { draftToDrawing } from "../lib/to-drawing";

export type EmptyLayoutProps = {
  layoutName: string;
  room: Room;
  kinds: KindMap;
  fixed: readonly PlacedElement[];
  onStart: (input: { template: TemplateKey; people: number }) => void;
  onEmpty: () => void;
};

/** An empty layout's start: a people count and a picture of each template, or an empty room. */
export function EmptyLayout({
  layoutName,
  room,
  kinds,
  fixed,
  onStart,
  onEmpty,
}: EmptyLayoutProps) {
  const t = useTranslations("floorPlan.start");
  const id = useId();
  const [people, setPeople] = useState(30);
  const count = Math.max(1, Math.min(400, people));
  return (
    <div className="absolute inset-0 grid place-items-center bg-background/70 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{t("title", { name: layoutName })}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor={`${id}-people`}>{t("people")}</Label>
            <Input
              id={`${id}-people`}
              type="number"
              min={1}
              max={400}
              className="w-24"
              value={people}
              onChange={(event) => setPeople(Number(event.currentTarget.value) || 1)}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {TEMPLATES.map((template) => {
              const available = templateKind({ template, kinds }) !== null;
              const preview = available
                ? buildTemplate({ template, people: count, room, kinds, fixed })
                : [];
              const drawn = preview.flatMap((element) => {
                const one = draftToDrawing({ element, kinds, tone: "default", nameOf: () => "" });
                return one ? [one] : [];
              });
              return (
                <Button
                  key={template}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-2"
                  disabled={!available}
                  onClick={() => onStart({ template, people: count })}
                >
                  <FloorDrawing
                    title={t(`templates.${template}`)}
                    widthCm={room.widthCm}
                    depthCm={room.depthCm}
                    outline={room.outline}
                    elements={drawn}
                    className="aspect-[4/3] w-full"
                  />
                  {available ? t(`templates.${template}`) : t("missingKind")}
                </Button>
              );
            })}
          </div>
          <Button variant="link" className="justify-self-start px-0" onClick={onEmpty}>
            {t("empty")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
