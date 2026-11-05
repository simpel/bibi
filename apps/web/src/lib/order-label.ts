export type OrderNameInput = {
  title: string | null;
  /** The label for an order without a title, e.g. "Order #41" or "#41". */
  fallback: string;
};

/** The order's title is its primary label everywhere; the reference only backs it up. */
export const orderName = ({ title, fallback }: OrderNameInput): string => title ?? fallback;
