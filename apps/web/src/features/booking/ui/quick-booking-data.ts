import type { NamedOption } from "@/components/form/named-option";

/** What the quick booking form picks from: both type lists, customers and bookable items. */
export type QuickBookingData = {
  bookingTypes: NamedOption[];
  programItemTypes: NamedOption[];
  customers: NamedOption[];
  items: NamedOption[];
};
