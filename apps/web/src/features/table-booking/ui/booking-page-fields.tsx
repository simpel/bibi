import {
  ColorSwatch,
  FormControl,
  FormController,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  VisualTile,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { ImageUploadField } from "@/components/form/image-upload-field";
import { TextField } from "@/components/form/text-field";
import { fileUrl } from "@/lib/file-url";
import type { BookingPageFormOutput, BookingPageFormValues } from "./booking-page-form-schema";

type Form = UseFormReturn<BookingPageFormValues, unknown, BookingPageFormOutput>;

const HEX = /^#[0-9a-fA-F]{6}$/;

function SlugField({ form }: { form: Form }) {
  const t = useTranslations("tableBooking.page");
  const slug = form.watch("slug");
  return (
    <FormController
      control={form.control}
      name="slug"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("slug")}</FormLabel>
          <FormControl>
            <Input {...field} autoComplete="off" />
          </FormControl>
          <FormDescription>{t("slugHint", { address: `/book/${slug || "…"}` })}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function AccentField({ form }: { form: Form }) {
  const t = useTranslations("tableBooking.page");
  return (
    <FormController
      control={form.control}
      name="accentColor"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("accent")}</FormLabel>
          <div className="flex items-center gap-3">
            <FormControl>
              <Input {...field} className="max-w-40" placeholder="#1a56db" autoComplete="off" />
            </FormControl>
            {HEX.test(field.value) ? <ColorSwatch size="md" color={field.value} /> : null}
          </div>
          <FormDescription>{t("accentHint")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ImageField({ form, name }: { form: Form; name: "logoKey" | "coverKey" }) {
  const t = useTranslations("tableBooking.page");
  const imageKey = form.watch(name);
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">{t(name)}</legend>
      <div className="flex items-start gap-4">
        {imageKey ? <VisualTile size="lg" src={fileUrl({ key: imageKey })} /> : null}
        <ImageUploadField
          imageKey={imageKey}
          onChange={(key) => form.setValue(name, key, { shouldDirty: true })}
          hint={t(`${name}Hint`)}
        />
      </div>
    </fieldset>
  );
}

/** The fields of the booking page form, in reading order. */
export function BookingPageFields({ form }: { form: Form }) {
  const t = useTranslations("tableBooking.page");
  return (
    <>
      <SlugField form={form} />
      <ImageField form={form} name="logoKey" />
      <ImageField form={form} name="coverKey" />
      <AccentField form={form} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="introSv" label={t("introSv")} multiline rows={4} />
        <TextField form={form} name="introEn" label={t("introEn")} multiline rows={4} />
        <TextField form={form} name="policySv" label={t("policySv")} multiline rows={4} />
        <TextField form={form} name="policyEn" label={t("policyEn")} multiline rows={4} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="contactPhone" label={t("phone")} type="tel" />
        <TextField form={form} name="contactEmail" label={t("email")} type="email" />
      </div>
      <TextField
        form={form}
        name="embedOrigins"
        label={t("embedOrigins")}
        multiline
        rows={3}
        placeholder="https://example.com"
      />
      <p className="-mt-4 text-xs text-muted-foreground">{t("embedOriginsHint")}</p>
    </>
  );
}
