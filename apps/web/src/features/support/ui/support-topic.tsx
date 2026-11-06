import { ChevronDownIcon } from "lucide-react";
import type { SupportTopic as SupportTopicData } from "../server/support-topics";

export type SupportTopicProps = { topic: SupportTopicData };

/** One topic: heading plus its questions as native disclosure rows (no client JavaScript). */
export function SupportTopic({ topic }: SupportTopicProps) {
  return (
    <section id={topic.id} className="grid scroll-mt-8 gap-4">
      <header className="grid gap-1">
        <h2 className="text-2xl tracking-tight">{topic.title}</h2>
        <p className="text-muted-foreground">{topic.description}</p>
      </header>
      <div className="divide-y rounded-xl border bg-card">
        {topic.questions.map((item) => (
          <details key={item.id} id={item.id} className="group scroll-mt-8">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-3 px-5 pb-5 text-muted-foreground leading-7">
              {item.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
