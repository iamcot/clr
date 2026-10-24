import 'server-only'
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PRESIGN_TTL_SECONDS } from '@/config/uploads'
import { requireEnv } from '@/lib/env'

const JPEG_HEAD_BYTES = 3

function createClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  })
}

type UploadUrlRequest = { key: string; contentType: string; contentLength: number }

// Độ dài file nằm trong chữ ký nên trình duyệt chỉ PUT được đúng số byte đã khai báo
export async function createUploadUrl({ key, contentType, contentLength }: UploadUrlRequest): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: requireEnv('R2_BUCKET'),
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  })
  return getSignedUrl(createClient(), command, { expiresIn: PRESIGN_TTL_SECONDS })
}

export function publicUrl(key: string): string {
  return `${requireEnv('R2_PUBLIC_BASE_URL').replace(/\/$/, '')}/${key}`
}

export async function deleteObject(key: string): Promise<void> {
  await createClient().send(new DeleteObjectCommand({ Bucket: requireEnv('R2_BUCKET'), Key: key }))
}

// Trả null nếu object chưa tồn tại
export async function readObjectInfo(key: string): Promise<{ bytes: number; head: Uint8Array } | null> {
  const client = createClient()
  const bucket = requireEnv('R2_BUCKET')
  try {
    const info = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    const object = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key, Range: `bytes=0-${JPEG_HEAD_BYTES - 1}` }),
    )
    const head = (await object.Body?.transformToByteArray()) ?? new Uint8Array()
    return { bytes: info.ContentLength ?? 0, head }
  } catch {
    return null
  }
}
