import { getOrder } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { orderName } from "@/lib/order-label";
import { orderRoute } from "@/lib/routes";
import { runOperation } from "@/server/run-operation";

/** The order the message is attached to, by its title; a generic link when it cannot be read. */
export async function AttachedOrder({ orderId }: { orderId: string }) {
  const [t, order] = await Promise.all([
    getTranslations("inbox"),
    runOperation({ operation: getOrder, input: { id: orderId } }),
  ]);
  const href = orderRoute({ id: orderId });
  if (!order.ok) {
    return (
      <p className="text-sm">
        <Link href={href} className="underline">
          {t("attachedTo")}
        </Link>
      </p>
    );
  }
  const { title, reference } = order.value;
  const name = orderName({ title, fallback: `#${reference}` });
  return (
    <p className="text-sm">
      {t.rich("attachedToOrder", {
        order: () => (
          <Link href={href} className="font-medium underline">
            {name}
          </Link>
        ),
      })}
    </p>
  );
}
