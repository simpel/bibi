"use client";

import {
  type ComponentProps,
  type ComponentType,
  createContext,
  type ReactNode,
  useContext,
} from "react";

/** Any anchor prop (and `ref`) passes through, so triggers such as a hover card can wrap it. */
export type AppLinkProps = Omit<ComponentProps<"a">, "href"> & {
  /** An app path such as `/items/<id>`; the app's link adds the locale and organization. */
  href: string;
};

const AppLinkContext = createContext<ComponentType<AppLinkProps> | null>(null);

export type AppLinkProviderProps = { link: ComponentType<AppLinkProps>; children: ReactNode };

/** The app's own link component, so components here can link to app pages. */
export function AppLinkProvider({ link, children }: AppLinkProviderProps) {
  return <AppLinkContext.Provider value={link}>{children}</AppLinkContext.Provider>;
}

/** A link to an app page through the app's link; a plain anchor without a provider (stories). */
export function AppLink(props: AppLinkProps) {
  const Link = useContext(AppLinkContext);
  return Link ? <Link {...props} /> : <a {...props} />;
}
