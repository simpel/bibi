-- ADR 0088 amended (2026-11-02): a group's maxPick is always a hard limit; more is an add-on.
ALTER TABLE "ItemCustomisationGroup" DROP COLUMN "allowExtras";
