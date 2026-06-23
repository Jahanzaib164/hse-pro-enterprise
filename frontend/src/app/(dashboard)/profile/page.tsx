'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  job_title: string;
  phone: string;
  mfa_enabled: boolean;
}

interface Session {
  id: string;
  device_info: { userAgent: string; browser?: string };
  ip_address: string;
  created_at: string;
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');
  const [pwForm, setPwForm] = useState({ current: '', password: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [mfaQR, setMfaQR] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaMsg, setMfaMsg] = useState('');

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/auth/me')).data,
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: async () => (await api.get('/users/me/sessions')).data,
    enabled: activeTab === 'sessions',
  });

  const updateProfile = useMutation({
    mutationFn: (data: Partial<UserProfile>) => api.patch('/users/me', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });

  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate(editForm);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.password !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.password.length < 8) { setPwError('Min 8 characters'); return; }
    try {
      await api.post('/users/me/change-password', { current_password: pwForm.current, new_password: pwForm.password });
      setPwSuccess('Password changed successfully');
      setPwForm({ current: '', password: '', confirm: '' });
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to change password');
    }
  }

  async function setupMFA() {
    try {
      const { data } = await api.post('/users/me/mfa/setup');
      setMfaQR(data.qr_code);
    } catch { setMfaMsg('Failed to setup MFA'); }
  }

  async function verifyMFA() {
    try {
      await api.post('/users/me/mfa/verify', { token: mfaToken });
      setMfaMsg('MFA enabled successfully!');
      setMfaQR('');
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch { setMfaMsg('Invalid code. Please try again.'); }
  }

  async function disableMFA() {
    if (!confirm('Disable MFA? This will reduce account security.')) return;
    try {
      await api.delete('/users/me/mfa');
      setMfaMsg('MFA disabled');
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch { setMfaMsg('Failed to disable MFA'); }
  }

  async function revokeSession(id: string) {
    try {
      await api.delete(`/users/me/sessions/${id}`);
      qc.invalidateQueries({ queryKey: ['sessions'] });
    } catch {}
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="My Profile" description="Manage your account settings and security" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700">
        {(['profile', 'security', 'sessions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${
              activeTab === t
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">{profile?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded text-xs font-medium">{profile?.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">First Name</label>
              <input
                defaultValue={profile?.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Last Name</label>
              <input
                defaultValue={profile?.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Job Title</label>
              <input
                defaultValue={profile?.job_title}
                onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone</label>
              <input
                defaultValue={profile?.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfile.isPending || Object.keys(editForm).length === 0}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {updateProfile.isSuccess && <p className="text-green-600 text-sm text-right">Profile updated!</p>}
        </form>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Change Password */}
          <form onSubmit={changePassword} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
            {pwError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded text-sm">{pwError}</div>}
            {pwSuccess && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-3 py-2 rounded text-sm">{pwSuccess}</div>}
            {['current', 'password', 'confirm'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 capitalize">
                  {field === 'current' ? 'Current Password' : field === 'password' ? 'New Password' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  value={pwForm[field as keyof typeof pwForm]}
                  onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            ))}
            <button type="submit" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium">Update Password</button>
          </form>

          {/* MFA */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Status: <span className={profile?.mfa_enabled ? 'text-green-600 dark:text-green-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                    {profile?.mfa_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
              </div>
              {profile?.mfa_enabled ? (
                <button onClick={disableMFA} className="px-3 py-1.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20">
                  Disable MFA
                </button>
              ) : (
                <button onClick={setupMFA} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                  Enable MFA
                </button>
              )}
            </div>
            {mfaMsg && <p className="text-sm text-sky-600 dark:text-sky-400">{mfaMsg}</p>}
            {mfaQR && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                </p>
                <img src={mfaQR} alt="MFA QR Code" className="w-48 h-48 border border-gray-200 dark:border-slate-700 rounded-lg" />
                <div className="flex gap-2">
                  <input
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    placeholder="Enter 6-digit code to verify"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <button onClick={verifyMFA} className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium">Verify</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-gray-500 dark:text-slate-400 text-sm">No active sessions found.</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-slate-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {s.device_info?.browser || 'Browser Session'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">IP: {s.ip_address} · Started: {new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => revokeSession(s.id)}
                    className="px-3 py-1 text-xs border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
