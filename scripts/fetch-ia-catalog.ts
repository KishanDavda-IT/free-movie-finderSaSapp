/**
 * scripts/fetch-ia-catalog.ts
 *
 * Queries Internet Archive's advanced search API for public-domain feature
 * films and, for each result, checks the metadata to find the MP4 file name.
 * Outputs a JSON file at scripts/ia_films.json with one entry per film:
 *
 *   { identifier, title, year, description, mp4Url, posterUrl }
 *
 * The MP4 URL is constructed as:
 *   https://archive.org/download/{identifier}/{filename}
 *
 * We use this URL directly in an HTML5 <video> tag on the Watch modal so the
 * full movie plays natively on our platform — no iframe, no IA branding.
 *
 * We also try to fetch a poster/thumbnail image URL from IA's metadata.
 *
 * Run:  bun run scripts/fetch-ia-catalog.ts
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "..", ".env") });

const OUTPUT_PATH = path.resolve(__dirname, "ia_films.json");
const TARGET_COUNT = 100; // how many verified films we want to end up with
const BATCH_SIZE = 50; // IA search page size
const MAX_BATCHES = 6; // 6 × 50 = 300 candidates, filter to 100 verified
const APPEND_MODE = true; // append to existing file instead of overwriting

type IAFilm = {
  identifier: string;
  title: string;
  year: number | null;
  description: string;
  mp4Url: string | null;
  mp4Size: number; // bytes — used to skip trivially small files
  posterUrl: string | null;
};

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
      },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

// Step 1: search IA for feature films, paging through results.
async function searchBatch(page: number): Promise<
  Array<{ identifier: string; title: string; year?: string; description?: string }>
> {
  const start = page * BATCH_SIZE;
  // Sort by downloads desc so we get the most popular (and most likely
  // to actually have working video files) first.
  const url =
    `https://archive.org/advancedsearch.php?q=collection%3Afeature_films+AND+mediatype%3Amovies` +
    `&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=description` +
    `&sort%5B%5D=downloads+desc&rows=${BATCH_SIZE}&start=${start}&output=json`;
  const d = await fetchJson(url);
  return d?.response?.docs ?? [];
}

// Step 2: for each candidate, fetch its metadata and find an MP4 file.
// Returns null if no usable MP4 is found.
async function getFilmDetails(identifier: string): Promise<IAFilm | null> {
  try {
    const d = await fetchJson(`https://archive.org/metadata/${identifier}`, 8000);
    if (!d || !d.server) return null; // doesn't exist or removed

    const files: any[] = d.files ?? [];
    // Find the best MP4 file: prefer h.264 MPEG4 with a reasonable size.
    // Skip tiny files (likely samples) and huge files (likely 4K uploads
    // that would be too slow to stream).
    const mp4Candidates = files.filter(
      (f) =>
        (f.name?.toLowerCase().endsWith(".mp4") ||
          f.format === "MPEG4" ||
          f.format === "h.264" ||
          f.format === "H.264") &&
        f.size
    );

    // Sort by size desc — prefer the largest reasonable file (the actual movie)
    mp4Candidates.sort((a, b) => Number(b.size) - Number(a.size));

    for (const f of mp4Candidates) {
      const size = Number(f.size);
      // Skip files smaller than 50MB (likely samples/intros) or larger than
      // 3GB (likely too slow to stream in a demo).
      if (size < 50_000_000 || size > 3_000_000_000) continue;

      const mp4Url = `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`;

      // Try to find a poster image. IA usually has a derived thumbnail.
      let posterUrl: string | null = null;
      // Method 1: IA's "Image" format files
      const imageFile = files.find(
        (f) =>
          f.format === "JPEG" ||
          f.format === "PNG" ||
          f.format === "Thumbnail" ||
          (f.name?.toLowerCase().endsWith(".jpg") && f.name?.toLowerCase().includes("poster"))
      );
      if (imageFile) {
        posterUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(imageFile.name)}`;
      } else {
        // Method 2: IA's automatic thumbnail service
        posterUrl = `https://archive.org/services/img/${identifier}`;
      }

      return {
        identifier,
        title: d.metadata?.title || identifier,
        year: d.metadata?.year ? parseInt(String(d.metadata.year).slice(0, 4), 10) || null : null,
        description: (d.metadata?.description || "").toString().slice(0, 500),
        mp4Url,
        mp4Size: size,
        posterUrl,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Verify an MP4 URL actually responds (HEAD request).
async function verifyMp4(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(6000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("🎬 Fetching Internet Archive public-domain feature films...");

  // In append mode, load existing results so we don't refetch them
  let results: IAFilm[] = [];
  const seen = new Set<string>();
  if (APPEND_MODE && fs.existsSync(OUTPUT_PATH)) {
    try {
      results = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));
      results.forEach((r) => seen.add(r.identifier));
      console.log(`   Loaded ${results.length} existing films from ${OUTPUT_PATH}`);
    } catch {
      // ignore
    }
  }

  for (let page = 0; page < MAX_BATCHES && results.length < TARGET_COUNT; page++) {
    console.log(`\n--- Page ${page + 1} (have ${results.length}/${TARGET_COUNT}) ---`);
    const batch = await searchBatch(page);
    if (batch.length === 0) {
      console.log("  No more results from IA.");
      break;
    }

    for (const doc of batch) {
      if (results.length >= TARGET_COUNT) break;
      if (seen.has(doc.identifier)) continue;
      seen.add(doc.identifier);

      const film = await getFilmDetails(doc.identifier);
      if (!film || !film.mp4Url) {
        continue; // no usable MP4
      }

      // Verify the MP4 URL responds
      const ok = await verifyMp4(film.mp4Url);
      if (!ok) {
        continue;
      }

      results.push(film);
      console.log(
        `  ✓ ${film.title.slice(0, 50).padEnd(50)} | ${film.year || "????"} | ${(film.mp4Size / 1e6).toFixed(0)}MB`
      );

      // Be polite to IA's API
      await sleep(300);
    }
    // Write after each page so we make progress even if killed
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    await sleep(800);
  }

  // Write final results
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\n✅ Wrote ${results.length} films to ${OUTPUT_PATH}`);

  // Print a summary
  const withYear = results.filter((r) => r.year).length;
  const withPoster = results.filter((r) => r.posterUrl).length;
  console.log(`   ${withYear}/${results.length} have a year`);
  console.log(`   ${withPoster}/${results.length} have a poster URL`);
  const avgSize = results.reduce((s, r) => s + r.mp4Size, 0) / results.length;
  console.log(`   Average MP4 size: ${(avgSize / 1e6).toFixed(0)} MB`);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
