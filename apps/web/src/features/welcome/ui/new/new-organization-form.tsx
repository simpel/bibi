"use client";

import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { WelcomeStepActions } from "../welcome-step-actions";
import { SlugField } from "./slug-field";
import { useNewOrganization } from "./use-new-organization";

/** `/welcome/new`: name + address. Create stays disabled until the address is free. */
export function NewOrganizationForm() {
  const t = useTranslations("welcome.new");
  const { form, check, pending, onSubmit, takeSlug } = useNewOrganization();
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("name")} autoComplete="organization" required />
        <SlugField form={form} check={check} onTake={takeSlug} />
        <WelcomeStepActions
          back={{ href: "/welcome" }}
          pending={pending}
          disabled={check.status !== "free"}
          label={t("submit")}
        />
      </form>
    </Form>
  );
}
