import "use-intl";
import type { svMessages } from "./catalog";
import type { Locale } from "./routing";

/** Shape of the message catalogue; `sv` is the source of truth, `en` must match. */
export type Messages = typeof svMessages;
export type MessageNamespace = keyof Messages;

declare module "use-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
