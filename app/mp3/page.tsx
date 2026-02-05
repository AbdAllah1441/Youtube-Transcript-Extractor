"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";

type UILanguage = "en" | "ar";
type Theme = "light" | "dark";

type Mp3Info = {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
};

const translations = {
  en: {
    title: "YouTube MP3 Downloader",
    subtitle: "Download the highest quality audio as MP3",
    placeholder: "Paste YouTube URL here...",
    fetchInfo: "Fetch Info",
    fetching: "Fetching...",
    download: "Download MP3",
    downloading: "Downloading...",
    navTranscript: "Transcript",
    navMp3: "MP3 Downloader",
    footer: "Audio is downloaded as MP3 (best available quality).",
  },
  ar: {
    title: "تحميل MP3 من يوتيوب",
    subtitle: "تحميل أفضل جودة صوت بصيغة MP3",
    placeholder: "الصق رابط يوتيوب هنا...",
    fetchInfo: "جلب المعلومات",
    fetching: "جارٍ الجلب...",
    download: "تحميل MP3",
    downloading: "جارٍ التحميل...",
    navTranscript: "النص",
    navMp3: "تحميل MP3",
    footer: "يتم تنزيل الصوت بصيغة MP3 بأفضل جودة متاحة.",
  },
};

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

function LanguageSwitcher({
  locale,
  setLocale,
}: {
  locale: UILanguage;
  setLocale: (locale: UILanguage) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

function parseContentDispositionFilename(
  headerValue: string | null,
): string | null {
  if (!headerValue) return null;
  const match = /filename="([^"]+)"/i.exec(headerValue);
  return match?.[1] ?? null;
}

export default function Mp3Page() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<Mp3Info | null>(null);

  const [uiLang, setUiLang] = useState<UILanguage>("en");
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("uiLang") as UILanguage | null;
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedLang) setUiLang(savedLang);

    const initialTheme: Theme =
      savedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initialTheme);
    if (initialTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("uiLang", uiLang);
  }, [uiLang]);

  useEffect(() => {
    if (!mounted) return;
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const t = translations[uiLang];
  const isUIRTL = uiLang === "ar";

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const handleFetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/mp3-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch info");
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) return;
    setDownloading(true);
    setError(null);

    try {
      const response = await fetch("/api/download-mp3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any)?.error || "MP3 download failed");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      const filename =
        parseContentDispositionFilename(
          response.headers.get("content-disposition"),
        ) || (info?.title ? `${info.title}.mp3` : "youtube_audio.mp3");

      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "MP3 download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900"
      dir={isUIRTL ? "rtl" : "ltr"}
    >
      {/* Top Bar with Toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-2" dir="ltr">
        <LanguageSwitcher locale={uiLang} setLocale={setUiLang} />

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
        <form onSubmit={handleFetchInfo} className="mb-8">
          <div
            className={`flex flex-col sm:flex-row gap-3 ${isUIRTL ? "sm:flex-row-reverse" : ""}`}
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.placeholder}
              dir={isUIRTL ? "rtl" : "ltr"}
              className={`flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                isUIRTL ? "text-right" : "text-left"
              }`}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? t.fetching : t.fetchInfo}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {info && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="p-6">
              <div
                className={`flex gap-4 mb-6 ${isUIRTL ? "flex-row-reverse" : ""}`}
              >
                {info.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={info.thumbnail}
                    alt={info.title}
                    className="w-32 h-24 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-32 h-24 rounded-lg bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 truncate">
                    {info.title || "—"}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {info.duration || ""}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-medium transition-colors disabled:cursor-not-allowed"
              >
                {downloading ? t.downloading : t.download}
              </button>

              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 text-center">
                {t.footer}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
