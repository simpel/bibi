"use client";

import { InboundEndpointSetEmailInputSchema } from "@bibi/core/schemas";
import {
  Button,
  Form,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { EmailField } from "@/components/form/email-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { setInboxAddressAction } from "../actions";

type InboxAddressValues = { localPart: string; publicAddress: string };

const schema = formSchema({
  schema: InboundEndpointSetEmailInputSchema,
  toInput: ({ values }: { values: InboxAddressValues }) => ({
    localPart: values.localPart,
    publicAddress: values.publicAddress.trim() === "" ? null : values.publicAddress.trim(),
  }),
});

export type InboxAddressFormProps = {
  localPart: string | null;
  publicAddress: string | null;
  /** Bibi's inbound domain, shown after @; null while the server has none configured. */
  domain: string | null;
  canEdit: boolean;
};

/** The part before @ of the inbox address and the venue's own address, saved with one button. */
export function InboxAddressForm({
  localPart,
  publicAddress,
  domain,
  canEdit,
}: InboxAddressFormProps) {
  const t = useTranslations("inbox.settings");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: { localPart: localPart ?? "", publicAddress: publicAddress ?? "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => setInboxAddressAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.refresh(),
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("localPart", { message: t("taken") });
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-md gap-4">
        <fieldset disabled={!canEdit || pending} className="grid gap-4">
          <FormController
            control={form.control}
            name="localPart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("localPart")}</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input autoComplete="off" spellCheck={false} {...field} />
                  </FormControl>
                  {domain ? (
                    <span className="shrink-0 text-sm text-muted-foreground">@{domain}</span>
                  ) : null}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <EmailField
            form={form}
            name="publicAddress"
            label={t("publicAddress")}
            placeholder={t("publicAddressPlaceholder")}
            autoComplete="off"
          />
        </fieldset>
        {canEdit ? (
          <div>
            <Button type="submit" disabled={pending}>
              {common("save")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("readOnly")}</p>
        )}
      </form>
    </Form>
  );
}
