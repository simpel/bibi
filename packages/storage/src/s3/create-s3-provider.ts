import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { appError, err, ok } from "@bibi/core";
import { storageFailure } from "../storage-failure";
import type {
  DeleteInput,
  GetInput,
  GetResult,
  KeyResult,
  PutInput,
  StorageProvider,
} from "../storage-provider";
import { validateKey } from "../validate-key";

/** The one S3 method the adapter uses, so tests can inject a fake client. */
export type S3Sender = { send(command: unknown): Promise<unknown> };

export type CreateS3ProviderInput = {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  client?: S3Sender;
};

type GetOutput = {
  Body?: { transformToByteArray(): Promise<Uint8Array> };
  ContentType?: string;
};

type Ctx = { client: S3Sender; bucket: string };

const invalidKey = () =>
  err({ error: appError({ code: "VALIDATION", message: "Invalid storage key" }) });

function isMissing({ cause }: { cause: unknown }) {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "name" in cause &&
    (cause.name === "NoSuchKey" || cause.name === "NotFound")
  );
}

async function put({ client, bucket, key, body, contentType }: Ctx & PutInput): Promise<KeyResult> {
  if (!validateKey({ key }).ok) return invalidKey();
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await client.send(command);
    return ok({ value: { key } });
  } catch (cause) {
    return storageFailure({ provider: "s3", operation: "put", cause });
  }
}

async function get({ client, bucket, key }: Ctx & GetInput): Promise<GetResult> {
  if (!validateKey({ key }).ok) return invalidKey();
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const out = (await client.send(command)) as GetOutput;
    const body = (await out.Body?.transformToByteArray()) ?? new Uint8Array();
    return ok({ value: { body, contentType: out.ContentType ?? "application/octet-stream" } });
  } catch (cause) {
    if (isMissing({ cause })) return ok({ value: null });
    return storageFailure({ provider: "s3", operation: "get", cause });
  }
}

async function remove({ client, bucket, key }: Ctx & DeleteInput): Promise<KeyResult> {
  if (!validateKey({ key }).ok) return invalidKey();
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return ok({ value: { key } });
  } catch (cause) {
    return storageFailure({ provider: "s3", operation: "delete", cause });
  }
}

/** S3-compatible storage (Hetzner Object Storage in production). Path-style addressing. */
export function createS3Provider({
  endpoint,
  region,
  bucket,
  accessKeyId,
  secretAccessKey,
  client,
}: CreateS3ProviderInput): StorageProvider {
  const sender: S3Sender =
    client ??
    new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  const ctx = { client: sender, bucket };
  return {
    name: "s3",
    put: (input) => put({ ...ctx, ...input }),
    get: (input) => get({ ...ctx, ...input }),
    delete: (input) => remove({ ...ctx, ...input }),
  };
}
