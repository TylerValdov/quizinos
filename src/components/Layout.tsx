import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function Layout({ children }: { children: ReactNode }) {
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
            <Link
              to="/sets/new"
              className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
            >
              + Create set
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
      <footer className="text-center text-xs text-slate-400 py-6">
        A study-only project, unaffiliated with Quizlet. All data stays in your browser.
      </footer>
    </div>
  );
}
