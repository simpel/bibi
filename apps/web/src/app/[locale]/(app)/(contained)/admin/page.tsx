import { resolveLocale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@okazi/ui";
import {
  ArrowRightIcon,
  KeyRoundIcon,
  type LucideIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";

type AdminPageProps = { params: Promise<{ locale: string }> };

type AdminHubCardProps = {
  icon: LucideIcon;
  href: string;
  title: string;
  description: string;
  action: string;
};

function AdminHubCard({ icon: Icon, href, title, description, action }: AdminHubCardProps) {
  return (
    <Card className="flex flex-col justify-between transition-colors hover:border-foreground/20">
      <CardHeader className="gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="size-5" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button asChild variant="outline" className="w-full justify-between">
          <Link href={href}>
            <span>{action}</span>
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * `/admin`: The administration hub for organization members, API keys, and settings.
 */
export default async function AdminPage({ params }: AdminPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const t = await getTranslations("administration");
  const abilities = await getCallerAbilities();

  const cards = [
    { key: "members", permission: "member:read", icon: UsersIcon, href: ROUTES.adminMembers },
    { key: "apiKeys", permission: "apiKey:read", icon: KeyRoundIcon, href: ROUTES.adminApiKeys },
    {
      key: "settings",
      permission: "configuration:read",
      icon: SettingsIcon,
      href: ROUTES.settings,
    },
  ] as const;
  const visible = cards.filter((card) => can({ abilities, permission: card.permission }));
  if (visible.length === 0) return <ErrorState errorKey="forbidden" />;

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((card) => (
          <AdminHubCard
            key={card.key}
            icon={card.icon}
            href={card.href}
            title={t(`${card.key}.title`)}
            description={t(`${card.key}.description`)}
            action={t(`${card.key}.action`)}
          />
        ))}
      </div>
    </div>
  );
}
