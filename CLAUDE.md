# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server with Turbopack
npm run dev:daemon   # Start dev server in background (logs to logs.txt)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all Vitest tests
npm run db:reset     # Force reset SQLite database (destructive)
```

All npm scripts inject `NODE_OPTIONS='--require ./node-compat.cjs'` for Node.js compatibility.

To run a single test file:
```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

Environment: create `.env` with `ANTHROPIC_API_KEY=...`. Without it, the app falls back to a mock provider that generates static components.

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe what they want in a chat interface; Claude generates/edits code via tool calls; a sandboxed iframe renders the result in real time — no file I/O to disk.

### Request flow

```
Chat input → POST /api/chat/route.ts
  → Anthropic Claude (claude-haiku-4-5) via Vercel AI SDK
  → Claude calls tools: str_replace_editor, file_manager
  → Tool results stream back to frontend
  → FileSystemContext applies changes to in-memory VirtualFileSystem
  → PreviewFrame detects change, transpiles JSX via Babel.standalone, renders in iframe
```

### Key abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`) — in-memory file tree (no disk writes). The entire project state lives here. Claude always starts from `/App.jsx` as the entry point.

**AI tools** (`src/lib/tools/`) — `str_replace_editor` and `file_manager` are the only tools Claude can call. They operate on the VirtualFileSystem.

**PreviewFrame** (`src/components/preview/PreviewFrame.tsx`) — sandboxed iframe that builds an import map using `esm.sh` CDN URLs for npm packages, then transpiles JSX with `@babel/standalone` in-browser. No bundler involved.

**ChatContext / FileSystemContext** (`src/lib/contexts/`) — React contexts that share streaming state and file system state across the three-panel layout (chat | preview+editor | file tree).

**System prompt** (`src/lib/prompts/generation.tsx`) — instructs Claude to use only Tailwind CSS (no inline styles), `@/` import aliases for non-library imports, and to keep the entry point at `/App.jsx`.

### Component generation constraints

The system prompt enforces these rules for all generated components:
- Entry point must be `/App.jsx` with a default export
- Only Tailwind CSS — no inline styles
- Non-library imports use `@/` alias (e.g. `@/components/Card`)
- No HTML files; everything renders through `/App.jsx`

UI components use shadcn/ui (new-york style, `lucide-react` icons). Existing components live at `src/components/ui/`.

### AI tools

`str_replace_editor` supports `view`, `create`, `str_replace`, and `insert`. `undo_edit` is declared but not implemented — do not rely on it.

`file_manager` supports `rename` and `delete` (rename is also the move operation; folders are created recursively).

### Auth & persistence

- JWT-based auth (`src/lib/auth.ts`) with 7-day HTTP-only cookies via `jose`; falls back to a default secret in dev if `JWT_SECRET` is unset
- Prisma + SQLite: `User` and `Project` models; `Project.messages` and `Project.data` are JSON columns storing chat history and file system state respectively; `userId` is optional (anonymous projects)
- Anonymous users are tracked in `sessionStorage` via `anon-work-tracker.ts`; data is promoted to a real project on sign-up
- Middleware (`src/middleware.ts`) guards `/api/projects` and `/api/filesystem` — these routes require a valid session

### Non-obvious internals

- `VirtualFileSystem` mutates in place; `FileSystemContext` uses a `refreshTrigger` counter to force React re-renders without unmounting
- `node-compat.cjs` strips `globalThis.localStorage/sessionStorage` at server startup to fix a Node 25+ SSR crash — this is why all scripts pass `NODE_OPTIONS='--require ./node-compat.cjs'`
- The API route sets `maxSteps: 4` for the mock provider and `maxSteps: 40` for real Claude to cap runaway tool-call loops
- The system message opts into Anthropic prompt caching via `providerOptions.anthropic.cacheControl.type: "ephemeral"`

### Testing

18 test files under `src/lib/__tests__/` and co-located `__tests__/` folders. Vitest with jsdom + React Testing Library. Representative tests: `jsx-transformer.test.ts`, `file-system.test.ts`, `chat-context.test.tsx`.
