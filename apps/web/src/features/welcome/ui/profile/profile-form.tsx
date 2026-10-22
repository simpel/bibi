"use client";

import { type ProfileUpdateInput, ProfileUpdateInputSchema } from "@bibi/core/schemas";
import { Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { saveProfileAction } from "../../actions";
import { welcomePath } from "../../lib/welcome-step";
import { WelcomeStepActions } from "../welcome-step-actions";
import { AvatarField } from "./avatar-field";
import { ProfileFields } from "./profile-fields";

export type ProfileFormProps = { org: string; defaults: ProfileUpdateInput };

/** First name, last name, phone and photo; saved once for every organization (ADR 0061). */
export function ProfileForm({ org, defaults }: ProfileFormProps) {
  const t = useTranslations("welcome");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(ProfileUpdateInputSchema, useZodMessages()),
    defaultValues: defaults,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => saveProfileAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.push(welcomePath(), { org }),
  });
  const [first, last] = form.watch(["firstName", "lastName"]);
  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <AvatarField
          avatarKey={form.watch("avatarKey") ?? null}
          initials={initials}
          onChange={(key) => form.setValue("avatarKey", key)}
        />
        <ProfileFields form={form} />
        <WelcomeStepActions pending={pending} />
      </form>
    </Form>
  );
}
