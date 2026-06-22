'use client';

import * as React from 'react';
import { UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FileUpload({
  onFilesChange,
  multiple = true,
  accept,
  label = 'Drag & drop files here, or click to browse',
}: {
  onFilesChange?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragging, setDragging] = React.useState(false);

  const update = (list: File[]) => {
    setFiles(list);
    onFilesChange?.(list);
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    update(multiple ? [...files, ...arr] : arr.slice(0, 1));
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
          addFiles(e.dataTransfer.files);
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
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => update(files.filter((_, idx) => idx !== i))}
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
