# CLAUDE.md

## Project overview

Songs-list ("Lista de cântări tineret Elim Bruxelles") is a web app for the Elim Bruxelles church youth group. It stores the songs they sing, marks which ones were sung recently and will play audio for each song.

- **Live site:** https://tineretcantari.netlify.app/
- **Frontend (`frontend/`):** React 19, Vite 7, React Router 7, plain JavaScript/JSX. This is the only active app.
- **Data:** Supabase, called directly from the browser with `@supabase/supabase-js`. The client is created in `frontend/src/api/songsApi.js`.
- **Backend (`backend/`):** legacy Express server backed by `songs.json`. It is **no longer used**. Don't change it, don't call it, and don't add features to it.

### Key directories (`frontend/src/`)

| Path | Purpose |
|---|---|
| `main.jsx` | Entry point |
| `pages/` | Route pages: `App.jsx` (router + layout), `Home.jsx` (`/`), `AddSong.jsx` (`/addsong`), `Setlists.jsx` (`/sub-liste`, overview and create), `Setlist.jsx` (`/sub-liste/:date`, one list) |
| `components/` | `TabBar` (bottom navigation), `SearchBar`, `SongCard` (one song row), `LetterIndex` (A–Z jump strip), `Sheet` (base bottom sheet: scrim, focus, Escape), `ConfirmSheet`, `CloseSetlistSheet` (close a past sub-list, tick the songs not sung), `SetlistPickerSheet` (add a song to sub-lists from the main list), `SongPickerSheet` (add songs from a sub-list page), `SongForm` (add and edit), `EditSongSheet` (edit title and key), `EditorCodeForm` / `EditorCodeSheet` (ask for the editor code) |
| `api/` | `songsApi.js` (Supabase client), `songs.js` (queries on `songs`), `setlists.js` (queries on `setlists` / `setlist_songs`) |
| `utils/` | `editorCode.js` (editor code remembered in `localStorage`), `text.js` (diacritic-insensitive search, sorting, grouping, Romanian `plural`), `dates.js` (`sungAgo`, `isRecent`, `todayISO`, `formatServiceDate`, `formatWeekday`, `formatDayMonth`, `untilLabel`, `nextWeekday`) |
| `css/` | One plain CSS file per component/page |
| `test/` | Vitest setup and the shared Supabase mock (pass a `resolver(table)` to answer per table) |
| `../../supabase/setlists.sql` | Supabase setup for sub-lists (tables, policies, `close_setlist` RPC). Safe to re-run in the SQL Editor to apply updates. |
| `../../supabase/editor-code.sql` | One-time Supabase setup for the editor code (`add_song`, `update_song`, `delete_song`, `check_editor_code`, locks `songs`). The real code is set by hand and never committed. |
| `../public/_redirects` | Netlify SPA fallback (`/* /index.html 200`). Keep it, or direct links to routes return 404. |

### Design system ("Elim oasis")

- Tokens live on `:root` in `src/css/index.css`, with a dark-mode override under `prefers-color-scheme: dark`. Always use the variables, never raw hex values in component CSS.
- Palette: `--night` #1E1B5E, `--spring` #00A6A6, `--sun` #FFC23D, `--hibiscus` #FF4F7B, `--palm` #2FBF71, `--paper` #F3F6FF. Text on these bright fills is always `--night`; use the `*-ink` tokens for colored text.
- Fonts: **Unbounded 800** only for page titles and the letter tiles; **Rubik** for everything else.
- The rotated, colored letter tiles are the one loud element on the main list; on a sub-list page it's the weekday tile in the header. Keep everything else calm.
- Phone first: touch targets of at least 48px, a bottom tab bar, the key always visible on every row, motion only in response to user actions, and `prefers-reduced-motion` respected.
- Shared button classes: `.btn` + `.btn-sun` (primary), `.btn-palm`, `.btn-hibiscus` (destructive confirm), `.btn-outline`, `.btn-text-danger`.
- The logo is `public/logo.png` (white line art on a transparent background), always shown on an indigo circle so it stays visible in light mode. It's hidden if the file fails to load. The browser tab icon (`public/favicon.png`) and the iPhone home-screen icon (`public/apple-touch-icon.png`) are the same logo on indigo. `public/manifest.webmanifest` makes the home-screen app open full-screen; it uses `icon-192.png`, `apple-touch-icon.png` (512px) and `icon-maskable-512.png` (logo padded into Android's safe zone). Don't hotlink the church website: it blocks requests from other sites.

### Supabase data model

- `songs`: `id`, `title`, `music_scale`, `last_sung` (date `YYYY-MM-DD`, or null).
- A song counts as "recently sung" (`.is-recent`) if `last_sung` is within the last 30 days. `last_sung` is set only when a sub-list is closed (there is no manual "mark as sung" button).
- `setlists`: `id`, `date` (unique: one sub-list per date), `created_at`.
- `setlist_songs`: `setlist_id` → `setlists` (cascade), `song_id` → `songs` (cascade), `position` (singing order, rewritten 0…n-1 on reorder); primary key `(setlist_id, song_id)`.
- **Closing a list:** lists never disappear on their own (the old `expire-setlists` cron job is removed). After a list's day has passed (Brussels time), its page shows "Încheie sub-lista"; the user ticks the songs that were not sung and the `close_setlist(p_setlist_id, p_unsung_ids)` RPC, in one transaction, sets `last_sung` = the list's date for the other songs, appends the unsung ones to the list of the first Monday after the list's date that is today or later (created if missing; `nextMondayAfter` in `utils/dates.js` mirrors this), and deletes the list. Past lists appear first on `/sub-liste` under "De încheiat" and are read-only; the main list's "add to sub-list" sheet only offers upcoming lists.
- **Editor code, no accounts.** Adding, editing (title and key) and deleting songs need a shared code, checked in Supabase by the `add_song` / `update_song` / `delete_song` RPCs (`supabase/editor-code.sql`); the anon role can't insert, delete or change title/key in `songs` directly. A wrong code returns SQLSTATE `28000` (`isInvalidCodeError` in `api/songs.js`). Anyone can still read songs, update `last_sung`, and do everything on sub-lists. New write actions on `songs` need their own RPC that checks the code.

## Build, test & lint

Run all commands from `frontend/`. Use npm; `package-lock.json` is committed. Use the current Node LTS (no pinned version).

```bash
npm install
npm run dev          # Vite dev server
npm test             # Vitest, single run
npm run test:watch   # Vitest, watch mode
npm run lint         # ESLint
npm run build        # Production build into dist/
npm run preview      # Serve the built dist/
```

**Before saying a task is done, run `npm run lint`, `npm test` and `npm run build`. All three must pass.** If you can't run them, say so explicitly.

### Tests

- Vitest + React Testing Library + jsdom, configured in the `test` block of `vite.config.js`.
- Test files sit next to their source: `Component.test.jsx`.
- Never hit the real Supabase project in tests. Mock `../api/songsApi` (see `src/test/supabaseMock.js`) or mock the `src/api/` helper functions.
- Query the DOM by role, label or Romanian text, the way a user would. Use CSS classes only for visual state (for example `.recently-sung`).
- New features and bug fixes come with tests.

### Deployment & environment

- Netlify deploys automatically on every push to `main` (base directory `frontend`). **Pushing to `main` updates the live site.**
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Netlify and in `frontend/.env`.
- `frontend/.env` is intentionally committed because it contains only the public anon key. Never add a `service_role` key or any other secret to it, or anywhere in the frontend.

## Code style & conventions

- **Plain JavaScript/JSX only.** No TypeScript.
- Function components with hooks. One component per file, default export, PascalCase filenames.
- **Styling:** one plain CSS file per component/page in `src/css/` (for example `SongCard.css`), imported at the top of that component. Shared global styles go in `index.css`. Don't use CSS Modules, Tailwind or CSS-in-JS.
- **Data access:** new Supabase queries go in helper functions in `src/api/` (for example `listSongs()`, `getSetlistSongs(id)`). They return `{ data, error }` and keep table and column names out of components. Existing direct `supabase.from(...)` calls in components can be moved to helpers when those files are touched.
- **Language:**
  - **All UI text is in Romanian, with correct diacritics** (ă, â, î, ș, ț). Example: "Adaugă cântare", "Șterge".
  - Code, identifiers, comments, console logs and commit messages are in English.
- **Errors:** on every Supabase call, check `error`. Log it in English with `console.error("Error doing X:", error.message)` and show the user a Romanian message in a `<p className="error-message">` (for example "Cântarea nu a putut fi adăugată. Încearcă din nou."). Never fail silently.
- Keep ESLint clean. `no-unused-vars` is an error, so don't destructure `data` if you don't use it.
- **Avoid:** calling the legacy backend, adding new dependencies without asking, English UI text, and hard-coding secrets.

## Roadmap / planned features

1. **Audio per song.** Likely stored in Supabase Storage and linked from `songs`.

## Workflow & git

- Work directly on `main`. It's a solo project, but remember that `main` deploys to production.
- **Commit only when the user asks.** Never push without being asked.
- Use Conventional Commits, with an imperative, English subject line:
  - `feat: add setlist page`
  - `fix: show error when song delete fails`
  - `test: cover SongCard toggle`
  - Other types: `refactor:`, `style:`, `chore:`, `docs:`.
- Keep commits focused: one logical change per commit.
