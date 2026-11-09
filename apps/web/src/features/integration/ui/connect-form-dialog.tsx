"use client";

import {
  type CredentialField,
  IntegrationConnectInputSchema,
  type IntegrationProvider,
} from "@bibi/core/schemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { type UseFormReturn, useForm } from "react-hook-form";
import type { z } from "zod";
import { TextField } from "@/components/form/text-field";
import { bytesToBase64 } from "@/lib/bytes-to-base64";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { connectIntegrationAction } from "../actions";

type Values = Record<string, string>;
type Output = z.infer<typeof IntegrationConnectInputSchema>;

/** Field keys with a translated label; any other field shows the provider's own description. */
const LABELLED = ["swishNumber", "certificate", "passphrase"] as const;
type Labelled = (typeof LABELLED)[number];
const labelledKey = ({ key }: { key: string }): Labelled | null =>
  LABELLED.find((known) => known === key) ?? null;

function useFieldLabel() {
  const t = useTranslations("integration.connectForm.fields");
  return ({ field }: { field: CredentialField }) => {
    const key = labelledKey({ key: field.key });
    return key ? t(key) : (field.description ?? field.key);
  };
}

type FileFieldProps = { form: UseFormReturn<Values, unknown, Output>; field: CredentialField };

/** A file the provider needs (a certificate), sent as base64 and never shown again. */
function FileField({ form, field: wanted }: FileFieldProps) {
  const label = useFieldLabel();
  return (
    <FormController
      control={form.control}
      name={wanted.key}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label({ field: wanted })}</FormLabel>
          <FormControl>
            <Input
              type="file"
              name={field.name}
              onBlur={field.onBlur}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                const bytes = file ? new Uint8Array(await file.arrayBuffer()) : null;
                field.onChange(bytes ? bytesToBase64({ bytes }) : "");
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export type ConnectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: IntegrationProvider;
  fields: readonly CredentialField[];
  name: string;
};

/**
 * The form for a provider that connects with what an admin enters (ADR 0100), drawn from the
 * fields the provider asks for. The provider checks them before Bibi stores them sealed.
 */
export function ConnectFormDialog({
  open,
  onOpenChange,
  provider,
  fields,
  name,
}: ConnectFormDialogProps) {
  const t = useTranslations("integration.connectForm");
  const common = useTranslations("common");
  const label = useFieldLabel();
  const router = useRouter();
  const schema = formSchema({
    schema: IntegrationConnectInputSchema,
    toInput: ({ values }: { values: Values }) => ({ provider, credentials: values }),
  });
  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: Object.fromEntries(fields.map((field) => [field.key, ""])),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => connectIntegrationAction({ input: values }),
    messages: { pending: t("connecting", { name }), success: t("connected", { name }) },
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { name })}</DialogTitle>
          <DialogDescription>{t("description", { name })}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            {fields.map((field) =>
              field.kind === "FILE" ? (
                <FileField key={field.key} form={form} field={field} />
              ) : (
                <TextField
                  key={field.key}
                  form={form}
                  name={field.key}
                  label={label({ field })}
                  type={field.kind === "SECRET" ? "password" : "text"}
                  autoComplete="off"
                  required
                />
              ),
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {t("submit", { name })}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
