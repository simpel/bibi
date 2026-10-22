import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@bibi/ui";
import { ServerIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DevService } from "@/lib/dev-services";

export type DevServiceMenuProps = { services: DevService[] };

const isLink = ({ url }: { url: string }) => url.startsWith("http");

/** Sub-menu of the local services; http ones open in a new tab. */
export function DevServiceMenu({ services }: DevServiceMenuProps) {
  const t = useTranslations("dev");
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ServerIcon />
        {t("services")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-72">
        {services.map((service) => (
          <DropdownMenuItem key={service.name} asChild={isLink(service)}>
            {isLink(service) ? (
              <a href={service.url} target="_blank" rel="noreferrer">
                <ServiceLabel service={service} />
              </a>
            ) : (
              <ServiceLabel service={service} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function ServiceLabel({ service }: { service: DevService }) {
  return (
    <span className="grid">
      <span className="text-sm">
        {service.name} <span className="text-muted-foreground">{service.url}</span>
      </span>
      <span className="text-xs text-muted-foreground">{service.note}</span>
    </span>
  );
}
