import { Badge, type BadgeProps } from "@bibi/ui";
import { useTranslations } from "next-intl";

const VARIANT: Record<string, BadgeProps["variant"]> = {
  trace: "outline",
  debug: "outline",
  info: "secondary",
  warn: "warning",
  error: "destructive",
  fatal: "destructive",
};

const KNOWN = ["trace", "debug", "info", "warn", "error", "fatal"] as const;

type Known = (typeof KNOWN)[number];

const isKnown = ({ level }: { level: string }): boolean =>
  (KNOWN as readonly string[]).includes(level);

export type LevelBadgeProps = { level: string };

export function LevelBadge({ level }: LevelBadgeProps) {
  const t = useTranslations("admin.levels");
  return (
    <Badge variant={VARIANT[level] ?? "outline"}>
      {isKnown({ level }) ? t(level as Known) : level}
    </Badge>
  );
}
