'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface SiteInfo {
  code: string;
  label: string;
  site_name: string;
  org_name: string;
}

export default function QRReportPage() {
  const { code } = useParams<{ code: string }>();
  const [site, setSite] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNo, setRefNo] = useState('');

  const [form, setForm] = useState({
    observer_name: '',
    observation_type: 'UNSAFE_CONDITION',
    description: '',
    risk_rating: 'MEDIUM',
    gps_lat: '',
    gps_lng: '',
  });

  useEffect(() => {
    fetch(`${API}/qr/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSite(data);
      })
      .catch(() => setError('Failed to load site information'))
      .finally(() => setLoading(false));

    // Try to get GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setForm((f) => ({
          ...f,
          gps_lat: String(pos.coords.latitude),
          gps_lng: String(pos.coords.longitude),
        }));
      });
    }
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/qr/${code}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.reference_no) {
        setRefNo(data.reference_no);
        setSubmitted(true);
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-slate-400">Loading...</div>
    </div>
  );

  if (error && !site) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="text-red-400 text-xl mb-2">Invalid QR Code</div>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-slate-800 rounded-t-xl p-6 border border-slate-700 text-center">
          <div className="text-sky-400 font-bold text-xl">HSE Pro Enterprise</div>
          <div className="text-white font-semibold mt-1">{site?.org_name}</div>
          {site?.site_name && <div className="text-slate-400 text-sm mt-1">📍 {site.site_name}</div>}
          <div className="text-slate-500 text-xs mt-1">{site?.label}</div>
        </div>

        {submitted ? (
          <div className="bg-slate-800 rounded-b-xl p-8 border border-t-0 border-slate-700 text-center">
            <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-xl">Report Submitted!</h2>
            <p className="text-slate-400 mt-2">Your observation has been recorded.</p>
            <div className="mt-4 bg-slate-700 rounded-lg p-4">
              <p className="text-slate-300 text-sm">Reference Number</p>
              <p className="text-sky-400 font-mono font-bold text-lg">{refNo}</p>
            </div>
            <p className="text-slate-500 text-xs mt-4">
              The HSE team has been notified. Thank you for keeping your workplace safe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-800 rounded-b-xl border border-t-0 border-slate-700 p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Report a Hazard Observation</h2>

            {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded text-sm">{error}</div>}

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Your Name</label>
              <input
                type="text"
                value={form.observer_name}
                onChange={(e) => setForm({ ...form, observer_name: e.target.value })}
                placeholder="Optional — leave blank to report anonymously"
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-base"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Observation Type *</label>
              <select
                value={form.observation_type}
                onChange={(e) => setForm({ ...form, observation_type: e.target.value })}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-base"
              >
                <option value="UNSAFE_ACT">Unsafe Act</option>
                <option value="UNSAFE_CONDITION">Unsafe Condition</option>
                <option value="POSITIVE">Positive Observation</option>
                <option value="GOOD_CATCH">Good Catch</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Risk Level</label>
              <div className="grid grid-cols-4 gap-2">
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, risk_rating: r })}
                    className={`py-2 rounded-lg text-sm font-medium border transition ${
                      form.risk_rating === r
                        ? r === 'LOW' ? 'bg-green-600 border-green-500 text-white'
                          : r === 'MEDIUM' ? 'bg-yellow-600 border-yellow-500 text-white'
                          : r === 'HIGH' ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-red-600 border-red-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Description *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what you observed, where it was, and any immediate danger..."
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-base resize-none"
              />
            </div>

            {(form.gps_lat && form.gps_lng) && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Location captured: {parseFloat(form.gps_lat).toFixed(4)}, {parseFloat(form.gps_lng).toFixed(4)}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !form.description.trim()}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-600 text-white font-bold rounded-xl transition text-base"
            >
              {submitting ? 'Submitting...' : 'Submit Observation'}
            </button>

            <p className="text-slate-500 text-xs text-center">
              By submitting this report, you are helping to keep your workplace safe.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
