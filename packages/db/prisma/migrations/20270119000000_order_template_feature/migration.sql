-- ADR 0112: packages (order templates) get their own feature `orderTemplate`; `template` keeps
-- only run sheet definitions. Copy every `template:*` override to `orderTemplate:*` so nobody gains
-- or loses access to packages. Data only, no schema change.
INSERT INTO "PermissionOverride" (
  "id", "organizationId", "subjectType", "subjectId", "feature", "action", "effect", "status",
  "createdAt", "updatedAt", "createdBy"
)
SELECT gen_random_uuid()::text, o."organizationId", o."subjectType", o."subjectId", 'orderTemplate',
  o."action", o."effect", o."status", o."createdAt", CURRENT_TIMESTAMP, o."createdBy"
FROM "PermissionOverride" o
WHERE o."feature" = 'template'
ON CONFLICT ("organizationId", "subjectType", "subjectId", "feature", "action") DO NOTHING;
