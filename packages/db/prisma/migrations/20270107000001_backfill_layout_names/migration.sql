-- ADR 0102: existing layouts are named after their setup.
UPDATE "SetupLayout" AS layout
SET "name" = setup."name"
FROM "Setup" AS setup
WHERE setup."id" = layout."setupId" AND layout."name" IS NULL;
