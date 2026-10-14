"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/slugify";
import { useZodMessages } from "@/lib/use-zod-messages";
import { afterOrganization } from "./after-organization";
import { OrganizationNameSchema, type OrganizationNameValues } from "./auth-schemas";
import { useAuthFormAction } from "./use-auth-form-action";

/** Creates an organization (the caller becomes owner) and makes it the active one. */
export function CreateOrganizationForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const messages = useZodMessages();
  const form = useForm<OrganizationNameValues>({
    resolver: zodResolver(OrganizationNameSchema, messages),
    defaultValues: { name: "" },
  });
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit(({ name }) =>
    run({
      call: () =>
        authClient.organization.create({
          name,
          slug: slugify({ name, suffix: crypto.randomUUID().slice(0, 8) }),
        }),
      messages: { pending: t("creatingOrganization"), success: t("organizationCreated") },
      onSuccess: () => afterOrganization({ router }),
    }),
  );
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <TextField
          form={form}
          name="name"
          label={t("organizationName")}
          autoComplete="organization"
          required
        />
        <Button type="submit" disabled={pending}>
          {t("createOrganization")}
        </Button>
      </form>
    </Form>
  );
}
