import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Locale-aware navigation primitives bound to the Bibi routing config. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
