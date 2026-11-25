import { ROUTES } from "@/lib/routes";

/** A booking template's page (`/packages/<id>`), edited in place there. */
export const orderTemplateHref = ({ id }: { id: string }) =>
  `${ROUTES.packages}/${encodeURIComponent(id)}`;
