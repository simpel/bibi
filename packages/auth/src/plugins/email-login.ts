import { emailOTP, magicLink } from "better-auth/plugins";
import { sendAuthMail } from "../mail";

/** Passwordless sign-in: magic link and one-time code by mail (ADR 0005). */
export function emailLoginPlugins() {
  return [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendAuthMail({
          to: email,
          subject: "Sign in to Okazi",
          text: `Click the link to sign in (valid for 15 minutes):\n\n${url}`,
        });
      },
    }),
    emailOTP({
      expiresIn: 60 * 10,
      sendVerificationOTP: async ({ email, otp }) => {
        await sendAuthMail({
          to: email,
          subject: `Your Okazi code: ${otp}`,
          text: `Your one-time code is ${otp}. It is valid for 10 minutes.`,
        });
      },
    }),
  ];
}
