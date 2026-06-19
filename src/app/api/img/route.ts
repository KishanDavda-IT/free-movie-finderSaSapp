import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/img?url=<encoded image URL>
 *
 * Image proxy. The sandbox preview browser can't directly load images from
 * external domains (image.tmdb.org, upload.wikimedia.org, etc.) — it gets
 * network errors when the browser tries to fetch them. This route fetches
 * the image server-side (where external network works) and streams it back
 * to the browser with proper Content-Type and long-lived cache headers.
 *
 * Security: only the whitelisted hostnames below are allowed, so this can't
 * be abused as an open proxy.
 */

const ALLOWED_HOSTNAMES = new Set([
  "image.tmdb.org",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "placehold.co",
  "archive.org",
]);

function isAllowed(hostname: string): boolean {
  // Allow exact matches + any *.archive.org subdomain
  return (
    ALLOWED_HOSTNAMES.has(hostname) || hostname.endsWith(".archive.org")
  );
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!isAllowed(target.hostname)) {
    return NextResponse.json(
      { error: `Hostname ${target.hostname} not allowed` },
      { status: 403 }
    );
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        // Wikimedia's image CDN rejects requests with custom User-Agents
        // (it wants a browser-like one). TMDB is more permissive. Using a
        // realistic browser UA satisfies both.
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        // Some CDNs check Referer; lie politely.
        Referer: target.origin + "/",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await upstream.arrayBuffer());

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 7 days on the client AND a shared CDN if present.
        "Cache-Control": "public, max-age=604800, immutable",
        "Content-Length": String(buf.length),
      },
    });
  } catch (err) {
    console.error("[/api/img] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 }
    );
  }
}
