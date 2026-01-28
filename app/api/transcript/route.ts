import { NextRequest, NextResponse } from "next/server";
import { fetchTranscript } from "@egoist/youtube-transcript-plus";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
  lang?: string;
}

// Helper to extract array from response (handles different response formats)
function extractTranscriptArray(response: unknown): TranscriptItem[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === 'object') {
    // Check common property names
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.transcript)) return obj.transcript;
    if (Array.isArray(obj.transcripts)) return obj.transcripts;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.segments)) return obj.segments;
  }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Please provide a valid YouTube video URL." },
        { status: 400 }
      );
    }

    let transcriptItems: TranscriptItem[] = [];
    let language = "auto";

    // Try fetching without language preference first (gets any available)
    try {
      const response = await fetchTranscript(videoId);
      console.log("Transcript response type:", typeof response);
      console.log("Transcript response:", JSON.stringify(response).slice(0, 500));
      
      transcriptItems = extractTranscriptArray(response);
      if (transcriptItems.length > 0) {
        language = transcriptItems[0]?.lang || "auto-detected";
      }
    } catch (firstError) {
      console.log("First fetch error:", firstError);
      // If that fails, try with common languages
      const languages = ["en", "ar", "es", "fr", "de", "pt", "ru", "ja", "ko", "zh"];
      
      for (const lang of languages) {
        try {
          const response = await fetchTranscript(videoId, { lang });
          transcriptItems = extractTranscriptArray(response);
          if (transcriptItems.length > 0) {
            language = lang;
            break;
          }
        } catch {
          continue;
        }
      }
      
      // If still no transcript, throw the original error
      if (!transcriptItems || transcriptItems.length === 0) {
        throw firstError;
      }
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      return NextResponse.json(
        { error: "No transcript available for this video. The video might not have captions enabled." },
        { status: 404 }
      );
    }

    // Format transcript with timestamps (using 'offset' from the library)
    const formattedTranscript = transcriptItems.map((item) => ({
      text: item.text,
      start: item.offset, // Library uses 'offset' for start time
      duration: item.duration,
    }));

    // Create plain text version
    const plainText = transcriptItems.map((item) => item.text).join(" ");

    return NextResponse.json({
      videoId,
      transcript: formattedTranscript,
      plainText,
      totalSegments: transcriptItems.length,
      language,
    });
  } catch (error) {
    console.error("Transcript fetch error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("Could not find") || errorMessage.includes("disabled") || errorMessage.includes("No transcript")) {
      return NextResponse.json(
        { error: "Transcript not available. This video might have captions disabled or restricted." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: `Failed to fetch transcript: ${errorMessage}` },
      { status: 500 }
    );
  }
}
