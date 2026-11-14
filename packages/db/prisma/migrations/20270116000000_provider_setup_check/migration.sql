-- ADR 0108: the last setup check at the provider (accounts and codings Bibi books to), kept on the
-- connection. Expand only: two nullable columns, nothing reads them until this release.
ALTER TABLE "ProviderConnection" ADD COLUMN "setupCheckedAt" TIMESTAMP(3),
ADD COLUMN "setupIssues" JSONB;
