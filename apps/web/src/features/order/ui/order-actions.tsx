import type { OrderDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { orderRoute, updateRoute } from "@/lib/routes";
import { type CallerAbilities, can } from "@/server/caller-abilities";

export type OrderActionsProps = {
  order: OrderDto;
  abilities: CallerAbilities;
};

/** The Edit button (own page) of the order page; the page is the order, so it only says Edit, each by its permission. */
export async function OrderActions({ order, abilities }: OrderActionsProps) {
  const common = await getTranslations("common");
  return (
    <>
      {can({ abilities, permission: "order:write" }) ? (
        <Button asChild>
          <Link href={updateRoute({ detail: orderRoute({ id: order.id }) })}>
            <PencilIcon />
            {common("edit")}
          </Link>
        </Button>
      ) : null}
    </>
  );
}
