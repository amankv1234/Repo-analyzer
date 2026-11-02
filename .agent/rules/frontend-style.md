# Rule: Frontend Style & Architecture Guide

## Scope
Applies to `apps/web/`.

---

## 1. Next.js App Router Architecture

- Use Next.js 14/15 App Router conventions:
  - `app/layout.tsx`: Root layout with font optimization, ThemeProvider, TanStack Query provider, and global toaster.
  - `app/page.tsx`: Landing view with repository input bar and recent repositories overview.
  - `app/repos/[id]/page.tsx`: Dynamic repository onboarding dashboard and chat workspace.
  - `app/api/`: Only for lightweight edge proxies or Next.js specific auth callbacks; core business logic lives in `apps/api`.
- Prefer React Server Components (RSC) for initial page renders and static content.
- Use `'use client'` only on leaves that require interactivity (event listeners, state hooks, animations).

---

## 2. State Management & Data Fetching

- Use **TanStack Query (v5)** for server-state synchronization:
  - Centralize query keys in `lib/query-keys.ts` (e.g., `queryKeys.repos.detail(id)`, `queryKeys.chat.messages(convoId)`).
  - Use `useMutation` for actions with optimistic updates or automatic cache invalidation.
- For chat streaming, consume server-sent events (SSE) using Web Streams API or `@microsoft/fetch-event-source`.

---

## 3. UI Component System & Styling

- **shadcn/ui** built on Radix UI primitives:
  - Components live in `components/ui/` (Button, Dialog, Sheet, Tabs, Badge, ScrollArea).
  - Customize tokens through `tailwind.config.ts` and CSS variables in `app/globals.css`.
  - Maintain dark/light mode compatibility using `next-themes`.
- Styling Rules:
  - Always use Tailwind CSS utility classes; avoid inline styles.
  - Use `cn()` helper (`clsx` + `tailwind-merge`) for conditional class compositions.
  - Ensure all interactive elements have visible focus rings (`focus-visible:ring-2`) and accessible ARIA attributes.

---

## 4. Citation UI Pattern

- In the chat interface, citations must be displayed as interactive inline badges or cards:
  - Badge format: `[src/lib/parser.ts:42-88]`.
  - Clicking a citation opens a sliding drawer or code preview modal displaying syntax-highlighted code at the exact line range with a direct link to GitHub.

---

## 5. Performance & Accessibility Standards

- Code-split large dependencies (e.g., Monaco editor or heavy Markdown renderers) using `next/dynamic`.
- Images must use `next/image` with explicit width/height and responsive sizing.
- All forms must use React Hook Form with `@hookform/resolvers/zod` backed by schemas from `packages/shared`.

