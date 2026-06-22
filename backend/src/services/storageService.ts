import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const useS3 = !!process.env.S3_ENDPOINT && !!process.env.S3_ACCESS_KEY;

let s3: S3Client | null = null;
if (useS3) {
  s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY as string,
      secretAccessKey: process.env.S3_SECRET_KEY as string,
    },
    forcePathStyle: true,
  });
}

export interface StoredFile {
  storage: 'local' | 's3';
  path: string;
}

export async function saveFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<StoredFile> {
  if (useS3 && s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'hse-pro-files',
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return { storage: 's3', path: key };
  }
  const safeKey = key
    .split('/')
    .map((seg) => seg.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .join('/');
  const filePath = path.join(UPLOAD_DIR, safeKey);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return { storage: 'local', path: filePath };
}

export async function deleteFile(key: string): Promise<void> {
  if (useS3 && s3) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET || 'hse-pro-files',
        Key: key,
      })
    );
    return;
  }
  const safeKey = key
    .split('/')
    .map((seg) => seg.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .join('/');
  const filePath = path.join(UPLOAD_DIR, safeKey);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export async function getFile(key: string): Promise<Buffer | null> {
  if (useS3 && s3) {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET || 'hse-pro-files',
        Key: key,
      })
    );
    const chunks: Buffer[] = [];
    for await (const chunk of res.Body as any) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  const filePath = path.join(UPLOAD_DIR, path.basename(key));
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}
