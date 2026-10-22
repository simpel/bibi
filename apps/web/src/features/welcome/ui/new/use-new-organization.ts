"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { afterNewOrganization } from "@/features/auth/ui/after-organization";
import { useAuthFormAction } from "@/features/auth/ui/use-auth-form-action";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import { slugify } from "@/lib/slugify";
import { useZodMessages } from "@/lib/use-zod-messages";
import { NewOrganizationSchema, type NewOrganizationValues } from "./new-organization-schema";
import { useSlugCheck } from "./use-slug-check";

/** Form state of `/welcome/new`: the slug follows the name until the user takes one. */
export function useNewOrganization() {
  const t = useTranslations("welcome.new");
  const auth = useTranslations("auth");
  const router = useRouter();
  const form = useForm<NewOrganizationValues>({
    resolver: zodResolver(NewOrganizationSchema, useZodMessages()),
    defaultValues: { name: "", slug: "" },
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const name = form.watch("name");
  useEffect(() => {
    if (!slugEdited) form.setValue("slug", slugify({ name }));
  }, [form, name, slugEdited]);
  const check = useSlugCheck({ slug: form.watch("slug") });
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit((values) =>
    run({
      call: () => authClient.organization.create(values),
      messages: {
        pending: t("creating", { organization: values.name }),
        success: auth("organizationCreated"),
      },
      onSuccess: () => afterNewOrganization({ router, slug: values.slug }),
    }),
  );
  const takeSlug = ({ value }: { value: string }) => {
    setSlugEdited(true);
    form.setValue("slug", value, { shouldValidate: true });
  };
  return { form, check, pending, onSubmit, takeSlug };
}
