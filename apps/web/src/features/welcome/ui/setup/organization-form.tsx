"use client";

import { Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { welcomePath } from "../../lib/welcome-step";
import { WelcomeStepActions } from "../welcome-step-actions";
import { OrganizationFields } from "./organization-fields";
import {
  type OrganizationStepOutput,
  OrganizationStepSchema,
  type OrganizationStepValues,
} from "./organization-schema";
import { saveOrganizationStep } from "./save-organization-step";
import { SkipSetupButton } from "./skip-setup-button";

export type OrganizationFormProps = {
  org: string;
  name: string;
  defaults: OrganizationStepValues;
  /** Hide "also our first venue" when the organization already has venues. */
  canCreateVenue: boolean;
};

/** `/:org/welcome/setup/organization` (ADR 0061). */
export function OrganizationForm({ org, name, defaults, canCreateVenue }: OrganizationFormProps) {
  const t = useTranslations("welcome");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<OrganizationStepValues, unknown, OrganizationStepOutput>({
    resolver: zodResolver(OrganizationStepSchema, useZodMessages()),
    defaultValues: defaults,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => saveOrganizationStep({ values, name }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.push(welcomePath({ step: "setup/kind" }), { org }),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OrganizationFields form={form} canCreateVenue={canCreateVenue} />
        <WelcomeStepActions
          back={{ href: welcomePath({ step: "hours" }), org }}
          pending={pending}
          aside={<SkipSetupButton org={org} />}
        />
      </form>
    </Form>
  );
}
