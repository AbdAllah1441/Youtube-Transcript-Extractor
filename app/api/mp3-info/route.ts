import { NextRequest, NextResponse } from "next/server";
import { getYoutubeDl } from "@/lib/ytdlp";

export const runtime = "nodejs";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isPlaylistUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.searchParams.has("list");
  } catch {
    return false;
  }
}

function formatDuration(totalSeconds?: number): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds)) return "";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = (await request.json()) as { url?: string };

    if (!url?.trim()) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 },
      );
    }

    if (isPlaylistUrl(url)) {
      return NextResponse.json(
        {
          error:
            "Playlist URLs are not supported. Please provide a single video URL.",
        },
        { status: 400 },
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL." },
        { status: 400 },
      );
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const youtubedl = await getYoutubeDl();
    const info: any = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });

    return NextResponse.json({
      videoId,
      title: info?.title ?? "",
      thumbnail: info?.thumbnail ?? "",
      duration: formatDuration(info?.duration),
    });
  } catch (error) {
    console.error("MP3 info fetch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch video info: ${message}` },
      { status: 500 },
    );
  }
}
