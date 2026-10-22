"use client";

import { Link, usePathname } from "@bibi/i18n/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { DOC_SECTIONS, docHref, MCP_REFERENCE_HREF, REST_REFERENCE_HREF } from "../pages";

/** `external` links leave the locale-prefixed app routes (e.g. the API's own Scalar page). */
type NavLink = { href: string; label: string; external?: boolean };

type NavGroupProps = { label: string; links: NavLink[] };

function NavGroup({ label, links }: NavGroupProps) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {links.map(({ href, label: text, external }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton asChild isActive={pathname === href}>
                {external ? <a href={href}>{text}</a> : <Link href={href}>{text}</Link>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** Guide, developer and reference sections of the public docs. */
export function DocsNav() {
  const t = useTranslations("docs");
  const guide = DOC_SECTIONS.guide.map((slug) => ({
    href: docHref({ section: "guide", slug }),
    label: t(`pages.guide.${slug}.title`),
  }));
  const developers = DOC_SECTIONS.developers.map((slug) => ({
    href: docHref({ section: "developers", slug }),
    label: t(`pages.developers.${slug}.title`),
  }));
  const reference = [
    { href: REST_REFERENCE_HREF, label: t("reference.rest.title"), external: true },
    { href: MCP_REFERENCE_HREF, label: t("reference.mcp.title") },
  ];
  return (
    <>
      <NavGroup label={t("sections.guide")} links={guide} />
      <NavGroup label={t("sections.developers")} links={developers} />
      <NavGroup label={t("sections.reference")} links={reference} />
    </>
  );
}
