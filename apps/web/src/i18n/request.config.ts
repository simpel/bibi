import { createRequestConfig } from "@bibi/i18n/request";
import { loadOrganizationTimeZone } from "@/server/time-zones";

export default createRequestConfig({ loadTimeZone: loadOrganizationTimeZone });
