import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/search?query=inception&category=Action
 *
 * Searches the local SQLite database for movies whose title contains `query`
 * (case-insensitive), optionally filtered by `category`. Returns each movie
 * along with its streaming `Source`s.
 *
 * - If `query` is empty we return all movies (capped) for the homepage grid.
 * - If `category` is provided and non-empty, we filter on the exact category.
 * - Both filters compose (AND).
 */
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
    const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";

    // Build the WHERE clause
    const where: {
      title?: { contains: string };
      category?: string;
    } = {};
    if (query) where.title = { contains: query };
    if (category) where.category = category;

    const movies = await db.movie.findMany({
      where,
      include: { sources: true },
      orderBy: { releaseYear: "desc" },
      take: 200,
    });

    return NextResponse.json({ query, category, count: movies.length, movies });
  } catch (err) {
    console.error("[/api/search] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
