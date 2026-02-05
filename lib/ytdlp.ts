import { join } from "node:path";
import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";

import { create as createYoutubeDl } from "youtube-dl-exec";
import YTDlpWrap from "yt-dlp-wrap";

export const runtime = "nodejs";

let cached: ReturnType<typeof createYoutubeDl> | null = null;
let initPromise: Promise<ReturnType<typeof createYoutubeDl>> | null = null;

/**
 * Ensure yt-dlp binary exists (downloaded if needed) and return a configured
 * youtube-dl-exec instance that uses that binary.
 *
 * This avoids relying on python/postinstall and works with just `npm run dev`.
 */
export async function getYoutubeDl() {
  if (cached) return cached;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const dir = join(tmpdir(), "youtube_utilizer_ytdlp");
    mkdirSync(dir, { recursive: true });

    const binaryPath = join(
      dir,
      process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
    );

    // yt-dlp-wrap doesn't auto-download. Pull latest yt-dlp from GitHub releases.
    // Guard with an existence check + an init lock to avoid ETXTBSY from concurrent requests.
    if (!existsSync(binaryPath)) {
      await YTDlpWrap.downloadFromGithub(binaryPath);
    }

    if (process.platform !== "win32") {
      try {
        chmodSync(binaryPath, 0o755);
      } catch {
        // best-effort
      }
    }

    cached = createYoutubeDl(binaryPath);
    return cached;
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}
