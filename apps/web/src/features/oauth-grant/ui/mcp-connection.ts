/** The name Bibi gets in an AI app's connector list. */
export const CONNECTOR_NAME = "Bibi";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export type IsLocalUrlInput = { url: string };

/** True when only this computer can reach the address, so hosted AI apps cannot. */
export const isLocalUrl = ({ url }: IsLocalUrlInput): boolean =>
  LOCAL_HOSTS.has(new URL(url).hostname);
