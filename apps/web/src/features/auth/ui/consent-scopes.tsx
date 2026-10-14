import { useTranslations } from "next-intl";

const KNOWN_SCOPES: Record<string, "openid" | "profile" | "email" | "offline_access"> = {
  openid: "openid",
  profile: "profile",
  email: "email",
  offline_access: "offline_access",
};

export type ConsentScopesProps = { scopes: string[] };

/** Human-readable list of requested scopes; unknown scopes are shown verbatim. */
export function ConsentScopes({ scopes }: ConsentScopesProps) {
  const t = useTranslations("auth");
  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">{t("consentScopes")}</p>
      <ul className="grid list-disc gap-1 pl-5 text-sm">
        {scopes.map((scope) => {
          const key = KNOWN_SCOPES[scope];
          return <li key={scope}>{key ? t(`scope.${key}`) : scope}</li>;
        })}
      </ul>
    </div>
  );
}
