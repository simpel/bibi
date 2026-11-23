import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger, VisualTile } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ImageUploadField } from "@/components/form/image-upload-field";
import { fileUrl } from "@/lib/file-url";
import { iconOptions } from "./icon-options";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

type Form = UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;

function IconGrid({ form }: { form: Form }) {
  const t = useTranslations("item.picture");
  const [query, setQuery] = useState("");
  const chosen = form.watch("icon");
  const options = iconOptions({ query, name: form.watch("name") });
  return (
    <div className="grid gap-3">
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
      />
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noIcons")}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
          {options.map((icon) => (
            <Button
              key={icon}
              type="button"
              variant={icon === chosen ? "secondary" : "ghost"}
              size="icon"
              aria-label={icon}
              aria-pressed={icon === chosen}
              className={icon === chosen ? "ring-2 ring-primary" : undefined}
              onClick={() => form.setValue("icon", icon, { shouldDirty: true })}
            >
              <VisualTile icon={icon} size="xs" className="bg-transparent text-foreground" />
            </Button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("iconHint")}</p>
    </div>
  );
}

/**
 * The item's picture: a Lucide icon or an uploaded image (the image wins where both are set).
 * The preview shows what lists and packages will show.
 */
export function ItemPictureField({ form }: { form: Form }) {
  const t = useTranslations("item.picture");
  const imageKey = form.watch("imageKey");
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-sm font-medium">{t("label")}</legend>
      <div className="grid items-start gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <VisualTile
          size="lg"
          className="rounded-full"
          src={imageKey ? fileUrl({ key: imageKey }) : null}
          icon={form.watch("icon")}
        />
        <Tabs defaultValue={imageKey ? "image" : "icon"} className="grid gap-3">
          <TabsList>
            <TabsTrigger value="icon">{t("icon")}</TabsTrigger>
            <TabsTrigger value="image">{t("image")}</TabsTrigger>
          </TabsList>
          <TabsContent value="icon">
            <IconGrid form={form} />
          </TabsContent>
          <TabsContent value="image">
            <ImageUploadField
              imageKey={imageKey}
              onChange={(key) => form.setValue("imageKey", key, { shouldDirty: true })}
              hint={t("imageHint")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </fieldset>
  );
}
