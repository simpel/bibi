import { useTranslations } from "next-intl";

const KNOWN_SCOPES = ["openid", "profile", "email", "offline_access"] as const;
type KnownScope = (typeof KNOWN_SCOPES)[number];

const isKnown = (scope: string): scope is KnownScope =>
  (KNOWN_SCOPES as readonly string[]).includes(scope);

export type ConsentScopesProps = { scopes: string[] };

/** Human-readable list of requested scopes; unknown scopes are shown verbatim. */
export function ConsentScopes({ scopes }: ConsentScopesProps) {
  const t = useTranslations("auth");
  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">{t("consentScopes")}</p>
      <ul className="grid list-disc gap-1 pl-5 text-sm">
        {scopes.map((scope) => (
          <li key={scope}>{isKnown(scope) ? t(`scope.${scope}`) : scope}</li>
        ))}
      </ul>
    </div>
  );
}
