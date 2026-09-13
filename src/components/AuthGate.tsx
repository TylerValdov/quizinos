import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginScreen from './LoginScreen';

/**
 * Nothing behind this — no routes, no data, no UI — renders until
 * Firebase confirms an authenticated session. There is no sign-up flow
 * anywhere in the app, so this only ever admits the one account created
 * manually in the Firebase console.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
