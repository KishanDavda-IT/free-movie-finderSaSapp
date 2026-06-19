# FreeMovieFinder


## Features

- **In-platform full-movie streams** — stream any movie in the catalog directly in-platform via native HTML5 video or multi-server embed players
- **Selectable streaming servers** — toggle between multiple player sources (VidSrc.xyz, VidSrc.to, and Embed.su) directly in the movie player
- **5 global backup sources per movie** — Internet Archive, Plex, YouTube, MUBI, FilmsForAction
- **Category sidebar** with live counts and instant filtering
- **Search** with 300ms debounce
- **Image proxy** at `/api/img` so external poster URLs work in any environment
- **Classic editorial design** — warm ivory/parchment background, Playfair Display serif headings, stone accents
- **100% free** — no premium tier, no registration required

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4 + shadcn/ui (New York style)
- Prisma ORM + SQLite
- Internet Archive advanced search API (for the PD catalog)
- TMDB image CDN (for posters of non-PD films)

## Quick Start

### Prerequisites

- Node.js 18+ or [Bun](https://bun.sh) (recommended — faster)
- An Internet connection (for fetching posters and streaming PD films)

### Install & Run

```bash
# 1. Install dependencies
bun install      # or: npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env if you want to use a real TMDB API key (optional — the catalog
# works without it because poster paths are already in the database).

# 3. Create the SQLite database and apply the schema
bun run db:push

# 4. Seed the database with 154 movies + 678 sources
bun run scripts/seed-db.ts

# 5. Start the dev server
bun run dev
```

Visit **http://localhost:3000**.

### Environment Variables

Create a `.env` file (see `.env.example`):

```bash
# SQLite database location (relative to project root)
DATABASE_URL=file:./db/custom.db

# Optional — only needed if you want to re-fetch posters via the TMDB API.
# The seed script works without it because poster URLs are baked in.
TMDB_API_KEY=
```

## NPM Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start the dev server on port 3000 |
| `bun run build` | Production build |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Apply Prisma schema to SQLite |
| `bun run db:generate` | Regenerate Prisma Client |
| `bun run scripts/seed-db.ts` | Seed the catalog (idempotent — wipes & re-creates) |
| `bun run scripts/fetch-ia-catalog.ts` | Fetch more PD films from Internet Archive (append-mode, resumable) |

## Project Structure

```
.
├── prisma/
│   └── schema.prisma              # Movie + Source models (SQLite)
├── scripts/
│   ├── fetch-ia-catalog.ts        # IA fetcher (append-mode, resumable)
│   ├── ia-films.ts                # Typed loader for the bundled IA films JSON
│   ├── ia_films.json              # 46 verified PD films with MP4 URLs (bundled)
│   ├── movie-catalog.ts           # Curated 108-film catalog with categories
│   └── seed-db.ts                 # Seeds catalog + IA films into the DB
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── categories/route.ts  # GET /api/categories (counts by category)
│   │   │   ├── img/route.ts         # GET /api/img?url=... (image proxy)
│   │   │   └── search/route.ts      # GET /api/search?query=...&category=...
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Main UI: search, grid, modal, video player
│   ├── components/ui/               # shadcn/ui components
│   ├── hooks/
│   └── lib/
│       └── db.ts                    # Prisma client singleton
├── .env.example
├── next.config.ts                   # Image remote patterns for TMDB + placehold.co
├── package.json
└── tsconfig.json
```

## How In-Platform Streaming Works

The application provides a premium in-platform media player supporting multiple high-speed stream servers.

- **Direct Stream (Internet Archive)**: For public-domain films, the player streams direct MP4 media files from the Internet Archive using a native HTML5 `<video>` tag for maximum control and speed.
- **Multi-Server Streaming**: For modern/copyrighted films, the player embeds high-speed streaming server links directly inside the application's watch modal. Users can toggle between **Server 1 (VidSrc.xyz)**, **Server 2 (VidSrc.to)**, and **Server 3 (Embed.su)**.

## External Backup Sources

In addition to in-platform streaming, the application indexes backup links to globally-available free platforms:

- **Plex** (global, free tier)
- **YouTube** (global, free uploads)
- **MUBI** (global, free tier in many regions)
- **FilmsForAction** (global, curated free films)
- **Internet Archive** (public-domain films only)

## Growing the Catalog

The catalog can be re-seeded or expanded using the integrated CLI scripts:

```bash
npm run fetch-ia   # Fetch additional public-domain titles from Internet Archive
npm run seed       # Re-seed the SQLite database with movies and sources
```

## Configuration Note

- **No region-locked platforms.** Tubi (US/CA/MX/AU only), Pluto TV (US/CA/EU only), Crackle (US only) are not listed because they don't work globally. The platforms indexed as backup sources all work worldwide.
- **No premium tier.** Every feature is free for every user.

## License

MIT — see `LICENSE`. The code is free to use, modify, and distribute. The movie posters and film streams remain the property of their respective rights holders; this project only embeds public-domain films (via Internet Archive) and links to legitimate streaming platforms for everything else.
