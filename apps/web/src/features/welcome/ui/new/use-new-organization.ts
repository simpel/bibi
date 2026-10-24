"use client";

import { effectiveTimeZone } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { afterNewOrganization } from "@/features/auth/ui/after-organization";
import { useAuthFormAction } from "@/features/auth/ui/use-auth-form-action";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import { slugify } from "@/lib/slugify";
import { browserTimeZone } from "@/lib/time/browser-time-zone";
import { useZodMessages } from "@/lib/use-zod-messages";
import { NewOrganizationSchema, type NewOrganizationValues } from "./new-organization-schema";
import { useSlugCheck } from "./use-slug-check";

/**
 * Form state of `/welcome/new`: the slug follows the name until the user takes one, and the zone
 * starts as the browser's (set after mount, so the server render does not guess it).
 */
export function useNewOrganization() {
  const t = useTranslations("welcome.new");
  const auth = useTranslations("auth");
  const router = useRouter();
  const form = useForm<NewOrganizationValues>({
    resolver: zodResolver(NewOrganizationSchema, useZodMessages()),
    defaultValues: { name: "", slug: "", timeZone: effectiveTimeZone({}) },
  });
  // `form` changes identity per render; the stable `resetField` makes this run once, after mount.
  const { resetField } = form;
  useEffect(() => resetField("timeZone", { defaultValue: browserTimeZone() }), [resetField]);
  const [slugEdited, setSlugEdited] = useState(false);
  const name = form.watch("name");
  useEffect(() => {
    if (!slugEdited) form.setValue("slug", slugify({ name }));
  }, [form, name, slugEdited]);
  const check = useSlugCheck({ slug: form.watch("slug") });
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit((values) =>
    run({
      call: () => {
        const { timeZone, ...organization } = values;
        // The zone only passes through `metadata`; Better Auth's hooks store it on the profile.
        return authClient.organization.create({ ...organization, metadata: { timeZone } });
      },
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
