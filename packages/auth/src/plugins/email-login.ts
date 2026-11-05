import { renderMagicLinkEmail } from "@bibi/mail";
import { magicLink } from "better-auth/plugins";
import { sendAuthMail } from "../mail";
import { resolveUserLocale } from "../user-locale";

/** Passwordless sign-in: magic link by mail (ADR 0005). */
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
  ];
}
