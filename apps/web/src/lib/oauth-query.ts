export type OAuthQueryInput = { search: string };

/** True on pages opened by the OAuth authorize flow (Better Auth signs the query with `sig`). */
export function hasOAuthQuery({ search }: OAuthQueryInput): boolean {
  return new URLSearchParams(search).has("sig");
}
