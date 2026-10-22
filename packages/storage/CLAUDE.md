# @bibi/storage – context for Claude

File storage behind one interface (ADR 0063). The only package that talks to S3 or the disk store.

## API
- `StorageProvider`: `put({ key, body, contentType })`, `get({ key })` → `{ body, contentType } | null`, `delete({ key })`. All return `Result`; a missing key is `null` on `get` and success on `delete`.
- `getStorage()`: the process-wide provider. `setStorage({ provider })` overrides it in tests; restore with `provider: undefined`.
- `newStorageKey({ ownerId })` → `<ownerId>/<uuid>`. Use it for every new file.
- `validateKey({ key })`: adapters call it; a bad key is `VALIDATION`.

## Rules
- Never build a key from client input. Check that the caller owns the key's `<ownerId>` prefix before `get` or `delete`. Why: ADR 0063.
- Keys are safe segments joined by `/`: no `..`, no absolute paths, no `\`.
- Failures return `UNAVAILABLE` and log `storage.failed` with `provider` and `operation`. Never log keys or bodies.
- Read env only through `@bibi/config`. Do not import the S3 SDK outside `src/s3/`.

## Adapters
- `disk` (default): files under `STORAGE_DISK_DIR` (default `./.storage` from the repo root, git-ignored), content type in a `<key>.meta.json` sidecar. Compose mounts a volume for the web service.
- `s3`: any S3-compatible service (Hetzner Object Storage), path-style. Needs `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and usually `S3_ENDPOINT`; `STORAGE_DRIVER=s3` without them fails env validation.
- Chosen by `STORAGE_DRIVER` in `@bibi/config`.

## Tests
- Disk against a temp directory, S3 with an injected `client`. No network.
