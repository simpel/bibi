# Hetzner Object Storage runbook

Implements file storage for production as defined in [ADR 0063](../decisions/0063-file-storage.md).

## Overview

User uploads (profile photos, venue pictures, order attachments) are stored in an S3-compatible object storage.
In production, Hetzner Object Storage is used. In local development, a MinIO container in `docker-compose.yml` emulates this setup.

The bucket is strictly **private**. Files are never served directly via public URLs; they are routed through `/api/files/<key>` which enforces authentication and organization authorization.

---

## Production Setup (Hetzner)

### 1. Create the Bucket
1. Log in to the [Hetzner Cloud Console](https://console.hetzner.cloud/).
2. Navigate to **Object Storage** in your project.
3. Choose **Create Bucket**:
   - **Name**: e.g. `bibi-files-prod` (must be unique).
   - **Location**: choose the datacenter matching your server (e.g. `fsn1` / Falkenstein or `hel1` / Helsinki).
   - **Access**: keep it **Private**.

### 2. Create S3 Credentials
1. In the Hetzner Console, go to **Object Storage** > **Manage Credentials**.
2. Click **Create S3 Credential**.
3. Label it appropriately (e.g. `bibi-app-files`).
4. Save the generated **Access Key** and **Secret Key**. Use a dedicated credential separate from `BACKUP_S3_*`.

### 3. Configure Coolify (`.env.prod`)
In Coolify under the application resource environment variables, set:

| Variable | Description | Example |
| --- | --- | --- |
| `STORAGE_DRIVER` | Selects S3 storage provider | `s3` |
| `S3_ENDPOINT` | Hetzner S3 endpoint URL | `https://fsn1.your-objectstorage.com` |
| `S3_REGION` | S3 region | `fsn1` (or `eu-central`) |
| `S3_BUCKET` | The bucket name | `bibi-files-prod` |
| `S3_ACCESS_KEY` | Generated S3 Access Key | `<access-key>` |
| `S3_SECRET_KEY` | Generated S3 Secret Key | `<secret-key>` |

Deploy the changes. The `web` and `worker` containers inherit these variables via `x-app-env`.

---

## Local Development (Docker MinIO)

Local development matches production using MinIO:

1. Run `docker compose up -d minio minio-init` (or `pnpm docker:up`).
2. `minio` listens on:
   - S3 API: `http://localhost:9100` (mapped to internal `9000`)
   - Console: `http://localhost:9101` (mapped to internal `9001`)
3. `minio-init` automatically creates the private bucket `bibi-files`.
4. The root `.env` configures local access:
   ```env
   STORAGE_DRIVER=s3
   S3_ENDPOINT=http://localhost:9100
   S3_REGION=us-east-1
   S3_BUCKET=bibi-files
   S3_ACCESS_KEY=bibi
   S3_SECRET_KEY=bibi-minio-dev
   ```

---

## Verification

To verify that object storage works:
1. Ensure MinIO is running (`docker compose ps minio`).
2. Run storage integration tests:
   ```sh
   pnpm --filter @bibi/storage test
   ```
3. Upload an avatar in the web application (e.g. at `/:org/welcome/profile`), and verify that the photo displays properly and saves to the user's profile.
