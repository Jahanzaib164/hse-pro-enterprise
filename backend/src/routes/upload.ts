import { Router, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import { saveFile, deleteFile } from '../services/storageService';

const router = Router();
router.use(authenticate);

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES, ...DOC_TYPES];

const MB = 1024 * 1024;
const MAX_VIDEO = 50 * MB;
const MAX_OTHER = 10 * MB;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

interface UploadResult {
  url: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

function publicUrl(req: AuthRequest, key: string, stored: { storage: string }): string {
  if (stored.storage === 's3') {
    const base = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || '';
    const bucket = process.env.S3_BUCKET || 'hse-pro-files';
    return base ? `${base.replace(/\/$/, '')}/${bucket}/${key}` : `/api/upload/file/${key}`;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  return `${proto}://${host}/uploads/${key}`;
}

async function handleFile(
  req: AuthRequest,
  file: Express.Multer.File
): Promise<UploadResult> {
  const isVideo = VIDEO_TYPES.includes(file.mimetype);
  const limit = isVideo ? MAX_VIDEO : MAX_OTHER;
  if (file.size > limit) {
    throw new Error(
      `File "${file.originalname}" exceeds the ${limit / MB}MB limit for ${
        isVideo ? 'videos' : 'this file type'
      }`
    );
  }
  const fileId = randomUUID();
  const ext = path.extname(file.originalname).toLowerCase();
  const key = `${req.user!.org_id}/${fileId}${ext}`;
  const stored = await saveFile(key, file.buffer, file.mimetype);
  return {
    url: publicUrl(req, key, stored),
    fileId,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  };
}

router.post('/', upload.array('files', 20), async (req: AuthRequest, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      res.status(400).json({ error: 'No files provided' });
      return;
    }
    const results = await Promise.all(files.map((f) => handleFile(req, f)));
    if (results.length === 1) {
      res.status(201).json(results[0]);
      return;
    }
    res.status(201).json({ files: results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/multiple', upload.array('files', 20), async (req: AuthRequest, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      res.status(400).json({ error: 'No files provided' });
      return;
    }
    const results = await Promise.all(files.map((f) => handleFile(req, f)));
    res.status(201).json({ files: results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:fileId', async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const ext = typeof req.query.ext === 'string' ? req.query.ext : '';
    const key = `${req.user!.org_id}/${fileId}${ext}`;
    await deleteFile(key);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
