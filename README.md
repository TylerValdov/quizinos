# QuizletCopy

A private, single-login clone of Quizlet's **Learn** mode, built for exactly one
person to use. Create study sets by hand or import them from a Quizlet export,
then drill them with flashcards or an adaptive Learn mode (multiple choice →
written, until every term is mastered).

- **Locked down**: nothing in the app — no page, no data — is reachable without
  signing in, and there is no sign-up flow anywhere. The only account that can
  ever exist is the one you create by hand (see setup below).
- **Durable**: data is stored in Firebase (Google's free-tier backend), synced
  across any device/browser that signs in, and cached locally so it still works
  offline. Nothing depends on one browser's local storage.
- **No surprise bill**: this runs entirely on Firebase's free "Spark" plan,
  which has no billing enabled at all — no credit card on file, no way to be
  charged — unless someone manually upgrades the project to the paid plan in
  the console. For one person's flashcards, the free daily quotas are enormous
  overkill.

## One-time setup: Firebase (auth + database)

You only do this once, as the project owner.

1. Go to the [Firebase console](https://console.firebase.google.com/) and
   create a new project (free, no credit card required for the Spark plan).
2. **Build → Authentication → Get started.** Under **Sign-in method**, enable
   **Email/Password** and leave every other provider disabled.
3. **Authentication → Users → Add user.** Enter your friend's email and choose
   a password. This is the one and only account — share those credentials with
   her directly (not through this repo).
4. **Build → Firestore Database → Create database.** Pick any nearby region;
   start in production mode (the rules below replace the defaults either way).
5. Still in Firestore, open the **Rules** tab, replace the contents with what's
   in [firestore.rules](firestore.rules) in this repo, and click **Publish**.
   This is what actually enforces "only her data, only when signed in" at the
   database level — it doesn't rely on the app's code being trustworthy.
6. **Project settings** (gear icon, top left) **→ General → Your apps → Add
   app → Web (`</>`)**. Give it any nickname, skip Firebase Hosting, and copy
   the `firebaseConfig` values it shows you (`apiKey`, `authDomain`, etc.).
   These values are not secret — Firebase's client config is meant to be
   public; the security rules are what actually protect the data.

## One-time setup: GitHub Pages

1. Push this folder to a GitHub repo.
2. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions**, add one repository
   secret for each value from step 6 above:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Push to `main` (or run the "Deploy to GitHub Pages" workflow manually from
   the **Actions** tab) — [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
   builds the app with those secrets baked in and deploys `dist/` automatically.

The site uses a hash-based router (`#/sets/...`), so there's no extra
rewrite/404 configuration needed for GitHub Pages' static hosting.

## Local development

```bash
cp .env.example .env   # fill in the same Firebase values from step 6 above
npm install
npm run dev
```

## Features

- **Create sets** manually (term/definition rows) or **import** pasted text
  exported from Quizlet (Set menu → **Export**), with the same configurable
  term/card separators Quizlet's own importer uses. A `.txt` upload works too.
- **Flashcards** — flip, shuffle, step through at your own pace.
- **Learn** — an adaptive quiz modeled on Quizlet Learn: each card starts as
  multiple choice, moves to written recall after the first correct answer, and
  is "mastered" after two consecutive correct answers. Missed cards get
  reinserted into the round so they come up again soon. Progress is saved
  per-set and resumes on any device after signing in.

## Importing from Quizlet

In Quizlet: open your set → the **⋯** menu → **Export** → copy the text it
shows you. Paste that into the **Import from Quizlet** tab when creating or
editing a set here, matching the separators shown (defaults are Tab between
term/definition and New line between cards, which matches Quizlet's default
export format).
