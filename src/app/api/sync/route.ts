import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function verifyMp4(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(5000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * GET /api/sync
 *
 * Automated system to sync/import new free movies from the Internet Archive.
 * It:
 *   1. Finds the current range of negative synthetic TMDB IDs in the DB.
 *   2. Queries the Internet Archive search API for popular movies.
 *   3. Excludes existing titles to avoid duplicates.
 *   4. Verifies their MP4 streams are active.
 *   5. Saves them directly to the database.
 */
export async function GET(req: NextRequest) {
  try {
    const limitParam = req.nextUrl.searchParams.get("limit") || "5";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 5, 1), 15); // process 1-15 candidates per sync run to prevent timeouts

    // 1. Get the lowest synthetic tmdbId
    const lowestMovie = await db.movie.findFirst({
      where: { tmdbId: { lt: 0 } },
      orderBy: { tmdbId: "asc" },
    });
    let nextSyntheticId = lowestMovie ? lowestMovie.tmdbId - 1 : -1;

    // 2. Fetch popular movies from IA search API
    // We fetch a batch of 50 candidates, sort by downloads desc to get the best ones.
    const searchUrl =
      `https://archive.org/advancedsearch.php?q=collection%3Afeature_films+AND+mediatype%3Amovies` +
      `&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=description` +
      `&sort%5B%5D=downloads+desc&rows=50&output=json`;

    const searchResponse = await fetch(searchUrl, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Internet Archive search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const docs = searchData?.response?.docs || [];

    // Get all existing movie titles to avoid duplicates
    const existingTitles = new Set(
      (await db.movie.findMany({ select: { title: true } })).map((m) =>
        m.title.toLowerCase().trim()
      )
    );

    const addedMovies: Array<{
      id: string;
      title: string;
      releaseYear: number;
      watchUrl: string | null;
    }> = [];

    // 3. Process candidates
    for (const doc of docs) {
      if (addedMovies.length >= limit) break;

      const title = doc.title || "";
      const identifier = doc.identifier || "";
      if (!title || !identifier) continue;

      // Skip duplicates
      if (existingTitles.has(title.toLowerCase().trim())) continue;

      // 4. Fetch metadata for the candidate to find the MP4 file
      try {
        const metaRes = await fetch(`https://archive.org/metadata/${identifier}`, {
          headers: { "User-Agent": UA },
          signal: AbortSignal.timeout(6000),
        });
        if (!metaRes.ok) continue;

        const metaData = await metaRes.json();
        const files = metaData.files || [];

        // Search for a playable MP4 file (50MB to 2.5GB)
        const mp4Candidates = files.filter(
          (f: any) =>
            (f.name?.toLowerCase().endsWith(".mp4") ||
              f.format === "MPEG4" ||
              f.format === "h.264" ||
              f.format === "H.264") &&
            f.size
        );
        mp4Candidates.sort((a: any, b: any) => Number(b.size) - Number(a.size));

        let verifiedMp4Url: string | null = null;
        let mp4Size = 0;

        for (const file of mp4Candidates) {
          const size = Number(file.size);
          if (size < 50_000_000 || size > 2_500_000_000) continue;

          const url = `https://archive.org/download/${identifier}/${encodeURIComponent(file.name)}`;
          const ok = await verifyMp4(url);
          if (ok) {
            verifiedMp4Url = url;
            mp4Size = size;
            break;
          }
        }

        if (!verifiedMp4Url) continue; // no working mp4 stream found

        // Resolve poster
        const imageFile = files.find(
          (f: any) =>
            f.format === "JPEG" ||
            f.format === "PNG" ||
            f.format === "Thumbnail" ||
            (f.name?.toLowerCase().endsWith(".jpg") && f.name?.toLowerCase().includes("poster"))
        );
        const posterUrl = imageFile
          ? `https://archive.org/download/${identifier}/${encodeURIComponent(imageFile.name)}`
          : `https://archive.org/services/img/${identifier}`;

        const year = metaData.metadata?.year
          ? parseInt(String(metaData.metadata.year).slice(0, 4), 10) || 0
          : 0;

        let category = "Classic";
        if (year) {
          if (year >= 1950 && year < 1960) category = "Classic";
          else if (year >= 1960 && year < 1970) category = "Classic";
          else if (year >= 1970 && year < 1980) category = "Action";
          else if (year >= 1980) category = "Drama";
        }

        // 5. Create movie and sources in the DB
        const movie = await db.movie.create({
          data: {
            tmdbId: nextSyntheticId,
            title,
            description:
              (metaData.metadata?.description || "").toString().slice(0, 500) ||
              `Public-domain film streamed from Internet Archive. Originally released ${year || "in an unknown year"}.`,
            posterUrl,
            releaseYear: year,
            category,
            watchUrl: verifiedMp4Url,
          },
        });

        // Add standard streaming sources
        const sourcePlatforms = [
          { name: "Internet Archive", url: `https://archive.org/details/${identifier}` },
          { name: "Plex", url: `https://www.plex.tv/search/?query=${encodeURIComponent(title)}` },
          {
            name: "YouTube",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
              title + " full movie free"
            )}`,
          },
          { name: "MUBI", url: `https://mubi.com/en/search/films?query=${encodeURIComponent(title)}` },
          {
            name: "FilmsForAction",
            url: `https://www.filmsforaction.org/search/?q=${encodeURIComponent(title)}`,
          },
        ];

        for (const platform of sourcePlatforms) {
          await db.source.create({
            data: {
              movieId: movie.id,
              platformName: platform.name,
              url: platform.url,
              isFree: true,
            },
          });
        }

        addedMovies.push({
          id: movie.id,
          title: movie.title,
          releaseYear: movie.releaseYear,
          watchUrl: movie.watchUrl,
        });

        // Decrement for the next movie
        nextSyntheticId--;
      } catch (err) {
        console.error(`Error syncing movie ${identifier}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      count: addedMovies.length,
      movies: addedMovies,
    });
  } catch (err) {
    console.error("[/api/sync] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
