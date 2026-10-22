# 0063 – File storage

- **Date:** 2026-10-22
- **Status:** Proposed
- **Related:** 0013 (hosting and deploy), 0003 (parity), 0061 (welcome flow)

## Context
- Checked on 2026-10-22: there is no file storage, no upload endpoint and no multipart handling in `apps/` or `packages/`. `User.image` is never read; avatars are initials.
- The welcome flow (ADR 0061) needs a profile avatar. Later needs (venue images, attachments on tickets) will use the same storage.

## Decision
1. **New package `@bibi/storage`** with a `StorageProvider` interface (`put`, `get`, `delete`). It mirrors `MailProvider` in `@bibi/mail`. Two adapters:
   - **`s3`:** any S3-compatible service (Hetzner Object Storage in production).
   - **`disk`:** a local directory, used in dev and tests.

   Chosen by `STORAGE_DRIVER` through `@bibi/config`.
2. **Upload is a core operation.** `file.upload({ contentType, base64 })` returns `{ key }`.
   - Allowed types: png, jpeg and webp.
   - Maximum size: 2 MB.
   - Base64 keeps one input shape on web, GraphQL, REST and MCP (ADR 0003).
   - Keys are random and scoped by the uploader. Nothing reads a key from the client without checking that the caller owns it.
3. **Files are served by `apps/web/src/app/api/files/[key]/route.ts`.** It is wrapped in `withRequestLogging` and needs a session. There are no public buckets.
4. **`User.avatarKey` references the stored file** (owned, ADR 0051). `User.image` stays unused.

## Consequences
- Production needs an S3 bucket and credentials in Coolify (`docs/runbooks/deploy.md`).
- Docker compose gets a volume for the `disk` adapter.

## Alternatives rejected
- **Images as base64 in the database:** it bloats rows and backups, and every read goes through Postgres.
- **A third-party image service:** another vendor and another place where data leaves the EU, for one avatar.
- **A multipart REST endpoint only:** it breaks parity, because MCP and GraphQL could not upload.
