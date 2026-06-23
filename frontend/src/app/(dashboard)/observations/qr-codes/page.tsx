'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';

interface QRCode {
  id: string;
  code: string;
  label: string;
  site_name: string;
  url: string;
  qr_image: string;
  is_active: boolean;
  created_at: string;
}

export default function QRCodesPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [label, setLabel] = useState('');
  const [siteId, setSiteId] = useState('');
  const [newCode, setNewCode] = useState<QRCode | null>(null);

  const { data: codes = [], isLoading } = useQuery<QRCode[]>({
    queryKey: ['qr-codes'],
    queryFn: async () => {
      const r = await api.get('/qr/list');
      return r.data;
    },
  });

  const generate = useMutation({
    mutationFn: (body: { label: string; site_id?: string }) => api.post('/qr/generate', body),
    onSuccess: (res) => {
      setNewCode(res.data);
      qc.invalidateQueries({ queryKey: ['qr-codes'] });
    },
  });

  function download(qrDataUrl: string, code: string) {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${code}.png`;
    a.click();
  }

  function print(qr: QRCode) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><body style="text-align:center;font-family:Arial">
      <h2>HSE Pro Enterprise</h2>
      <h3>${qr.label}</h3>
      ${qr.site_name ? `<p>${qr.site_name}</p>` : ''}
      <img src="${qr.qr_image}" width="300" height="300"/>
      <p>Scan to report a hazard observation</p>
      <p style="font-size:12px;color:#666">${qr.url}</p>
    </body></html>`);
    win.print();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Codes"
        description="Generate QR codes for sites — workers scan to report observations"
        actions={<button onClick={() => setShowNew(true)} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium">Generate New QR Code</button>}
      />

      {showNew && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Generate QR Code</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Main Entrance, Warehouse A"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => generate.mutate({ label: label || 'Hazard Observation Point', site_id: siteId || undefined })}
                disabled={generate.isPending}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {generate.isPending ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={() => { setShowNew(false); setNewCode(null); }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>

          {newCode && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-300 font-medium mb-3">QR Code generated!</p>
              <div className="flex gap-6 items-start">
                <img src={newCode.qr_image} alt="QR Code" className="w-32 h-32 rounded-lg border border-green-200 dark:border-green-800" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-slate-400">Code: <span className="font-mono font-medium text-gray-900 dark:text-white">{newCode.code}</span></p>
                  <p className="text-sm text-gray-600 dark:text-slate-400 break-all">URL: <span className="text-sky-600 dark:text-sky-400">{newCode.url}</span></p>
                  <div className="flex gap-2">
                    <button onClick={() => download(newCode.qr_image, newCode.code)} className="px-3 py-1.5 bg-sky-500 text-white rounded text-xs font-medium hover:bg-sky-600">Download PNG</button>
                    <button onClick={() => print(newCode)} className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Print</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 animate-pulse">
              <div className="w-32 h-32 bg-gray-200 dark:bg-slate-700 rounded-lg mx-auto mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mx-auto" />
            </div>
          ))
        ) : codes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 dark:text-slate-500">
            No QR codes yet. Generate one to get started.
          </div>
        ) : (
          codes.map((qr) => (
            <div key={qr.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col items-center text-center">
              <img src={qr.qr_image} alt={qr.label} className="w-36 h-36 rounded-lg mb-3" />
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{qr.label}</p>
              {qr.site_name && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{qr.site_name}</p>}
              <p className="font-mono text-xs text-sky-600 dark:text-sky-400 mt-1">{qr.code}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => download(qr.qr_image, qr.code)} className="px-2.5 py-1 bg-sky-500 text-white rounded text-xs font-medium hover:bg-sky-600">Download</button>
                <button onClick={() => print(qr)} className="px-2.5 py-1 border border-gray-300 dark:border-slate-600 rounded text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Print</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
