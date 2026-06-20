import { NextResponse } from "next/server";
import { categories, totalMovies } from "@/data/movies-data";

export async function GET() {
  try {
    return NextResponse.json({
      total: totalMovies,
      categories,
    });
  } catch (err) {
    console.error("[/api/categories] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
