import { Link } from "@/lib/navigation";

export type AttentionRowProps = { href: string; title: string; detail: string };

/** One thing to act on: what it is, linked to where it is handled, and why. */
export function AttentionRow({ href, title, detail }: AttentionRowProps) {
  return (
    <li className="grid gap-0.5 py-2 first:pt-0 last:pb-0">
      <Link href={href} className="text-sm font-medium hover:underline">
        {title}
      </Link>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </li>
  );
}
