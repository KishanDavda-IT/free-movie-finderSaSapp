/**
 * scripts/ia-films.ts
 *
 * Auto-generated list of public-domain feature films fetched from Internet
 * Archive. Each entry has a verified MP4 URL that can be played directly in
 * an HTML5 <video> tag — no iframe, no IA branding, the movie plays natively
 * on our platform.
 *
 * The list lives at scripts/ia_films.json (bundled with the project so the
 * seed works out of the box). To refresh it with more films, run:
 *
 *   bun run scripts/fetch-ia-catalog.ts
 *
 * That script is append-mode — re-running it adds more verified PD films to
 * the JSON without refetching existing entries.
 */

import * as fs from "fs";
import * as path from "path";

export type IAFilm = {
  identifier: string;
  title: string;
  year: number | null;
  description: string;
  mp4Url: string;
  mp4Size: number;
  posterUrl: string;
};

// Resolve relative to this file so it works no matter where the project lives.
const IA_FILMS_PATH = path.join(__dirname, "ia_films.json");

let IA_FILMS: IAFilm[] = [];
try {
  IA_FILMS = JSON.parse(fs.readFileSync(IA_FILMS_PATH, "utf-8"));
} catch (e) {
  console.warn(
    `⚠️  Could not load ${IA_FILMS_PATH}: ${(e as Error).message}\n` +
      "   Run `bun run scripts/fetch-ia-catalog.ts` first to generate it.\n" +
      "   Continuing with an empty IA film list."
  );
}

export { IA_FILMS };
