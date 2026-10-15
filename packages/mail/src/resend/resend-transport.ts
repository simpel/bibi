export const RESEND_API_URL = "https://api.resend.com";

export type ResendRequest = { url: string; init: RequestInit };

/** Performs one HTTP request against the Resend API. */
export type ResendTransport = (request: ResendRequest) => Promise<Response>;

export const fetchTransport: ResendTransport = ({ url, init }) => fetch(url, init);
