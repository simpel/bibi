# 0063 – File storage

- **Date:** 2026-10-22
- **Status:** Accepted
- **Related:** 0013 (hosting and deploy), 0003 (parity), 0061 (welcome flow)

## Context
- There was no file storage or upload path. The welcome flow needs a profile avatar, and venue images and order attachments will follow.

## Decision
1. A `@bibi/storage` package with a `StorageProvider` interface (`put`, `get`, `delete`), mirroring `MailProvider`. Adapters: S3-compatible (Hetzner Object Storage in production) and local disk for dev and tests, chosen by config.
2. Upload is a core operation taking base64 and returning a key, so web, GraphQL, REST and MCP share one input shape (ADR 0003). It allows a small set of image types and a size cap. Keys are random and scoped by the uploader, and a client-supplied key is never trusted without an ownership check.
3. Files are served through an authenticated route. There are no public buckets.
4. A stored file is referenced by an owned key on the record that uses it.

## Rejected
- Images as base64 in the database: bloats rows and backups.
- A third-party image service: another vendor and another place where data leaves the EU.
- A multipart REST endpoint only: breaks parity, since MCP and GraphQL could not upload.

## Consequences
- Production needs an S3 bucket and credentials.
- Compose needs a volume for the disk adapter.
