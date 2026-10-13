import type messages from "../messages/sv.json";
import type { Locale } from "./routing";

/** Shape of the message catalogue; `sv.json` is the source of truth, `en.json` must match. */
export type Messages = typeof messages;

declare module "use-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
