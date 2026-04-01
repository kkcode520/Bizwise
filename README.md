# BizWise

BizWise is a mobile-first AI business card assistant for capturing contacts, storing structured card data, and preparing better follow-up conversations.

This repository is not a zero-config demo. To run it successfully, you need your own MySQL database, AI provider credentials, and an Azure Blob container SAS URL.

The current project includes:

- Email registration, login, logout, and account settings
- Single-card capture with camera or photo library selection
- Batch card intake with duplicate handling
- AI extraction of card fields such as name, company, title, phone, and email
- Contact list, search, edit, delete, and detail pages
- AI-generated company summary, company news, industry updates, and icebreakers
- Azure Blob image storage for uploaded card images
- MySQL persistence for users, contacts, and insights

## Stack

- Next.js 15
- React 19
- TypeScript
- MySQL via `mysql2`
- OpenAI-compatible SDK, currently used with Alibaba Bailian / DashScope-compatible models
- Azure Blob Storage for card images

## Product Scope

BizWise is designed for scenarios such as:

- conferences and trade shows
- sales follow-up after exchanging business cards
- event-based lead capture on mobile devices
- quick contact archiving with AI-assisted context

There are two card intake modes:

- Single intake: scan one business card, review the extracted fields, then save
- Batch intake: upload or append multiple cards, review them, resolve duplicates, then save without generating AI insights during the batch flow

## Features

### Authentication

- Email/password registration and login
- Signed session cookies
- Profile update and password change

### Contact Intake

- Tap-to-open source picker for single-card upload
- Batch source picker with:
  - select multiple images from gallery
  - capture one card and append repeatedly
- Duplicate checks for:
  - current scanned card vs existing contacts
  - batch items vs existing contacts
  - repeated items inside the same batch

### Contact Management

- Contact list
- Search by name or company
- Contact detail page
- Edit and delete
- Per-user data isolation

### AI Capabilities

- Card field extraction from uploaded card images
- Contact detail insights including:
  - company summary
  - company news / public updates
  - industry updates
  - icebreakers
  - follow-up suggestions

### Storage

- MySQL stores structured user/contact/insight data
- Azure Blob stores card images
- Database stores canonical Blob URLs instead of base64 image payloads

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create env file

```bash
cp .env.example .env.local
```

### 3. Configure environment variables

BizWise depends on external services. Before you run it, make sure you already have:

- a reachable MySQL database
- an AI model API key and compatible base URL
- an Azure Blob container with a valid container-level SAS URL
- a strong `AUTH_SECRET` for session signing

#### AI

Example for Alibaba Bailian:

```bash
AI_API_KEY=your_bailian_key
AI_MODEL=qwen3.5-plus
AI_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
```

The app also supports OpenAI-style variable names:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=
```

#### Database

```bash
DB_HOST=your_mysql_host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_SSL=true
```

#### Authentication

```bash
AUTH_SECRET="generate_a_long_random_secret"
```

Use a strong random string. In production, `AUTH_SECRET` is required.

You can generate one locally with:

```bash
openssl rand -base64 48
```

#### Azure Blob Storage

```bash
AZURE_BLOB_SAS_URL="https://your-account.blob.core.windows.net/your-container?sp=...&sig=..."
```

Notes:

- The SAS URL should point to a container, not a single blob
- Upload happens server-side
- Client pages do not receive the write-capable SAS directly

### 4. Run the app

Development:

```bash
npm run dev
```

Production preview:

```bash
npm run build
npm run start
```

Default local URL:

- [http://localhost:3000](http://localhost:3000)

## Recommended Deployment Flow

For a production-like local check:

```bash
npm run build
npm run start
```

For deployment, make sure the following are configured in the hosting environment:

- `AI_API_KEY`
- `AI_MODEL`
- `AI_BASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`
- `AUTH_SECRET`
- `AZURE_BLOB_SAS_URL`

Deployment assumptions:

- Node.js 20+ runtime
- outbound network access to your MySQL instance, AI provider, and Azure Blob Storage
- a persistent MySQL database that the app can read and write
- a container-level Azure Blob SAS URL with enough permissions for server-side upload and delete

## Security Notes

Before publishing or deploying:

- do not commit `.env` or `.env.local`
- rotate any keys or SAS tokens that were ever shared in chat, screenshots, or test logs
- keep `AUTH_SECRET` unique per deployment
- prefer rotating Azure Blob SAS tokens after setup or debugging

## Project Structure

Key areas of the project:

- `app/`
  - pages and API routes
- `components/`
  - capture flows, contact UI, auth UI, duplicate dialogs
- `lib/auth.ts`
  - cookie session logic and user auth helpers
- `lib/contact-store.ts`
  - contact persistence and duplicate checks
- `lib/openai.ts`
  - AI extraction and insight generation
- `lib/blob-storage.ts`
  - Azure Blob upload, delete, and signed read handling
- `lib/database.ts`
  - MySQL connection pool and schema initialization

## Current Limitations

- One image is treated as one business card in the AI extraction flow
- Batch mode saves basic contact records only and does not generate AI insights during save
- Contact images use Azure Blob with server-mediated reads; if you need CDN optimization, an additional delivery layer can be added later

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## License

This project is released under the MIT License. See [LICENSE](/Users/keyuliu/Desktop/Codex/vibe-web/LICENSE).
