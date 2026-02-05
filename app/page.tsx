"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptResponse {
  videoId: string;
  transcript: TranscriptSegment[];
  plainText: string;
  totalSegments: number;
  language?: string;
}

type UILanguage = "en" | "ar";
type Theme = "light" | "dark";

const translations = {
  en: {
    title: "YouTube Transcript Extractor",
    subtitle: "Extract transcripts from any YouTube video instantly",
    placeholder: "Paste YouTube URL here...",
    button: "Get Transcript",
    extracting: "Extracting...",
    segments: "segments extracted",
    showTimestamps: "Show timestamps",
    copy: "Copy",
    copied: "Copied!",
    footer: "Works with videos that have captions enabled",
    navTranscript: "Transcript",
    navMp3: "MP3 Downloader",
  },
  ar: {
    title: "مستخرج نصوص يوتيوب",
    subtitle: "استخراج النصوص من أي فيديو يوتيوب فورًا",
    placeholder: "الصق رابط يوتيوب هنا...",
    button: "استخراج النص",
    extracting: "جارٍ الاستخراج...",
    segments: "مقطع مستخرج",
    showTimestamps: "إظهار التوقيت",
    copy: "نسخ",
    copied: "نُسخ",
    footer: "يعمل مع الفيديوهات التي تحتوي على نسخة مكتوبة فقط",
    navTranscript: "النص",
    navMp3: "تحميل MP3",
  },
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// RTL languages: Arabic, Hebrew, Persian/Farsi, Urdu
const RTL_LANGUAGES = ["ar", "he", "fa", "ur", "yi", "arc", "arz", "azb"];

function isRTL(language?: string): boolean {
  if (!language) return false;
  return RTL_LANGUAGES.some((rtl) => language.toLowerCase().startsWith(rtl));
}

// Sun icon for light mode
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

// Moon icon for dark mode
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

// Languages icon
function LanguagesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"
      />
    </svg>
  );
}

// Language Switcher Dropdown Component
function LanguageSwitcher({
  locale,
  setLocale,
}: {
  locale: UILanguage;
  setLocale: (locale: UILanguage) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
        aria-label="Change language"
      >
        <LanguagesIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden z-50">
          <button
            onClick={() => {
              setLocale("en");
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
              locale === "en"
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            English
          </button>
          <button
            onClick={() => {
              setLocale("ar");
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
              locale === "ar"
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            العربية
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uiLang, setUiLang] = useState<UILanguage>("en");
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Load saved preferences and apply theme on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("uiLang") as UILanguage | null;
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedLang) setUiLang(savedLang);

    // Determine initial theme
    const initialTheme: Theme =
      savedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    setTheme(initialTheme);

    // Apply theme immediately
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setMounted(true);
  }, []);

  // Apply theme to document when theme changes
  useEffect(() => {
    if (mounted) {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  // Save language preference
  useEffect(() => {
    localStorage.setItem("uiLang", uiLang);
  }, [uiLang]);

  const t = translations[uiLang];
  const isUIRTL = uiLang === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTranscript(null);

    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transcript");
      }

      setTranscript(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!transcript) return;

    const textToCopy = showTimestamps
      ? transcript.transcript
          .map((seg) => `[${formatTime(seg.start)}] ${seg.text}`)
          .join("\n")
      : transcript.plainText;

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div
      className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900"
      dir={isUIRTL ? "rtl" : "ltr"}
    >
      {/* Top Bar with Toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-2" dir="ltr">
        {/* Language Switcher Dropdown */}
        <LanguageSwitcher locale={uiLang} setLocale={setUiLang} />

        {/* Theme Toggle */}
        {!mounted ? (
          <button
            disabled
            className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-sm opacity-50"
            aria-label="Toggle theme"
          >
            <SunIcon className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400">
            {t.subtitle}
          </p>
        </div>

        <Navigation
          isRTL={isUIRTL}
          translations={{ transcript: t.navTranscript, mp3: t.navMp3 }}
        />

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div
            className={`flex flex-col sm:flex-row gap-3 ${isUIRTL ? "sm:flex-row-reverse" : ""}`}
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.placeholder}
              dir={isUIRTL ? "rtl" : "ltr"}
              className={`flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${isUIRTL ? "text-right" : "text-left"}`}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t.extracting}
                </span>
              ) : (
                t.button
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {/* Toolbar */}
            <div
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 ${isUIRTL ? "sm:flex-row-reverse" : ""}`}
            >
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-white">
                  {transcript.totalSegments}
                </span>{" "}
                {t.segments}
                {transcript.language && (
                  <span
                    className={`${isUIRTL ? "mr-2" : "ml-2"} px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-xs`}
                  >
                    {transcript.language}
                  </span>
                )}
              </div>
              <div
                className={`flex items-center gap-4 ${isUIRTL ? "flex-row-reverse" : ""}`}
              >
                <label
                  className={`flex items-center gap-2 cursor-pointer ${isUIRTL ? "flex-row-reverse" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={showTimestamps}
                    onChange={(e) => setShowTimestamps(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t.showTimestamps}
                  </span>
                </label>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-colors ${isUIRTL ? "flex-row-reverse" : ""}`}
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {t.copied}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {t.copy}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Transcript Content */}
            <div
              className="p-6 max-h-[600px] overflow-y-auto"
              dir={isRTL(transcript.language) ? "rtl" : "ltr"}
            >
              {showTimestamps ? (
                <div className="space-y-3">
                  {transcript.transcript.map((segment, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${isRTL(transcript.language) ? "flex-row-reverse" : ""}`}
                    >
                      <span className="shrink-0 text-sm font-mono text-zinc-400 dark:text-zinc-500 w-12">
                        {formatTime(segment.start)}
                      </span>
                      <p
                        className={`text-zinc-700 dark:text-zinc-300 leading-relaxed ${isRTL(transcript.language) ? "text-right" : ""}`}
                      >
                        {segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className={`text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap ${isRTL(transcript.language) ? "text-right" : ""}`}
                >
                  {transcript.plainText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-500">
          {t.footer}
        </p>
      </div>
    </div>
  );
}
