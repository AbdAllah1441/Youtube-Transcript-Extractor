import { NextRequest, NextResponse } from "next/server";
import { createReadStream, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
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

function safeFilename(input: string): string {
  return (
    input
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 120)
      .trim() || "youtube_audio"
  );
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

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

    const timestamp = Date.now();
    tempFilePath = join(tmpdir(), `youtube_mp3_${timestamp}.mp3`);

    const youtubedl = await getYoutubeDl();
    await youtubedl(videoUrl, {
      output: tempFilePath,
      // best available audio
      format: "bestaudio/best",
      extractAudio: true,
      audioFormat: "mp3",
      audioQuality: 0,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
    } as any);

    // Fetch title for filename
    const info: any = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
    });

    const filename = `${safeFilename(info?.title ?? "youtube_audio")}.mp3`;

    const fileStream = createReadStream(tempFilePath);

    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => {
          controller.close();
          if (tempFilePath) {
            try {
              unlinkSync(tempFilePath);
            } catch (e) {
              console.error("Failed to delete temp mp3:", e);
            }
          }
        });
        fileStream.on("error", (err) => {
          console.error("MP3 stream error:", err);
          controller.error(err);
          if (tempFilePath) {
            try {
              unlinkSync(tempFilePath);
            } catch (e) {
              console.error("Failed to delete temp mp3 after stream error:", e);
            }
          }
        });
      },
      cancel() {
        fileStream.destroy();
        if (tempFilePath) {
          try {
            unlinkSync(tempFilePath);
          } catch (e) {
            console.error("Failed to delete temp mp3 after cancel:", e);
          }
        }
      },
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    if (tempFilePath) {
      try {
        unlinkSync(tempFilePath);
      } catch (e) {
        console.error("Failed to delete temp mp3 after error:", e);
      }
    }

    console.error("MP3 download error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `MP3 download failed: ${message}` },
      { status: 500 },
    );
  }
}
