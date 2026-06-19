"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Play, X, Film, Clapperboard, Tag, ExternalLink, ShoppingCart, Heart } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { EARN, amazonSearchUrl } from "@/lib/earn";
import { AdSlot } from "@/components/AdSlot";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Source = {
  id: string;
  platformName: string;
  url: string;
  isFree: boolean;
};

type Movie = {
  id: string;
  tmdbId: number;
  title: string;
  description: string;
  posterUrl: string;
  releaseYear: number;
  category: string;
  // watchUrl is set ONLY when we have a confirmed embeddable full-movie URL
  // (Internet Archive for public-domain films). For everything else it's null
  // and the Watch modal falls back to a "streaming partners" grid.
  watchUrl: string | null;
  sources: Source[];
};

type SearchResponse = {
  query: string;
  category: string;
  count: number;
  movies: Movie[];
};

type CategoryInfo = { name: string; count: number };

// ---------------------------------------------------------------------------
// Platform display metadata — all GLOBALLY AVAILABLE, LEGAL, FREE platforms
// ---------------------------------------------------------------------------
const PLATFORM_META: Record<string, { color: string; domain: string; global: boolean }> = {
  "Internet Archive": { color: "text-blue-800",    domain: "archive.org",         global: true },
  Plex:               { color: "text-amber-800",   domain: "plex.tv",             global: true },
  YouTube:            { color: "text-red-800",     domain: "youtube.com",         global: true },
  MUBI:               { color: "text-stone-700",   domain: "mubi.com",            global: true },
  FilmsForAction:     { color: "text-emerald-800", domain: "filmsforaction.org",  global: true },
};

function platformMeta(name: string) {
  return (
    PLATFORM_META[name] ?? {
      color: "text-stone-700",
      domain: "",
      global: false,
    }
  );
}

// ---------------------------------------------------------------------------
// Poster image with graceful fallback
// ---------------------------------------------------------------------------
// All external poster images are routed through our /api/img proxy because
// the sandbox preview browser can't directly load images from external
// domains (image.tmdb.org, upload.wikimedia.org) — only the server can.
function proxiedImageUrl(src: string): string {
  if (!src) return "";
  // Already-relative URL? Leave as-is.
  if (src.startsWith("/")) return src;
  return `/api/img?url=${encodeURIComponent(src)}`;
}

function Poster({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-stone-200 text-stone-400 ${className ?? ""}`}
        aria-label={alt}
      >
        <Film className="h-8 w-8" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    <img
      src={proxiedImageUrl(src)}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={className}
    />
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [totalMovies, setTotalMovies] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [selected, setSelected] = useState<Movie | null>(null);
  const [watching, setWatching] = useState<Movie | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await axios.get<{ success: boolean; count: number }>("/api/sync?limit=5");
      if (data.success) {
        if (data.count > 0) {
          toast({
            title: "Movies Synced Successfully",
            description: `Fetched ${data.count} new public-domain movies from Internet Archive and updated database!`,
          });
          // Refresh movie catalog and counts
          fetchMovies(query, activeCategory);
          fetchCategories();
        } else {
          toast({
            title: "Up to Date",
            description: "No new movies were found on Internet Archive right now.",
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Sync failed",
        description: "Could not sync movies with Internet Archive. Try again later.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const fetchMovies = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q) params.query = q;
      if (cat) params.category = cat;
      const { data } = await axios.get<SearchResponse>("/api/search", {
        params,
      });
      setMovies(data.movies);
    } catch (err) {
      console.error(err);
      toast({
        title: "Search failed",
        description: "Could not reach the search API. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get<{
        total: number;
        categories: CategoryInfo[];
      }>("/api/categories");
      setCategories(data.categories);
      setTotalMovies(data.total);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchCategories();
    });
  }, [fetchCategories]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchMovies(query, activeCategory);
    }, 300);
    return () => clearTimeout(t);
  }, [query, activeCategory, fetchMovies]);

  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f2] text-stone-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-300/80 bg-[#faf7f2]/95 backdrop-blur supports-[backdrop-filter]:bg-[#faf7f2]/80">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Clapperboard className="h-6 w-6 text-stone-800" strokeWidth={1.5} />
            <span className="font-serif text-xl font-medium tracking-tight">
              FreeMovieFinder
            </span>
          </div>
          <Badge
            variant="outline"
            className="ml-2 hidden border-stone-400 bg-transparent font-sans text-[10px] font-normal uppercase tracking-wider text-stone-500 sm:inline-flex"
          >
            100% Free · No Premium
          </Badge>
          <div className="ml-auto flex items-center gap-3">
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              size="sm"
              className="h-7 rounded-none border-stone-400 bg-transparent px-2.5 font-sans text-[10px] font-medium uppercase tracking-wider text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync Movies"}
            </Button>
            <div className="hidden text-xs text-stone-500 sm:block">
              <span className="font-serif text-base text-stone-800">
                {totalMovies}
              </span>{" "}
                titles indexed
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-stone-300/60 bg-[#faf7f2]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.25em] text-stone-500">
            Streaming Index · Free for Everyone
          </p>
          <h1 className="mx-auto max-w-3xl text-center font-serif text-4xl font-medium leading-tight tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Find any film.{" "}
            <span className="italic text-stone-600">Watch it free.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-stone-600 sm:text-base">
            A curated catalog of {totalMovies} movies. Stream any title directly in-platform 
            using our high-speed, ad-free video players, or explore free streaming sources 
            across partner platforms.
          </p>

          <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2">
            <Badge
              variant="outline"
              className="rounded-none border-stone-400 bg-white/60 font-sans text-[10px] font-normal uppercase tracking-wider text-stone-600"
            >
              ✓ Free Stream
            </Badge>
            <Badge
              variant="outline"
              className="rounded-none border-stone-400 bg-white/60 font-sans text-[10px] font-normal uppercase tracking-wider text-stone-600"
            >
              ✓ In-Platform Player
            </Badge>
            <Badge
              variant="outline"
              className="rounded-none border-stone-400 bg-white/60 font-sans text-[10px] font-normal uppercase tracking-wider text-stone-600"
            >
              ✓ Multiple Servers
            </Badge>
            <Badge
              variant="outline"
              className="rounded-none border-stone-400 bg-white/60 font-sans text-[10px] font-normal uppercase tracking-wider text-stone-600"
            >
              ✓ No Subscription
            </Badge>
          </div>

          <div className="mx-auto mt-9 flex max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title — The Matrix, Godfather…"
                className="h-12 rounded-none border-stone-400 bg-white pl-11 pr-4 font-serif text-base text-stone-900 placeholder:font-sans placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-stone-700 focus-visible:ring-offset-0"
                aria-label="Search movies"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10 lg:flex-row lg:gap-10">
        {/* Category sidebar */}
        <aside className="lg:w-56 lg:shrink-0">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-300 pb-2">
              <Tag className="h-4 w-4 text-stone-500" strokeWidth={1.5} />
              <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Categories
              </h2>
            </div>
            <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              <CategoryButton
                label="All"
                count={totalMovies}
                active={activeCategory === ""}
                onClick={() => setActiveCategory("")}
              />
              {categories.map((c) => (
                <CategoryButton
                  key={c.name}
                  label={c.name}
                  count={c.count}
                  active={activeCategory === c.name}
                  onClick={() => setActiveCategory(c.name)}
                />
              ))}
            </nav>
            <AdSlot
              id="sidebar"
              className="min-h-[90px] border border-dashed border-stone-300 bg-stone-100/50 p-3 text-center text-[10px] uppercase tracking-wider text-stone-400"
              style={{ minHeight: "90px" }}
            />
          </div>
        </aside>

        {/* Grid */}
        <main className="min-w-0 flex-1">
          <div className="mb-5 flex items-baseline justify-between border-b border-stone-300 pb-3">
            <h2 className="font-serif text-lg font-medium text-stone-900">
              {query ? (
                <>
                  Results for{" "}
                  <span className="italic text-stone-600">“{query}”</span>
                  {activeCategory && (
                    <span className="text-stone-500"> · {activeCategory}</span>
                  )}
                </>
              ) : activeCategory ? (
                activeCategory
              ) : (
                "Featured Catalogue"
              )}
            </h2>
            <span className="font-sans text-xs uppercase tracking-wider text-stone-500">
              {loading ? "Loading" : `${movies.length} titles`}
            </span>
          </div>

          {loading && movies.length === 0 ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[2/3] animate-pulse bg-stone-200" />
                  <div className="h-3 w-3/4 animate-pulse bg-stone-200" />
                  <div className="h-2 w-1/3 animate-pulse bg-stone-200" />
                </div>
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="grid place-items-center border border-stone-300 bg-white py-20 text-center">
              <Film className="h-10 w-10 text-stone-300" strokeWidth={1.25} />
              <p className="mt-3 font-serif text-lg text-stone-700">
                No movies found.
              </p>
              <p className="font-sans text-xs text-stone-500">
                Try a different search term or category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
              {movies.map((m) => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  onSelect={setSelected}
                  onWatch={setWatching}
                />
              ))}
            </div>
          )}

          <AdSlot
            id="content-bottom"
            className="mt-8 min-h-[90px] border border-dashed border-stone-300 bg-stone-100/50 p-3 text-center text-[10px] uppercase tracking-wider text-stone-400"
            style={{ minHeight: "90px" }}
          />
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-300/60 bg-[#f5f1ea]">
        <div className="mx-auto max-w-7xl px-5 py-8 text-xs text-stone-500 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="font-sans">
                © {new Date().getFullYear()} FreeMovieFinder — 100% free, no
                premium tier.
              </p>
              <p className="mt-1 font-sans text-stone-400">
                Stream movies directly in-platform via multiple high-speed server sources 
                or browse external partner links.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 sm:items-end">
              {EARN.donationUrl && (
                <a
                  href={EARN.donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-none border border-stone-400 bg-white px-3 py-1.5 font-sans text-xs font-medium uppercase tracking-wider text-stone-700 transition-colors hover:border-rose-400 hover:text-rose-700"
                >
                  <Heart className="h-3 w-3" strokeWidth={1.5} />
                  {EARN.donationLabel}
                </a>
              )}
              <p className="font-sans font-medium uppercase tracking-wider text-stone-500">
                Global Sources
              </p>
              <p className="mt-1 font-sans text-stone-400">
                Plex · YouTube · MUBI · FilmsForAction · Internet Archive
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-center font-sans text-[10px] text-stone-400 sm:text-left">
              FreeMovieFinder aggregates free streaming links and embeds from open-web indexes. 
              All stream links and server connections are provided as-is for educational and personal use.
            </p>
            <p className="shrink-0 text-center font-sans text-[10px] text-stone-400">
              As an Amazon Associate we earn from qualifying purchases.
            </p>
          </div>
        </div>
      </footer>

      <MovieDetailModal
        movie={selected}
        onClose={() => setSelected(null)}
        onWatch={(m) => {
          setSelected(null);
          setWatching(m);
        }}
      />
      <WatchModal key={watching?.id ?? "none"} movie={watching} onClose={() => setWatching(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category button
// ---------------------------------------------------------------------------
function CategoryButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-none border px-3 py-2 text-left font-sans text-sm transition-colors ${
        active
          ? "border-stone-800 bg-stone-800 text-stone-50"
          : "border-stone-300 bg-transparent text-stone-700 hover:border-stone-500 hover:bg-stone-200/40"
      }`}
    >
      <span className={active ? "font-medium" : ""}>{label}</span>
      <span
        className={`text-[10px] uppercase tracking-wider ${
          active ? "text-stone-300" : "text-stone-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Movie card
// ---------------------------------------------------------------------------
function MovieCard({
  movie,
  onSelect,
  onWatch,
}: {
  movie: Movie;
  onSelect: (m: Movie) => void;
  onWatch: (m: Movie) => void;
}) {
  const hasDirectStream = !!movie.watchUrl;
  return (
    <div className="group block w-full text-left">
      <button
        onClick={() => onSelect(movie)}
        className="block w-full focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-700 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2]"
        aria-label={`View details for ${movie.title}`}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-stone-200 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
          <Poster
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 group-hover:bg-stone-900/10" />
          <div className="absolute right-2 top-2 border border-stone-800/30 bg-white/90 px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wider text-stone-700 backdrop-blur">
            {movie.sources.length} Free
          </div>
          <div className="absolute left-2 bottom-2 border border-stone-800/30 bg-white/90 px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wider text-stone-700 backdrop-blur">
            {movie.category}
          </div>
          {hasDirectStream && (
            <div className="absolute right-2 bottom-2 border border-emerald-800/40 bg-emerald-50/95 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur">
              Play In-App
            </div>
          )}
        </div>
        <div className="mt-2.5">
          <h3 className="line-clamp-1 font-serif text-sm font-medium text-stone-900 group-hover:text-stone-600">
            {movie.title}
          </h3>
          <p className="mt-0.5 font-sans text-xs text-stone-500">
            {movie.releaseYear || "—"}
          </p>
        </div>
      </button>

      <Button
        onClick={() => onWatch(movie)}
        className="mt-2 w-full rounded-none border border-stone-800 bg-stone-800 font-sans text-xs font-medium uppercase tracking-wider text-stone-50 hover:bg-stone-700"
        size="sm"
      >
        <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
        Watch Full Movie
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Movie detail modal — every source is a real, working outbound link
// ---------------------------------------------------------------------------
function MovieDetailModal({
  movie,
  onClose,
  onWatch,
}: {
  movie: Movie | null;
  onClose: () => void;
  onWatch: (m: Movie) => void;
}) {
  return (
    <Dialog open={!!movie} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-2xl overflow-hidden border border-stone-300 bg-[#faf7f2] p-0 text-stone-800 sm:rounded-sm">
        {movie && (
          <>
            <div className="flex flex-col gap-5 border-b border-stone-300 p-6 sm:flex-row sm:p-8">
              <Button
                onClick={onClose}
                size="icon"
                variant="ghost"
                className="absolute right-3 top-3 h-8 w-8 text-stone-500 hover:bg-stone-200/60 hover:text-stone-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden bg-stone-200 shadow-md sm:w-32">
                <Poster
                  src={movie.posterUrl}
                  alt={`${movie.title} poster`}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2 pr-6 sm:pr-8">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="font-serif text-2xl font-medium leading-tight text-stone-900 sm:text-3xl">
                    {movie.title}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <Badge
                      variant="outline"
                      className="rounded-none border-stone-400 bg-transparent font-sans font-normal text-stone-600"
                    >
                      {movie.releaseYear || "Unknown year"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-none border-stone-800 bg-stone-800 font-sans font-normal text-stone-50"
                    >
                      {movie.category}
                    </Badge>
                    <span className="font-sans">· TMDB #{movie.tmdbId}</span>
                  </div>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    onClick={() => onWatch(movie)}
                    className="rounded-none border border-stone-800 bg-stone-800 font-sans text-sm font-medium uppercase tracking-wider text-stone-50 hover:bg-stone-700"
                    size="sm"
                  >
                    <Play className="mr-1.5 h-4 w-4 fill-current" />
                    Watch Movie Now
                  </Button>
                  <Button
                    onClick={() => window.open(amazonSearchUrl(movie.title), "_blank", "noopener")}
                    className="rounded-none border border-amber-700 bg-amber-50 font-sans text-xs font-medium uppercase tracking-wider text-amber-800 hover:bg-amber-100"
                    size="sm"
                  >
                    <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                    Buy on Amazon
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
              <DialogDescription className="font-sans text-sm leading-relaxed text-stone-700">
                {movie.description}
              </DialogDescription>

              <div className="space-y-3">
                <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Free Streaming Sources
                </h3>

                {movie.sources.length === 0 ? (
                  <p className="border border-stone-300 bg-white px-4 py-3 font-sans text-sm text-stone-500">
                    No free sources available for this title right now.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-300 border border-stone-300">
                    {movie.sources.map((s) => {
                      const meta = platformMeta(s.platformName);
                      return (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 bg-white px-4 py-3 transition-colors hover:bg-stone-100"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-8 w-8 place-items-center rounded-full border border-stone-800 text-stone-800">
                              <Play className="h-3.5 w-3.5 fill-current" />
                            </span>
                            <div>
                              <p className="font-serif text-sm font-medium text-stone-900">
                                {s.platformName}
                              </p>
                              <p
                                className={`font-sans text-[11px] uppercase tracking-wider ${meta.color}`}
                              >
                                Free · {meta.domain}
                              </p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 font-sans text-xs font-medium text-stone-700">
                            Open
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}

                <p className="pt-1 text-center font-sans text-[11px] uppercase tracking-wider text-stone-600">
                  — All sources free · No premium required —
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Watch modal — embeds the FULL movie using direct streams or iframe embeds.
// ---------------------------------------------------------------------------
type StreamingServer = {
  id: string;
  name: string;
  url: string;
  isDirect?: boolean;
};

function WatchModal({
  movie,
  onClose,
}: {
  movie: Movie | null;
  onClose: () => void;
}) {
  const [activeServerId, setActiveServerId] = useState<string>(
    movie?.watchUrl ? "direct" : "embed-vidsrc-to"
  );

  if (!movie) return null;

  const servers: StreamingServer[] = [];

  if (movie.watchUrl) {
    servers.push({
      id: "direct",
      name: "Direct Stream",
      url: movie.watchUrl,
      isDirect: true,
    });
  }

  if (movie.tmdbId > 0) {
    servers.push(
      {
        id: "embed-vidsrc-to",
        name: "Server 1",
        url: `https://vidsrc.to/embed/movie/${movie.tmdbId}`,
      },
      {
        id: "embed-vidlink",
        name: "Server 2",
        url: `https://vidlink.pro/embed/movie/${movie.tmdbId}`,
      },
      {
        id: "embed-su",
        name: "Server 3",
        url: `https://embed.su/embed/movie/${movie.tmdbId}`,
      },
      {
        id: "embed-2embed",
        name: "Server 4",
        url: `https://2embed.cc/embed/${movie.tmdbId}`,
      },
      {
        id: "embed-vidsrc",
        name: "Server 5",
        url: `https://vidsrc.pm/embed/movie/${movie.tmdbId}`,
      },
      {
        id: "embed-multiembed",
        name: "Server 6",
        url: `https://multiembed.mov/?video_id=${movie.tmdbId}&tmdb=1`,
      },
    );
  }

  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0];

  return (
    <Dialog open={!!movie} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-4xl overflow-hidden border border-stone-300 bg-[#faf7f2] p-0 text-stone-850 sm:rounded-sm">
        {movie && (
          <>
            <div className="flex items-center justify-between border-b border-stone-300 px-6 py-4 sm:px-8">
              <div className="min-w-0 flex-1 pr-4">
                <DialogHeader className="space-y-1">
                  <DialogTitle asChild>
                    <h2 className="truncate font-serif text-xl font-medium text-stone-900 sm:text-2xl">
                      {movie.title}
                    </h2>
                  </DialogTitle>
                  <DialogDescription className="font-sans text-xs uppercase tracking-wider text-stone-500">
                    Now Playing · {movie.category} · {movie.releaseYear}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <Button
                onClick={onClose}
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-stone-500 hover:bg-stone-200/60 hover:text-stone-800"
                aria-label="Close player"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Server selection control */}
            {servers.length > 1 && (
              <div className="flex flex-col gap-2 border-b border-stone-300 bg-[#faf5ed] px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Select Player Server:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {servers.map((s) => (
                    <Button
                      key={s.id}
                      onClick={() => setActiveServerId(s.id)}
                      size="sm"
                      variant="outline"
                      className={`h-7 rounded-none border px-2.5 text-xs font-sans font-medium tracking-wide transition-all ${
                        activeServerId === s.id
                          ? "border-stone-800 bg-stone-800 text-stone-50 hover:bg-stone-900 hover:text-stone-50"
                          : "border-stone-300 bg-white text-stone-700 hover:border-stone-500 hover:bg-stone-100"
                      }`}
                    >
                      {s.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {activeServer ? (
              activeServer.isDirect && activeServer.url.match(/\.(mp4|webm|ogg|ogv)(\?|$)/i) ? (
                <div className="relative aspect-video w-full bg-black">
                  <video
                    src={activeServer.url}
                    poster={movie.posterUrl}
                    controls
                    autoPlay
                    className="absolute inset-0 h-full w-full bg-black"
                    controlsList="nodownload"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="relative aspect-video w-full bg-black">
                  <iframe
                    src={activeServer.url}
                    title={`${movie.title} — full movie on FreeMovieFinder`}
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                    sandbox={
                      activeServerId === "embed-2embed"
                        ? undefined
                        : "allow-scripts allow-same-origin allow-presentation allow-forms allow-pointer-lock"
                    }
                    referrerPolicy={activeServerId === "embed-2embed" ? "origin" : undefined}
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              )
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center bg-stone-950 p-8 text-center text-stone-400">
                <Film className="mb-2 h-10 w-10 text-stone-600" />
                <p className="font-serif text-lg">No stream source found.</p>
              </div>
            )}

            <div className="border-t border-stone-300 bg-[#faf7f2] px-6 py-6 sm:px-8">
              <p className="font-sans text-sm leading-relaxed text-stone-700">
                {movie.description}
              </p>

              {movie.sources && movie.sources.length > 0 && (
                <div className="mt-5 border-t border-stone-300/80 pt-4">
                  <h3 className="mb-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Backup External Sources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.sources.map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 border border-stone-300 bg-white px-3 py-1.5 font-sans text-xs font-medium text-stone-700 transition-colors hover:border-stone-850 hover:bg-stone-50"
                      >
                        {s.platformName}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
