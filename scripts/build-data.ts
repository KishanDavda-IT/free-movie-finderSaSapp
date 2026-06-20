/**
 * scripts/build-data.ts
 *
 * Generates `src/data/movies-data.ts` — a self-contained TypeScript module
 * with all movies and their sources embedded as static data. This removes
 * the SQLite/Prisma dependency from the production build so the app works
 * on Vercel (serverless) without a database file.
 *
 * Run:  npx tsx scripts/build-data.ts
 *       (or via `npm run build:data` which happens before `next build` on Vercel)
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "..", ".env") });

import { CLEAN_CATALOG, CatalogMovie } from "./movie-catalog";
import { EXPANDED_CATALOG } from "./expanded-catalog";
import { IA_FILMS, IAFilm } from "./ia-films";

// ---------------------------------------------------------------------------
// Merge catalogs
// ---------------------------------------------------------------------------
const seenTmdbIds = new Set(CLEAN_CATALOG.map((m) => m.tmdbId));
const MERGED_CATALOG: CatalogMovie[] = [
  ...CLEAN_CATALOG,
  ...EXPANDED_CATALOG.filter((m) => {
    if (seenTmdbIds.has(m.tmdbId)) return false;
    seenTmdbIds.add(m.tmdbId);
    return true;
  }),
];

// ---------------------------------------------------------------------------
// Helpers (same as seed-db.ts)
// ---------------------------------------------------------------------------
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

function posterUrl(m: CatalogMovie): string {
  if (m.posterUrlOverride) return m.posterUrlOverride;
  if (!m.poster_path) return "https://placehold.co/500x750/1f1f1f/666666?text=No+Poster";
  return `${TMDB_IMG_BASE}${m.poster_path}`;
}

function releaseYear(date: string): number {
  if (!date) return 0;
  const y = parseInt(date.slice(0, 4), 10);
  return Number.isFinite(y) ? y : 0;
}

function watchUrlFor(m: CatalogMovie): string | null {
  if (m.archiveId) return `https://archive.org/embed/${m.archiveId}?autoplay=1`;
  return null;
}

type PlatformBuilder = {
  name: string;
  requiresArchive?: boolean;
  build: (title: string, movie: CatalogMovie) => string;
};

const PLATFORMS: PlatformBuilder[] = [
  {
    name: "Internet Archive",
    requiresArchive: true,
    build: (_t, m) => `https://archive.org/details/${m.archiveId}`,
  },
  {
    name: "Plex",
    build: (t) => `https://www.plex.tv/search/?query=${encodeURIComponent(t)}`,
  },
  {
    name: "YouTube",
    build: (t) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(t + " full movie free")}`,
  },
  {
    name: "MUBI",
    build: (t) => `https://mubi.com/en/search/films?query=${encodeURIComponent(t)}`,
  },
  {
    name: "FilmsForAction",
    build: (t) => `https://www.filmsforaction.org/search/?q=${encodeURIComponent(t)}`,
  },
];

// ---------------------------------------------------------------------------
// Build data
// ---------------------------------------------------------------------------
interface MovieData {
  id: string;
  tmdbId: number;
  title: string;
  description: string;
  posterUrl: string;
  releaseYear: number;
  category: string;
  watchUrl: string | null;
  sources: { id: string; platformName: string; url: string; isFree: boolean }[];
}

interface IaCategory {
  year: number | null;
  label: string;
}

function iaCategory(year: number | null): string {
  if (!year) return "Classic";
  if (year >= 1950 && year < 1960) return "Classic";
  if (year >= 1960 && year < 1970) return "Classic";
  if (year >= 1970 && year < 1980) return "Action";
  if (year >= 1980) return "Drama";
  return "Classic";
}

const allMovies: MovieData[] = [];
let suffix = 0;

for (const m of MERGED_CATALOG) {
  const row: MovieData = {
    id: `catalog-${suffix++}`,
    tmdbId: m.tmdbId,
    title: m.title,
    description: m.overview,
    posterUrl: posterUrl(m),
    releaseYear: releaseYear(m.release_date),
    category: m.category,
    watchUrl: watchUrlFor(m),
    sources: [],
  };

  for (const p of PLATFORMS) {
    if (p.requiresArchive && !m.archiveId) continue;
    row.sources.push({
      id: `src-${suffix++}`,
      platformName: p.name,
      url: p.build(m.title, m),
      isFree: true,
    });
  }

  allMovies.push(row);
}

// IA films
const curatedArchiveIds = new Set(
  CLEAN_CATALOG.filter((m) => m.archiveId).map((m) => m.archiveId)
);

let iaCount = 0;
for (const film of IA_FILMS) {
  if (curatedArchiveIds.has(film.identifier)) continue;
  iaCount++;

  const watchUrl = film.mp4Url;
  const poster = film.posterUrl || `https://archive.org/services/img/${film.identifier}`;
  const cat = iaCategory(film.year);

  const row: MovieData = {
    id: `ia-${iaCount}`,
    tmdbId: -iaCount,
    title: film.title,
    description: film.description || `Public-domain film from Internet Archive. Originally released ${film.year || "unknown year"}.`,
    posterUrl: poster,
    releaseYear: film.year || 0,
    category: cat,
    watchUrl,
    sources: [
      {
        id: `ia-src-${iaCount}-0`,
        platformName: "Internet Archive",
        url: `https://archive.org/details/${film.identifier}`,
        isFree: true,
      },
    ],
  };

  for (const p of PLATFORMS.filter((p) => !p.requiresArchive)) {
    row.sources.push({
      id: `ia-src-${iaCount}-${row.sources.length}`,
      platformName: p.name,
      url: p.build(film.title, film as any),
      isFree: true,
    });
  }

  allMovies.push(row);
}

// ---------------------------------------------------------------------------
// Write the TypeScript module
// ---------------------------------------------------------------------------
const OUTPUT = path.resolve(__dirname, "..", "src", "data", "movies-data.ts");

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const code = `// ⚠️ AUTO-GENERATED by scripts/build-data.ts — DO NOT EDIT
// Run \`npx tsx scripts/build-data.ts\` to regenerate.

export type SourceData = {
  id: string;
  platformName: string;
  url: string;
  isFree: boolean;
};

export type MovieData = {
  id: string;
  tmdbId: number;
  title: string;
  description: string;
  posterUrl: string;
  releaseYear: number;
  category: string;
  watchUrl: string | null;
  sources: SourceData[];
};

export const movies: MovieData[] = ${JSON.stringify(allMovies, null, 2)};

export type CategoryInfo = { name: string; count: number };

export const categories: CategoryInfo[] = (() => {
  const map = new Map<string, number>();
  for (const m of movies) {
    map.set(m.category, (map.get(m.category) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
})();

export const totalMovies: number = movies.length;
`;

fs.writeFileSync(OUTPUT, code, "utf-8");
console.log(`✅ Generated ${OUTPUT}`);
console.log(`   ${allMovies.length} movies, ${allMovies.reduce((s, m) => s + m.sources.length, 0)} sources`);
