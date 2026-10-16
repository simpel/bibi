/**
 * The time zone every date and time is rendered and entered in. The server (next-intl request
 * config) and the `datetime-local` form helpers share it, so a wall-clock value looks the same
 * regardless of the host's or browser's time zone.
 */
export const DEFAULT_TIME_ZONE = "Europe/Stockholm";
