# TheCodefather4

En Next.js-applikation för dokumenthantering med användarautentisering.

## Funktioner

- Användarregistrering och inloggning (session-baserad)
- Uppladdning av dokument (.txt, .md)
- Automatisk chunkning av dokument
- Visning och radering av egna dokument

## Tech Stack

- Next.js 15 med App Router
- Prisma ORM med SQLite
- bcryptjs för lösenordshashing
- Tailwind CSS för styling

## Installation

### 1. Klona projektet

```bash
git clone https://github.com/AdrianCPO/TheCodefather4.git
cd TheCodefather4
```

### 2. Installera dependencies

```bash
npm install
```

### 3. Skapa .env fil

Skapa en `.env` fil i projektets rot och lägg till:

```env
DATABASE_URL="file:./data/TheCodeFather4.db"
```

### 4. Sätt upp databasen

Generera Prisma Client:

```bash
npx prisma generate
```

Kör migrationer för att skapa databasen:

```bash
npx prisma migrate dev --name init
```

(Valfritt) Seed databasen med testdata:

```bash
npx prisma db seed
```

### 5. Starta utvecklingsservern

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Databashantering

### Öppna Prisma Studio

För att se och hantera data i databasen:

```bash
npx prisma studio
```

### Reset databasen

Om du behöver återställa databasen:

```bash
npx prisma migrate reset
```

## Användning

1. **Registrera ett konto:** Gå till `/register`
2. **Logga in:** Gå till `/login`
3. **Ladda upp dokument:** Gå till `/documents` efter inloggning

## API Endpoints

- `POST /api/auth/register` - Skapa nytt konto
- `POST /api/auth/login` - Logga in
- `POST /api/auth/logout` - Logga ut
- `GET /api/auth/me` - Hämta inloggad användare
- `POST /api/documents/upload` - Ladda upp dokument (kräver inloggning)
- `GET /api/documents` - Lista alla dokument
- `DELETE /api/documents/[id]` - Radera dokument (endast ägare)

## Testning

Kör tester med Jest:

```bash
npm test
```

## Databasschema

### User

- id, email, password, createdAt

### Session

- id, userId, token, expiresAt, createdAt

### Document

- id, name, size, mimeType, userId, createdAt

### Chunk

- id, documentId, content, chunkIndex, createdAt

## Licens

Detta är ett skolprojekt.
