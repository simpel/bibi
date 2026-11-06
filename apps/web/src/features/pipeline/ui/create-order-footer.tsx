import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

/** "+ Create order" at the end of the lane that holds the entry status. */
export function CreateOrderFooter() {
  const t = useTranslations("nav");
  return (
    <Button asChild variant="ghost" size="sm" className="justify-start text-muted-foreground">
      <Link href="/new/order">
        <PlusIcon aria-hidden />
        {t("newOrder")}
      </Link>
    </Button>
  );
}
