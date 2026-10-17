"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, Form, Input } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { ProfileNameSchema, type ProfileNameValues } from "./auth-schemas";
import { useAuthFormAction } from "./use-auth-form-action";

export type ProfileNameFormProps = { name: string; email: string };

/** Change the display name; the email is shown read-only. */
export function ProfileNameForm({ name, email }: ProfileNameFormProps) {
  const t = useTranslations("profile");
  const auth = useTranslations("auth");
  const router = useRouter();
  const messages = useZodMessages();
  const form = useForm<ProfileNameValues>({
    resolver: zodResolver(ProfileNameSchema, messages),
    defaultValues: { name },
  });
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit((values) =>
    run({
      call: () => authClient.updateUser({ name: values.name }),
      messages: { pending: t("savingName"), success: t("nameSaved") },
      onSuccess: () => router.refresh(),
    }),
  );
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={auth("name")} autoComplete="name" required />
        <div className="grid gap-2">
          <label htmlFor="profile-email" className="text-sm font-medium">
            {auth("email")}
          </label>
          <Input id="profile-email" value={email} readOnly disabled />
        </div>
        <Button type="submit" disabled={pending} className="justify-self-start">
          {t("saveName")}
        </Button>
      </form>
    </Form>
  );
}
