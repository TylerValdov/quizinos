import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const onCreatePage = location.pathname === '/sets/new';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-brand">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              Q
            </span>
            QuizletCopy
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {/* Outlined, not solid — this navigates to a fresh blank set and
                shouldn't be mistaken for the actual save action on whichever
                set is currently open below. Hidden entirely on the create
                page itself, where it would just be a confusing duplicate of
                the "Create set" button in the form. */}
            {!onCreatePage && (
              <Link
                to="/sets/new"
                className="rounded-md border border-brand text-brand px-3 py-1.5 font-medium hover:bg-brand/5"
              >
                + Create set
              </Link>
            )}
            {user && (
              <button
                onClick={() => void signOut()}
                title={user.email ?? undefined}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
      <footer className="text-center text-xs text-slate-400 py-6">
        A study-only project, unaffiliated with Quizlet. Private to your account.
      </footer>
    </div>
  );
}
