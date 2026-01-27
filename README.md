# The Codefathers – Dokumentassistent (Next.js + Turso)

En webbaserad dokumentassistent där användare kan ladda upp textdokument, kommentera och ställa frågor om dem via en “AI-assistent” (RAG/fake-ai).

---

## Funktioner

### Autentisering

- Registrering och inloggning (session-baserad med httpOnly-cookie)
- Logga ut
- Skyddade endpoints (kräver inloggning)

### Dokument

- Ladda upp `.txt` och `.md`
- Automatisk chunkning av dokument vid uppladdning
- Dokumentlista med sök & filter (kategori/status + “mina dokument”)
- Dokumentdetaljer med innehållsförhandsvisning
- Kommentarer per dokument
- Radera dokument (endast ägare)

### AI-assistent / Konversationer

- Dokument-konversationer (frågor kopplade till ett specifikt dokument)
- Global konversation (frågor över alla dokument)
- Dokumentlista i höger-sidebar för global konversation (välj scope)
- “Fake-AI” som svarar baserat på matchningar mot dokumentens chunks + visar källor

### DevOps / Drift

- GitHub Actions CI: lint + typecheck + test + build
- Branch protection: `main` kräver grön CI innan merge
- Health-endpoint: `/api/health` visar env-status + DB-check

---

## Tech Stack

- Next.js 15 (App Router)
- Prisma ORM
- SQLite (lokal utveckling)
- Turso (libSQL/SQLite i produktion)
- Tailwind CSS
- bcryptjs (lösenordshash)
- GitHub Actions (CI)

---

## Projektstruktur

```
src/
├── app/
│   ├── api/ # Backend-API (App Router)
│ │ ├── auth/ # Autentiserings-endpoints
│ │ ├── documents/ # Endpoints för dokument
│ │ ├── conversations/ # Endpoints för konversationer
│ │ ├── health/ # Health check-endpoint
│ │ └── debug/ # Utvecklings- och debug-endpoints
│ ├── auth/ # Sidor för inloggning/registrering
│ ├── documents/ # UI för dokumenthantering
│ └── conversations/ # UI för konversationer
├── backend/ # Serverlogik (controllers/services)
├── components/ # Återanvändbara UI-komponenter
├── hooks/ # Egna React-hooks
├── lib/ # Delad logik (Prisma-klient, validering m.m.)
├── prisma/ # Prisma-schema och migrationer
└── tests/ # Automatiserade tester

```

**Backend-notering:**

API-rutter i `src/app/api` hanterar HTTP-anrop och anropar logik i `src/backend/*` för att separera routing från affärslogik.

---

## Kom igång lokalt

### 1) Klona projektet

```bash
git clone https://github.com/AdrianCPO/TheCodefather4.git
cd TheCodefather4
```

### 2) Installera dependencies

```bash
npm ci
```

### 3) Skapa `.env`

Skapa en `.env` i projektets rot och fyll i:

```env
# Lokalt (SQLite)
DATABASE_URL="file:./dev.db"

# Turso (endast på Vercel/produktion)
TURSO_DATABASE_URL=""
TURSO_AUTH_TOKEN=""
```

### 4) Initiera databasen (Prisma)

Prisma används för att abstrahera databasen, vilket gör att samma applikationskod kan köras mot SQLite lokalt och Turso i produktion.

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5) Starta appen

```bash
npm run dev
```

Öppna: http://localhost:3000

---

## CI/CD (GitHub Actions)

Projektet har en CI-pipeline som körs automatiskt vid:

- Pull Request till `main`
- Push till `main`

CI kör följande steg:

- `npm ci`
- `npx prisma generate`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

Målet är att säkerställa kodkvalitet och stoppa trasig kod innan merge till `main`.

---

## Branch protection

Branch protection är aktiverad för `main`:

- Kräver Pull Request innan merge
- Kräver godkänd CI (status checks)
- Kräver att branchen är “up to date” innan merge

---

## Health endpoint (DevOps)

För att visa driftstatus:

- `GET /api/health`

Den svarar med JSON som innehåller:

- env-status (OK/MISSING)
- deploy-info (commit, branch via Vercel)
- databasstatus (ok + latency)

---

## API Endpoints (urval)

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Dokument

- `GET /api/documents`
- `POST /api/documents/upload` (kräver login)
- `GET /api/documents/[id]`
- `DELETE /api/documents/[id]` (endast ägare)

### Kommentarer

- `GET /api/documents/[id]/comments`
- `POST /api/documents/[id]/comments` (kräver login)
- `DELETE /api/documents/[id]/comments/[commentId]` (endast ägare)

### Konversationer

- `GET /api/conversations` (kräver login)
- `POST /api/conversations` (kräver login)
- `GET /api/conversations/[id]` (kräver login)
- `GET /api/conversations/[id]/messages`
- `POST /api/conversations/[id]/messages`

---

## Datamodell (Prisma)

Projektet använder följande modeller:

- User
- Session
- Document
- Chunk
- Conversation
- Message
- DocumentComment

---

## Begränsningar (v1)

- Endast textfiler (`.txt` och `.md`)
- Ingen riktig LLM/OpenAI används – “Fake-AI” bygger svar via keyword-matchning mot chunks
- Inga användarroller (admin) i v1

---

## Licens

Skolprojekt (Jensen YH).
