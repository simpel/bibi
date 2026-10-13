import { hasOAuthQuery } from "@/lib/oauth-query";

export type FinishSignInInput = {
  router: { replace: (href: string) => void; refresh: () => void };
  next: string;
};

/**
 * After a successful sign-in: inside an OAuth authorize flow Better Auth's client already
 * redirects to the next authorize step, so we must not navigate; otherwise go to `next`.
 */
export function finishSignIn({ router, next }: FinishSignInInput): void {
  if (hasOAuthQuery({ search: window.location.search })) return;
  router.replace(next);
  router.refresh();
}
