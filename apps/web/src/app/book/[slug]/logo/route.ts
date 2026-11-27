import { bookingImageHandler } from "@/features/guest-booking/server/booking-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = bookingImageHandler({ kind: "logo" });

export const GET = (request: Request) => handler(request);
