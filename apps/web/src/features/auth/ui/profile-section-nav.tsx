import { getTranslations } from "next-intl/server";
import { ProfileSectionList } from "./profile-section-list";
import { ProfileSectionSelect } from "./profile-section-select";
import { PROFILE_SECTIONS } from "./profile-sections";

/** In-page nav: a sticky list of anchors on the left, a dropdown at the top on small screens. */
export async function ProfileSectionNav() {
  const t = await getTranslations("profile");
  const sections = PROFILE_SECTIONS.map(({ id, label }) => ({ id, label: t(label) }));
  return (
    <>
      <ProfileSectionSelect sections={sections} label={t("sectionsNav")} />
      <ProfileSectionList sections={sections} label={t("sectionsNav")} />
    </>
  );
}
