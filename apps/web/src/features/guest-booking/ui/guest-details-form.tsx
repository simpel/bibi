import { PublicCreateInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckField } from "@/components/form/check-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createGuestReservationAction } from "../actions";
import type { SlotChoice } from "../lib/group-slots";
import { type GuestErrorKey, guestErrorKey } from "../lib/guest-error";
import { BookerFields } from "./booker-fields";
import { GuestTextBlock } from "./guest-text-block";
import { TurnstileWidget } from "./turnstile-widget";

export type CaptchaProps = { siteKey: string; scriptUrl: string } | null;

export type GuestDetailsFormProps = {
  slug: string;
  roomSlug: string;
  party: number;
  slot: SlotChoice;
  /** The page's booking terms in the visitor's language; null = no checkbox. */
  policy: string | null;
  captcha: CaptchaProps;
  /** A time that was just taken: back to the times, refreshed. */
  onTaken: () => void;
};

const Booker = PublicCreateInputSchema.pick({
  bookerName: true,
  bookerPhone: true,
  bookerEmail: true,
  note: true,
});

type Values = {
  bookerName: string;
  bookerPhone: string;
  bookerEmail: string;
  note: string;
  policy: boolean;
};

/** Core's booker rules, plus the terms checkbox when the page has terms. */
function schemaFor({ policy, required }: { policy: boolean; required: string }) {
  const schema = Booker.extend({ policy: z.boolean() }).refine(
    (values) => !policy || values.policy,
    {
      path: ["policy"],
      message: required,
    },
  );
  return formSchema<Values, typeof schema>({ schema, toInput: ({ values }) => values });
}

/** The details step (ADR 0119): the booker, the terms, the captcha, then the booking itself. */
export function GuestDetailsForm(props: GuestDetailsFormProps) {
  const t = useTranslations("guestBooking");
  const locale = useLocale() === "en" ? "en" : "sv";
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaRound, setCaptchaRound] = useState(0);
  const failed = useRef<GuestErrorKey | null>(null);
  const schema = schemaFor({
    policy: props.policy !== null,
    required: t("details.policyRequired"),
  });
  const form = useForm<Values, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: { bookerName: "", bookerPhone: "", bookerEmail: "", note: "", policy: false },
  });
  const submit = form.handleSubmit(({ policy: _accepted, note, ...booker }) =>
    run({
      action: () =>
        createGuestReservationAction({
          ...{ slug: props.slug, roomSlug: props.roomSlug, startsAt: props.slot.startsAt },
          ...{ partySize: props.party, ...booker, note: note || null, locale },
          captcha: captchaToken,
        }),
      messages: { pending: t("details.pending"), success: t("details.success") },
      errorMessage: ({ error }) => {
        failed.current = guestErrorKey({ error });
        return failed.current ? t(`errors.${failed.current}`) : null;
      },
      onSuccess: ({ value }) => router.push(`/book/manage/${value.token}?booked=1`),
      onError: () => {
        setCaptchaToken("");
        setCaptchaRound((round) => round + 1);
        if (failed.current === "taken") props.onTaken();
      },
    }),
  );
  const waitingForCaptcha = props.captcha !== null && !captchaToken;
  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <BookerFields
          form={form}
          labels={{
            ...{ name: t("details.name"), phone: t("details.phone"), email: t("details.email") },
            ...{ emailHint: t("details.emailHint"), note: t("details.note") },
          }}
        />
        {props.policy ? (
          <div className="flex flex-col gap-2 rounded-lg bg-muted px-3 py-3">
            <h3 className="text-sm font-medium">{t("details.policyTitle")}</h3>
            <GuestTextBlock text={props.policy} />
            <CheckField form={form} name="policy" label={t("details.policyAccept")} />
          </div>
        ) : null}
        {props.captcha ? (
          <TurnstileWidget
            {...props.captcha}
            label={t("details.captcha")}
            resetKey={captchaRound}
            onToken={({ token }) => setCaptchaToken(token)}
          />
        ) : null}
        <Button type="submit" size="xl" disabled={pending || waitingForCaptcha} className="w-full">
          {t("details.submit")}
        </Button>
      </form>
    </Form>
  );
}
