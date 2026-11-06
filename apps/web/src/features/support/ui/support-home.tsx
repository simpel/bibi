import { Card, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import type { SupportTopic as SupportTopicData } from "../server/support-topics";
import { SupportContact } from "./support-contact";
import { SupportTopic } from "./support-topic";

export type SupportGuideLink = { href: string; title: string; lead: string };

export type SupportHomeProps = {
  topics: SupportTopicData[];
  guides: SupportGuideLink[];
  email: string | undefined;
};

/** `/support`: common questions by topic, the step-by-step guides, then where to get more help. */
export async function SupportHome({ topics, guides, email }: SupportHomeProps) {
  const t = await getTranslations("support");
  return (
    <div className="mx-auto grid max-w-3xl gap-12">
      <header className="grid gap-3">
        <p className="text-sm font-medium text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="text-balance text-4xl tracking-tight">{t("title")}</h1>
        <p className="text-pretty text-lg text-muted-foreground">{t("lead")}</p>
        <nav aria-label={t("topicsLabel")} className="mt-3 flex flex-wrap gap-2">
          {topics.map((topic) => (
            <a
              key={topic.id}
              href={`#${topic.id}`}
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
            >
              {topic.title}
            </a>
          ))}
        </nav>
      </header>
      {topics.map((topic) => (
        <SupportTopic key={topic.id} topic={topic} />
      ))}
      <section id="guides" className="grid scroll-mt-8 gap-4">
        <header className="grid gap-1">
          <h2 className="text-2xl tracking-tight">{t("guidesLabel")}</h2>
          <p className="text-muted-foreground">{t("guidesLead")}</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{guide.title}</CardTitle>
                  <CardDescription>{guide.lead}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <SupportContact email={email} />
    </div>
  );
}
