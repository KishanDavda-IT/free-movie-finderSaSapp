import { NextRequest, NextResponse } from "next/server";
import { movies, type MovieData } from "@/data/movies-data";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
    const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";

    let filtered: MovieData[] = movies;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter((m) => m.title.toLowerCase().includes(q));
    }

    if (category) {
      filtered = filtered.filter((m) => m.category === category);
    }

    // Sort by releaseYear descending, take 200
    filtered.sort((a, b) => b.releaseYear - a.releaseYear);
    filtered = filtered.slice(0, 200);

    return NextResponse.json({
      query,
      category,
      count: filtered.length,
      movies: filtered,
    });
  } catch (err) {
    console.error("[/api/search] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
