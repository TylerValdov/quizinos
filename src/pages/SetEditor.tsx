import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSets, makeCard } from '../context/SetsContext';
import type { Card } from '../types';
import {
  CARD_SEPARATORS,
  TERM_SEPARATORS,
  parseImportText,
} from '../lib/importParser';

interface SetEditorProps {
  mode: 'create' | 'edit';
}

export default function SetEditor({ mode }: SetEditorProps) {
  const { id } = useParams();
  const { getSet, createSet, updateSet, deleteSet } = useSets();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const existing = mode === 'edit' && id ? getSet(id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [cards, setCards] = useState<Card[]>(
    existing?.cards ?? [makeCard('', ''), makeCard('', '')],
  );
  const [tab, setTab] = useState<'manual' | 'import'>(
    searchParams.get('import') === '1' ? 'import' : 'manual',
  );

  const [importText, setImportText] = useState('');
  const [termSepChoice, setTermSepChoice] = useState<string>(TERM_SEPARATORS[0].value);
  const [termSepCustom, setTermSepCustom] = useState('');
  const [cardSepChoice, setCardSepChoice] = useState<string>(CARD_SEPARATORS[0].value);
  const [cardSepCustom, setCardSepCustom] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (mode === 'edit' && !existing) {
      navigate('/', { replace: true });
    }
  }, [mode, existing, navigate]);

  // --- Autosave -----------------------------------------------------------
  // Losing 100 hand-typed cards because a click landed on the wrong link is
  // exactly the failure this exists to prevent: a set is created/updated in
  // Firestore a moment after every edit, not only when "Create set" /
  // "Save changes" is clicked. Refs (not context functions) back the save
  // path so its identity never changes and the debounce effect only resets
  // on real edits, not on every Firestore echo of our own writes.
  const savedIdRef = useRef<string | null>(existing?.id ?? null);
  const contextRef = useRef({ createSet, updateSet });
  contextRef.current = { createSet, updateSet };
  const latestRef = useRef({ title, description, cards });
  latestRef.current = { title, description, cards };
  const debounceTimerRef = useRef<number | null>(null);
  const hasUnsavedChangesRef = useRef(false);
  const skipFirstRef = useRef(true);

  const flushSave = useCallback(() => {
    const { title, description, cards } = latestRef.current;
    const hasContent = title.trim() || cards.some((c) => c.term.trim() || c.definition.trim());
    if (!hasContent) return;

    const cardsToSave = cards.filter((c) => c.term.trim() || c.definition.trim());
    const { createSet, updateSet } = contextRef.current;
    if (savedIdRef.current) {
      updateSet(savedIdRef.current, { title: title.trim() || 'Untitled set', description, cards: cardsToSave });
    } else {
      const created = createSet(title.trim() || 'Untitled set', description, cardsToSave);
      savedIdRef.current = created.id;
    }
    hasUnsavedChangesRef.current = false;
    setSaveStatus('saved');
  }, []);

  useEffect(() => {
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }
    hasUnsavedChangesRef.current = true;
    setSaveStatus('saving');
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(flushSave, 1000);
    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, cards]);

  // Flush immediately on unmount (e.g. navigating away mid-debounce) instead
  // of letting the pending timer above get cancelled with nothing saved.
  useEffect(() => {
    return () => {
      if (hasUnsavedChangesRef.current) {
        if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
        flushSave();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveTermSep = termSepChoice === 'custom' ? termSepCustom : termSepChoice;
  const effectiveCardSep = cardSepChoice === 'custom' ? cardSepCustom : cardSepChoice;
  const preview = parseImportText(importText, effectiveTermSep, effectiveCardSep);

  function handleCardChange(cardId: string, field: 'term' | 'definition', value: string) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, [field]: value } : c)));
  }

  function addCardRow() {
    setCards((prev) => [...prev, makeCard('', '')]);
  }

  function removeCardRow(cardId: string) {
    setCards((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== cardId) : prev));
  }

  function applyImport() {
    if (preview.length === 0) {
      setError('Nothing to import — check your separators or the pasted text.');
      return;
    }
    const imported = preview.map((p) => makeCard(p.term, p.definition));
    setCards((prev) => {
      const nonEmpty = prev.filter((c) => c.term.trim() || c.definition.trim());
      return [...nonEmpty, ...imported];
    });
    setImportText('');
    setError('');
    setTab('manual');
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ''));
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleSave() {
    const cleanCards = cards
      .map((c) => ({ ...c, term: c.term.trim(), definition: c.definition.trim() }))
      .filter((c) => c.term && c.definition);

    if (!title.trim()) {
      setError('Give your set a title.');
      return;
    }
    if (cleanCards.length < 1) {
      setError('Add at least one complete term/definition pair.');
      return;
    }

    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    hasUnsavedChangesRef.current = false;

    if (mode === 'create') {
      if (savedIdRef.current) {
        updateSet(savedIdRef.current, { title: title.trim(), description: description.trim(), cards: cleanCards });
        navigate(`/sets/${savedIdRef.current}`);
      } else {
        const created = createSet(title.trim(), description.trim(), cleanCards);
        navigate(`/sets/${created.id}`);
      }
    } else if (existing) {
      updateSet(existing.id, { title: title.trim(), description: description.trim(), cards: cleanCards });
      navigate(`/sets/${existing.id}`);
    }
  }

  function handleDelete() {
    if (!existing) return;
    if (confirm(`Delete "${existing.title}"? This can't be undone.`)) {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      hasUnsavedChangesRef.current = false;
      deleteSet(existing.id);
      navigate('/');
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{mode === 'create' ? 'Create a set' : 'Edit set'}</h1>
        {saveStatus !== 'idle' && (
          <span className="text-xs text-slate-400">
            {saveStatus === 'saving' ? 'Saving…' : '✓ Saved'}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Spanish Unit 3 Vocab"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this set for?"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            tab === 'manual' ? 'bg-brand text-white' : 'bg-white border border-slate-300'
          }`}
          onClick={() => setTab('manual')}
        >
          Cards ({cards.length})
        </button>
        <button
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            tab === 'import' ? 'bg-brand text-white' : 'bg-white border border-slate-300'
          }`}
          onClick={() => setTab('import')}
        >
          Import from Quizlet
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {tab === 'manual' ? (
        <div className="space-y-3 mb-6">
          {cards.map((card, i) => (
            <div
              key={card.id}
              className="rounded-xl border border-slate-200 bg-white p-3 flex gap-3 items-start"
            >
              <span className="text-xs text-slate-400 mt-3 w-5 text-right">{i + 1}</span>
              <div className="flex-1 grid sm:grid-cols-2 gap-2">
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Term"
                  value={card.term}
                  onChange={(e) => handleCardChange(card.id, 'term', e.target.value)}
                />
                <textarea
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-y"
                  placeholder="Definition"
                  rows={Math.max(1, card.definition.split('\n').length)}
                  value={card.definition}
                  onChange={(e) => handleCardChange(card.id, 'definition', e.target.value)}
                />
              </div>
              <button
                onClick={() => removeCardRow(card.id)}
                className="text-slate-400 hover:text-red-500 text-sm mt-2 px-2"
                title="Remove card"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addCardRow}
            className="w-full rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-brand hover:text-brand"
          >
            + Add card
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6 space-y-4">
          <p className="text-sm text-slate-600">
            In Quizlet, open your set → <strong>⋯</strong> menu → <strong>Export</strong>, copy the
            text, and paste it below. Or upload a .txt file with the same format.
          </p>

          <textarea
            className="w-full h-40 rounded-md border border-slate-300 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder={'term1\tdefinition1\nterm2\tdefinition2'}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Upload .txt file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Between term and definition</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={termSepChoice}
                onChange={(e) => setTermSepChoice(e.target.value)}
              >
                {TERM_SEPARATORS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {termSepChoice === 'custom' && (
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Custom separator"
                  value={termSepCustom}
                  onChange={(e) => setTermSepCustom(e.target.value)}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Between cards</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={cardSepChoice}
                onChange={(e) => setCardSepChoice(e.target.value)}
              >
                {CARD_SEPARATORS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {cardSepChoice === 'custom' && (
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Custom separator"
                  value={cardSepCustom}
                  onChange={(e) => setCardSepCustom(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="text-sm text-slate-500">
            {importText.trim()
              ? `${preview.length} card${preview.length === 1 ? '' : 's'} detected`
              : 'Paste text above to preview cards'}
          </div>

          {preview.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 text-sm divide-y">
              {preview.slice(0, 20).map((p, i) => (
                <div key={i} className="flex px-3 py-1.5 gap-3">
                  <span className="flex-1 truncate">{p.term}</span>
                  <span className="flex-1 truncate text-slate-500">{p.definition}</span>
                </div>
              ))}
              {preview.length > 20 && (
                <div className="px-3 py-1.5 text-slate-400">…and {preview.length - 20} more</div>
              )}
            </div>
          )}

          <button
            onClick={applyImport}
            disabled={preview.length === 0}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-40"
          >
            Add {preview.length || ''} card{preview.length === 1 ? '' : 's'} to this set
          </button>
        </div>
      )}

      <div className="flex justify-between">
        <div>
          {mode === 'edit' && (
            <button
              onClick={handleDelete}
              className="rounded-md border border-red-200 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50"
            >
              Delete set
            </button>
          )}
        </div>
        <button
          onClick={handleSave}
          className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {mode === 'create' ? 'Create set' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
