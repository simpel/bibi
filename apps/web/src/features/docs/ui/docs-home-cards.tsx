import { Link } from "@bibi/i18n/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { BookOpenIcon, BracesIcon, CodeIcon, type LucideIcon, PlugIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DOC_SECTIONS, docHref, MCP_REFERENCE_HREF, REST_REFERENCE_HREF } from "../pages";

const CARDS = [
  {
    key: "guide",
    href: docHref({ section: "guide", slug: DOC_SECTIONS.guide[0] }),
    icon: BookOpenIcon,
  },
  {
    key: "developers",
    href: docHref({ section: "developers", slug: DOC_SECTIONS.developers[0] }),
    icon: CodeIcon,
  },
  { key: "rest", href: REST_REFERENCE_HREF, icon: BracesIcon, external: true },
  { key: "mcp", href: MCP_REFERENCE_HREF, icon: PlugIcon },
] as const;

type CardBodyProps = { cardKey: (typeof CARDS)[number]["key"]; icon: LucideIcon };

function CardBody({ cardKey, icon: Icon }: CardBodyProps) {
  const t = useTranslations("docs.home.cards");
  return (
    <Card className="h-full transition-colors hover:bg-muted/50">
      <CardHeader>
        <Icon className="size-5 text-muted-foreground" />
        <CardTitle>{t(`${cardKey}.title`)}</CardTitle>
        <CardDescription>{t(`${cardKey}.description`)}</CardDescription>
      </CardHeader>
    </Card>
  );
}

const LINK_CLASS = "rounded-xl focus-visible:ring-2 focus-visible:ring-ring";

/** Entry points from the docs start page. The REST card opens the API's own Scalar page. */
export function DocsHomeCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CARDS.map((card) =>
        "external" in card ? (
          <a key={card.key} href={card.href} className={LINK_CLASS}>
            <CardBody cardKey={card.key} icon={card.icon} />
          </a>
        ) : (
          <Link key={card.key} href={card.href} className={LINK_CLASS}>
            <CardBody cardKey={card.key} icon={card.icon} />
          </Link>
        ),
      )}
    </div>
  );
}
