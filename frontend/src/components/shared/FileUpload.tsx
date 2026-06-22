'use client';

import * as React from 'react';
import { UploadCloud, X, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export interface UploadedFile {
  url: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface UploadItem {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  uploaded?: UploadedFile;
  error?: string;
}

export function FileUpload({
  onFilesChange,
  onUploaded,
  multiple = true,
  accept,
  autoUpload = false,
  label = 'Drag & drop files here, or click to browse',
}: {
  onFilesChange?: (files: File[]) => void;
  onUploaded?: (files: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: string;
  autoUpload?: boolean;
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [dragging, setDragging] = React.useState(false);

  const emit = React.useCallback(
    (list: UploadItem[]) => {
      onFilesChange?.(list.map((i) => i.file));
      onUploaded?.(
        list.filter((i) => i.uploaded).map((i) => i.uploaded as UploadedFile)
      );
    },
    [onFilesChange, onUploaded]
  );

  const uploadOne = async (file: File): Promise<UploadedFile> => {
    const form = new FormData();
    form.append('files', file);
    const { data } = await api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (data.files ? data.files[0] : data) as UploadedFile;
  };

  const addFiles = async (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const base: UploadItem[] = arr.map((file) => ({
      file,
      status: autoUpload ? 'uploading' : 'pending',
    }));
    const next = multiple ? [...items, ...base] : base.slice(0, 1);
    setItems(next);
    emit(next);

    if (!autoUpload) return;

    const results = await Promise.all(
      next.map(async (item): Promise<UploadItem> => {
        if (item.status !== 'uploading') return item;
        try {
          const uploaded = await uploadOne(item.file);
          return { ...item, status: 'done', uploaded };
        } catch (err: any) {
          return {
            ...item,
            status: 'error',
            error: err?.response?.data?.error || 'Upload failed',
          };
        }
      })
    );
    setItems(results);
    emit(results);
  };

  const removeAt = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    emit(next);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/50'
        )}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label}</p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => void addFiles(e.target.files)}
        />
      </div>
      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((it, i) => (
            <li
              key={`${it.file.name}-${i}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate">
                {it.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {it.status === 'done' && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                <span className="truncate">{it.file.name}</span>
                {it.status === 'error' && (
                  <span className="text-xs text-red-600">{it.error}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
