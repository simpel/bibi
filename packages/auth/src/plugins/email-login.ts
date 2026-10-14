import { emailOTP, magicLink } from "better-auth/plugins";
import { sendMail } from "../mail";

/** Passwordless sign-in: magic link and one-time code by mail (ADR 0005). */
export function emailLoginPlugins() {
  return [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendMail({
          to: email,
          subject: "Logga in på Okazi",
          text: `Klicka på länken för att logga in (giltig i 15 minuter):\n\n${url}`,
        });
      },
    }),
    emailOTP({
      expiresIn: 60 * 10,
      sendVerificationOTP: async ({ email, otp }) => {
        await sendMail({
          to: email,
          subject: `Din Okazi-kod: ${otp}`,
          text: `Din engångskod är ${otp}. Den är giltig i 10 minuter.`,
        });
      },
    }),
  ];
}
