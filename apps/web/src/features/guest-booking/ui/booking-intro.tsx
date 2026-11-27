import type { PublicBookingPageDto } from "@bibi/core/schemas";
import { pickText } from "../lib/guest-text";
import { GuestTextBlock } from "./guest-text-block";

export type BookingIntroProps = { page: Pick<PublicBookingPageDto, "intro">; locale: string };

/** The venue's welcome text in the visitor's language (else the other one). */
export function BookingIntro({ page, locale }: BookingIntroProps) {
  return <GuestTextBlock text={pickText({ texts: page.intro, locale })} />;
}
