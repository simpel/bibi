import SiteRoute, { generateMetadata as siteMetadata } from "./(site)/site/page";

export const dynamic = "force-dynamic";
export const generateMetadata = siteMetadata;

/** `/:locale` is the public front page for everyone, signed in or not (ADR 0073). It never redirects. */
export default SiteRoute;
