'use client';
import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  className?: string;
}

export function SignaturePad({ onSave, className }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [saved, setSaved] = useState(false);

  function clear() {
    sigRef.current?.clear();
    setSaved(false);
  }

  function save() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert('Please provide a signature first');
      return;
    }
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    onSave(dataUrl);
    setSaved(true);
  }

  return (
    <div className={className}>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="#0f172a"
          canvasProps={{ className: 'w-full', height: 160 }}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={clear}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {saved ? '✓ Saved' : 'Save Signature'}
        </button>
      </div>
      {saved && <p className="text-xs text-green-600 mt-1">Signature saved successfully</p>}
    </div>
  );
}
