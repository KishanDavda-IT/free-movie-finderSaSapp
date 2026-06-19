import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/categories
 *
 * Returns the list of categories with the number of movies in each.
 * Used to populate the sidebar / filter strip on the homepage.
 */
export async function GET() {
  try {
    const grouped = await db.movie.groupBy({
      by: ["category"],
      _count: true,
      orderBy: { category: "asc" },
    });

    const total = await db.movie.count();

    return NextResponse.json({
      total,
      categories: grouped.map((g) => ({
        name: g.category,
        count: g._count,
      })),
    });
  } catch (err) {
    console.error("[/api/categories] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
