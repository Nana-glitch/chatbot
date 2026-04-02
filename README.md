# Chatbot (ChatGPT-like)

ChatGPT-like chatbot built with **Next.js App Router**, **TanStack Query**, **shadcn/ui + Tailwind**, **Supabase Postgres/Auth/Storage**, and **LLM streaming** via **OpenRouter** (OpenAI-compatible API).

## Features

- **Chat**: send messages and stream assistant responses (SSE).
- **Multiple LLM models**: OpenRouter model picker (DeepSeek, Qwen, Llama, Gemma, GPT-4o mini, etc).
- **Auth**: Supabase email/password login + register.
- **Chats sidebar**: persisted in Postgres; realtime updates across tabs via Supabase Realtime.
- **Guest mode**: up to **3 free questions**, then sign-in required.
- **Attachments**: paste/attach images; upload PDF/DOC/DOCX, extract text, and use as context in the prompt.
- **Security**: API keys server-only; no DB calls from components (all data fetched via API routes).

## Tech stack

- **Client**: Next.js + React, TanStack Query
- **UI**: shadcn/ui, Tailwind CSS, lucide-react
- **Server**: Next.js REST API routes
- **DB/Auth/Storage**: Supabase (service role on server)
- **Realtime**: Supabase Realtime (`postgres_changes`)
- **LLM**: OpenRouter (OpenAI SDK with `baseURL`)

## Setup

Install dependencies:

```bash
pnpm install
```

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# (backward-compatible, if you already have old env names)
# SUPABASE_URL=...
# SUPABASE_SERVICE_KEY=...

# LLM (OpenRouter)
OPENROUTER_API_KEY=...

# OCR (optional, for scanned PDFs/images)
# Uses OCR.Space API so it works on Vercel without binaries.
# Get a key at https://ocr.space/ocrapi
OCR_SPACE_API_KEY=...
```

Run dev server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Supabase

You need a Supabase project with tables like:

- `chats`
- `messages`
- `attachments`

and a storage bucket used by the server upload helper.

## API routes (high level)

- `GET /api/auth/me`: current user
- `POST /api/auth/login`: login
- `POST /api/auth/register`: register
- `POST /api/auth/logout`: logout
- `GET /api/chats`: list chats (auth required)
- `POST /api/chats`: create chat (auth required)
- `GET /api/chats/:id`: get chat (auth required)
- `PATCH /api/chats/:id`: rename/update model (auth required)
- `DELETE /api/chats/:id`: delete chat (auth required)
- `POST /api/messages`: send message + stream assistant response (guest supported)
- `GET /api/messages/:chatId`: list messages (auth required)
- `POST /api/files`: upload attachment (auth required)

## Architecture notes

- **UI** components never talk to Postgres directly.
- Data flows through **API routes** and is cached on the client via **TanStack Query**.
- Realtime chat list updates use a **public Supabase client** (required for Realtime).
- All privileged DB access is done server-side using a **service role** Supabase client.

## Demo checklist

- Record a short demo (Loom/screen recording):
  - guest 3-question limit
  - login/register
  - create chat, switch models
  - paste image / upload PDF and ask a question using the file context
  - open in 2 tabs: see realtime chat list updates

## Deploy

### Deploy to Vercel

1. Push your code to GitHub (the same repo you’ll connect in Vercel).
2. Vercel → **Add New Project** → import from GitHub.
3. Vercel → **Settings → Environment Variables** → add variables (copy the values from your local `.env.local`).
   Add:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (required; server-only), `OPENROUTER_API_KEY`, `OCR_SPACE_API_KEY` (optional).
   If you already have old env names, the app also supports: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
4. Supabase setup required for realtime between tabs:
   Storage bucket name must be `attachments` (used by `/api/files`).
   Realtime must be enabled for `public.chats` (so the client can subscribe to `postgres_changes`).
   If you use RLS, make sure subscriptions work with the anon key (the app subscribes client-side with `NEXT_PUBLIC_SUPABASE_ANON_KEY` and then filters by `user_id`).
5. Deploy.
6. Verify in production (basic functional check):
   - Login/register works
   - Sidebar chats load and update across two tabs
   - Send a message and ensure SSE streaming works
   - Attach an image (preview + message rendering)
   - Upload a PDF/DOC and ensure extracted text is used (and OCR fallback works when `OCR_SPACE_API_KEY` is set)
