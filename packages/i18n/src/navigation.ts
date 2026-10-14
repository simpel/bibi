import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Locale-aware navigation primitives bound to the Okazi routing config. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
