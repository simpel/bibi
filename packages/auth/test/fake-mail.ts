import { createMemoryMailProvider, type MailMessage, setMailProvider } from "@bibi/mail";

/** Captures mails in memory instead of sending them through the env-selected provider. */
export function installFakeMail(): MailMessage[] {
  const { provider, outbox } = createMemoryMailProvider();
  setMailProvider({ provider });
  return outbox;
}

/** Restores the env-selected mail provider. */
export function uninstallFakeMail(): void {
  setMailProvider({ provider: undefined });
}
