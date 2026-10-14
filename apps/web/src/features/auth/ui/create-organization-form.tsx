"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { ErrorBanner } from "@/components/states/error-banner";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/slugify";
import { useZodMessages } from "@/lib/use-zod-messages";
import { afterOrganization } from "./after-organization";
import { OrganizationNameSchema, type OrganizationNameValues } from "./auth-schemas";
import { useAuthSubmit } from "./use-auth-submit";

/** Creates an organization (the caller becomes owner) and makes it the active one. */
export function CreateOrganizationForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const messages = useZodMessages();
  const form = useForm<OrganizationNameValues>({
    resolver: zodResolver(OrganizationNameSchema, messages),
    defaultValues: { name: "" },
  });
  const { pending, errorKey, run } = useAuthSubmit();
  const onSubmit = form.handleSubmit(({ name }) =>
    run({
      call: () =>
        authClient.organization.create({
          name,
          slug: slugify({ name, suffix: crypto.randomUUID().slice(0, 8) }),
        }),
      onSuccess: async () => {
        toast.success(t("organizationCreated"));
        await afterOrganization({ router });
      },
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <ErrorBanner errorKey={errorKey} />
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
  );
}
