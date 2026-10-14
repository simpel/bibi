import { notFound } from "next/navigation";

/** Unmatched URLs under a locale render the localized not-found page inside the layout. */
export default function CatchAllPage() {
  notFound();
}
