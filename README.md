# QuizletCopy

A free, self-hosted clone of Quizlet's **Learn** mode: create study sets by hand or
import them from a Quizlet export, then drill them with flashcards or an adaptive
Learn mode (multiple choice → written, until every term is mastered).

Everything is stored in your browser's `localStorage` — there's no backend, no
accounts, and no data leaves your machine.

## Features

- **Create sets** manually (term/definition rows) or **import** pasted text
  exported from Quizlet (Set menu → **Export**), with the same configurable
  term/card separators Quizlet's own importer uses. A `.txt` upload works too.
- **Flashcards** — flip, shuffle, step through at your own pace.
- **Learn** — an adaptive quiz modeled on Quizlet Learn: each card starts as
  multiple choice, moves to written recall after the first correct answer, and
  is "mastered" after two consecutive correct answers. Missed cards get
  reinserted into the round so you see them again soon. Progress persists
  per-set so you can resume later.

## Local development

```bash
npm install
npm run dev
```

## Deploying for free

This is a static Vite build (`npm run build` → `dist/`), so it works on either
platform below with zero server code. Routing uses a hash-based router
(`#/sets/...`), so there's no special rewrite/404 configuration needed on
either host.

### Vercel

1. Push this folder to a GitHub repo.
2. [Import the repo in Vercel](https://vercel.com/new) — it auto-detects Vite
   (build command `npm run build`, output directory `dist`).
3. Deploy. Done.

### GitHub Pages

A workflow is already set up at
[.github/workflows/deploy.yml](.github/workflows/deploy.yml):

1. Push this folder to a GitHub repo.
2. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually) — it builds and deploys `dist/`
   automatically.

## Importing from Quizlet

In Quizlet: open your set → the **⋯** menu → **Export** → copy the text it
shows you. Paste that into the **Import from Quizlet** tab when creating or
editing a set here, matching the separators shown (defaults are Tab between
term/definition and New line between cards, which matches Quizlet's default
export format).
