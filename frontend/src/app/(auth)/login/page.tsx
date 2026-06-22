'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@hse-pro.com');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password, mfaToken || undefined);
      if (res.mfa_required) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">HSE Pro Enterprise</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          {mfaRequired && (
            <div>
              <label className="mb-1 block text-sm font-medium">MFA Code</label>
              <input
                type="text"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="6-digit code"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo: admin@hse-pro.com / Password123!
        </p>
      </div>
    </div>
  );
}
