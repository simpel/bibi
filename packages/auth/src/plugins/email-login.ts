import { renderMagicLinkEmail, renderOtpEmail } from "@bibi/mail";
import { emailOTP, magicLink } from "better-auth/plugins";
import { sendAuthMail } from "../mail";
import { resolveUserLocale } from "../user-locale";

/** Passwordless sign-in: magic link and one-time code by mail (ADR 0005). */
export function emailLoginPlugins() {
  return [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        const locale = await resolveUserLocale({ email });
        const rendered = renderMagicLinkEmail({ url, locale });
        await sendAuthMail({
          to: email,
          kind: "auth.magic-link",
          subject: rendered.subject,
          text: rendered.text,
          html: rendered.html,
        });
      },
    }),
    emailOTP({
      expiresIn: 60 * 10,
      sendVerificationOTP: async ({ email, otp }) => {
        const locale = await resolveUserLocale({ email });
        const rendered = renderOtpEmail({ otp, locale });
        await sendAuthMail({
          to: email,
          kind: "auth.sign-in-code",
          subject: rendered.subject,
          text: rendered.text,
          html: rendered.html,
        });
      },
    }),
  ];
}
