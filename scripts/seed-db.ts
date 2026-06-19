/**
 * scripts/seed-db.ts
 *
 * Seeds the local SQLite database with movies + free streaming sources.
 *
 * SOURCES POLICY — we only list platforms that are:
 *   1. LEGAL — properly licensed, no piracy
 *   2. FREE — no subscription required for the listed content
 *   3. GLOBALLY AVAILABLE — not region-locked to a single country
 *
 * For every movie we write up to 5 Source rows:
 *   - Internet Archive  → archive.org/details/{archiveId}   (PD films only — embeddable in-platform)
 *   - Plex              → plex.tv/search/?query=...          (global, has free tier)
 *   - YouTube           → youtube.com/results?search_query=...  (global)
 *   - MUBI              → mubi.com/en/search/films?query=... (global, free tier in many regions)
 *   - FilmsForAction    → filmsforaction.org/search/?q=...   (global, free, curated)
 *
 * We deliberately EXCLUDE region-locked platforms:
 *   - Tubi (US/CA/MX/AU only)
 *   - Pluto TV (US/CA/EU only, catalog varies by country)
 *   - Crackle (US only)
 *
 * We also DO NOT support piracy services (Pikashow, Cloudsteam, etc.) —
 * those distribute copyrighted films without licensing and would expose
 * the project to DMCA takedowns and legal liability.
 *
 * For movies with a confirmed Internet Archive `archiveId`, we ALSO set
 * `watchUrl = https://archive.org/embed/{id}?autoplay=1` so the in-platform
 * Watch player can play the FULL movie right on this site (no redirect).
 *
 * Usage:  bun run scripts/seed-db.ts
 */

import { PrismaClient } from "@prisma/client";
import * as path from "path";
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "..", ".env") });

import { CLEAN_CATALOG, CatalogMovie } from "./movie-catalog";
import { EXPANDED_CATALOG } from "./expanded-catalog";
import { IA_FILMS } from "./ia-films";

// Merge catalogs: curated takes priority (has archiveIds for PD films),
// expanded adds new titles by tmdbId.
const seenTmdbIds = new Set(CLEAN_CATALOG.map((m) => m.tmdbId));
const MERGED_CATALOG: CatalogMovie[] = [
  ...CLEAN_CATALOG,
  ...EXPANDED_CATALOG.filter((m) => {
    if (seenTmdbIds.has(m.tmdbId)) return false;
    seenTmdbIds.add(m.tmdbId);
    return true;
  }),
];

const prisma = new PrismaClient();

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

function posterUrl(m: CatalogMovie): string {
  // Prefer an explicit override (e.g. a real Wikipedia/Wikimedia URL) when
  // provided — used for PD films whose TMDB poster path doesn't actually
  // exist on TMDB's CDN.
  if (m.posterUrlOverride) return m.posterUrlOverride;
  if (!m.poster_path)
    return "https://placehold.co/500x750/1f1f1f/666666?text=No+Poster";
  return `${TMDB_IMG_BASE}${m.poster_path}`;
}

function releaseYear(date: string): number {
  if (!date) return 0;
  const y = parseInt(date.slice(0, 4), 10);
  return Number.isFinite(y) ? y : 0;
}

// Build the in-platform watch URL (embeddable full movie).
// - PD films with an Internet Archive identifier → IA embed
// - All other movies with a valid TMDB ID → null (frontend handles dynamically)
function watchUrlFor(m: CatalogMovie): string | null {
  if (m.archiveId) {
    return `https://archive.org/embed/${m.archiveId}?autoplay=1`;
  }
  return null;
}

// All GLOBALLY-AVAILABLE free streaming platforms we list as sources.
// Each `build(title, movie)` returns the platform's URL for this movie.
type PlatformBuilder = {
  name: string;
  // If `requiresArchive` is true, this source is only written for movies
  // that have an Internet Archive identifier (i.e. PD films).
  requiresArchive?: boolean;
  build: (title: string, movie: CatalogMovie) => string;
};

const PLATFORMS: PlatformBuilder[] = [
  {
    // PD films only — embeddable IN PLATFORM (no redirect).
    name: "Internet Archive",
    requiresArchive: true,
    build: (_t, m) => `https://archive.org/details/${m.archiveId}`,
  },
  {
    // Global — has free, ad-supported tier in most countries.
    name: "Plex",
    build: (t) => `https://www.plex.tv/search/?query=${encodeURIComponent(t)}`,
  },
  {
    // Global — millions of free movies uploaded by users/channels.
    name: "YouTube",
    build: (t) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        t + " full movie free"
      )}`,
  },
  {
    // Global — curated arthouse films, free tier in many regions.
    name: "MUBI",
    build: (t) => `https://mubi.com/en/search/films?query=${encodeURIComponent(t)}`,
  },
  {
    // Global — curated free documentaries + indie films.
    name: "FilmsForAction",
    build: (t) => `https://www.filmsforaction.org/search/?q=${encodeURIComponent(t)}`,
  },
];

async function main() {
  console.log("🌱 Seeding FreeMovieFinder database...");
  console.log(`   Catalog size: ${MERGED_CATALOG.length} movies (${CLEAN_CATALOG.length} curated + ${MERGED_CATALOG.length - CLEAN_CATALOG.length} expanded)`);

  // Wipe existing data so re-runs are deterministic.
  await prisma.source.deleteMany({});
  await prisma.movie.deleteMany({});

  let movieCount = 0;
  let sourceCount = 0;
  let watchableCount = 0;

  for (const m of MERGED_CATALOG) {
    const watchUrl = watchUrlFor(m);
    if (watchUrl) watchableCount++;

    const movie = await prisma.movie.create({
      data: {
        tmdbId: m.tmdbId,
        title: m.title,
        description: m.overview,
        posterUrl: posterUrl(m),
        releaseYear: releaseYear(m.release_date),
        category: m.category,
        watchUrl,
      },
    });

    // Write each eligible platform as a Source row.
    for (const p of PLATFORMS) {
      if (p.requiresArchive && !m.archiveId) continue;
      await prisma.source.create({
        data: {
          movieId: movie.id,
          platformName: p.name,
          url: p.build(m.title, m),
          isFree: true,
        },
      });
      sourceCount++;
    }

    movieCount++;
  }

  // =====================================================================
  // PART 2: Import IA-fetched public-domain films (each plays in-platform
  //         via a direct MP4 URL in an HTML5 <video> tag).
  // =====================================================================
  console.log(`\n📥 Importing ${IA_FILMS.length} IA-fetched PD films...`);

  // Track IA identifiers we already used via the curated catalog (so we don't
  // create duplicate movies for the same film).
  const curatedArchiveIds = new Set(
    CLEAN_CATALOG.filter((m) => m.archiveId).map((m) => m.archiveId)
  );

  let iaMovieCount = 0;
  let iaSourceCount = 0;
  let iaSkipped = 0;

  for (const film of IA_FILMS) {
    // Skip if this IA film is already in the curated catalog (by identifier).
    if (curatedArchiveIds.has(film.identifier)) {
      iaSkipped++;
      continue;
    }

    // Use a synthetic negative tmdbId to avoid collisions with real TMDB IDs.
    // Prisma requires Int, so we use negative numbers starting from -1.
    const syntheticTmdbId = -(iaMovieCount + 1);

    // Use the direct MP4 URL as the watchUrl — the Watch modal will use this
    // in an HTML5 <video> tag for native in-platform playback.
    const watchUrl = film.mp4Url;

    // Use IA's thumbnail service if no explicit poster was found.
    const posterUrl =
      film.posterUrl || `https://archive.org/services/img/${film.identifier}`;

    // Categorize by decade for nicer browsing.
    let category = "Classic";
    if (film.year) {
      if (film.year >= 1950 && film.year < 1960) category = "Classic";
      else if (film.year >= 1960 && film.year < 1970) category = "Classic";
      else if (film.year >= 1970 && film.year < 1980) category = "Action";
      else if (film.year >= 1980) category = "Drama";
      else category = "Classic"; // pre-1950
    }

    const movie = await prisma.movie.create({
      data: {
        tmdbId: syntheticTmdbId,
        title: film.title,
        description:
          film.description ||
          `Public-domain film streamed from Internet Archive. Originally released ${film.year || "in an unknown year"}.`,
        posterUrl,
        releaseYear: film.year || 0,
        category,
        watchUrl,
      },
    });

    // Sources for IA films: Internet Archive (primary) + the same 4 global
    // platforms we use for everything else.
    await prisma.source.create({
      data: {
        movieId: movie.id,
        platformName: "Internet Archive",
        url: `https://archive.org/details/${film.identifier}`,
        isFree: true,
      },
    });
    iaSourceCount++;

    for (const p of PLATFORMS.filter((p) => !p.requiresArchive)) {
      await prisma.source.create({
        data: {
          movieId: movie.id,
          platformName: p.name,
          url: p.build(film.title, film as any),
          isFree: true,
        },
      });
      iaSourceCount++;
    }

    iaMovieCount++;
  }

  console.log(`   Imported ${iaMovieCount} IA films (${iaSkipped} skipped as duplicates)`);

  // =====================================================================
  // Final summary
  // =====================================================================
  const byCat = await prisma.movie.groupBy({
    by: ["category"],
    _count: true,
  });

  console.log("\n✅ Done.");
  console.log(`   Movies:                                  ${movieCount + iaMovieCount}`);
  console.log(`   Sources (global platforms):              ${sourceCount + iaSourceCount}`);
  console.log(`   In-platform full-movie watchable (PD):   ${watchableCount + iaMovieCount}`);
  console.log("   By category:");
  for (const c of byCat) {
    console.log(`     ${c.category.padEnd(12)} ${c._count}`);
  }
  console.log("\n📋 Source platforms (all global, all legal, all free):");
  for (const p of PLATFORMS) {
    console.log(
      `   - ${p.name}${p.requiresArchive ? " (PD films only)" : ""}`
    );
  }
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

