import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Share2,
  Maximize2,
  Minimize2,
  Clock,
  Loader2,
  CircleAlert,
} from "lucide-react";
import { QRCode } from "react-qr-code";

const BASE_URL = "https://hexlearn.eddy.rip";

function formatCountdown(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function ShareCatalogModal({ catalog, onClose }) {
  const [ttlMinutes, setTtlMinutes] = useState(5);
  const [status, setStatus] = useState("idle"); // idle | loading | success | expired | error
  const [shareId, setShareId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer once QR is shown
  useEffect(() => {
    if (status !== "success") return;
    setCountdown(ttlMinutes * 60);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setStatus("expired");
          setFullscreen(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, ttlMinutes]);

  async function handleGenerate() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalog, ttl: ttlMinutes * 60 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unbekannter Fehler.");
      setShareId(data.id);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  const shareUrl = shareId ? `${BASE_URL}/?share=${shareId}` : null;

  return (
    <AnimatePresence>
      <motion.div
        key="share-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-[env(safe-area-inset-bottom,24px)] sm:pb-0"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          key="share-panel"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
              <Share2
                size={15}
                className="text-violet-600 dark:text-violet-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                {catalog.name}
              </p>
              <p className="text-xs text-slate-500">Katalog teilen</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body — animated state transitions */}
          <AnimatePresence mode="wait">
            {/* ── IDLE ── */}
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="px-5 py-5 flex flex-col gap-4"
              >
                {/* TTL slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock size={12} />
                      Gültigkeitsdauer
                    </label>
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 tabular-nums">
                      {ttlMinutes} Minute{ttlMinutes !== 1 ? "n" : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={ttlMinutes}
                    onChange={(e) => setTtlMinutes(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 Min</span>
                    <span>10 Min</span>
                  </div>
                </div>

                {/* Privacy notice */}
                <p className="text-xs text-slate-500 text-center leading-relaxed bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                  Daten werden nur für{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {ttlMinutes} Minute{ttlMinutes !== 1 ? "n" : ""}
                  </strong>{" "}
                  zwischengespeichert und dann automatisch gelöscht. Kein
                  Account, keine dauerhafte Speicherung.
                </p>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-sm font-semibold transition-all"
                >
                  QR-Code generieren
                </button>
              </motion.div>
            )}

            {/* ── LOADING ── */}
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-5 py-12 flex flex-col items-center gap-3"
              >
                <Loader2
                  size={28}
                  className="animate-spin text-violet-500"
                />
                <p className="text-sm text-slate-500">QR-Code wird erstellt…</p>
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {status === "success" && shareUrl && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="px-5 py-5 flex flex-col items-center gap-4"
              >
                {/* QR Code */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                  className="bg-white rounded-2xl p-3 shadow-inner"
                >
                  <QRCode
                    value={shareUrl}
                    size={220}
                    level="L"
                    style={{ display: "block" }}
                  />
                </motion.div>

                {/* Countdown */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={11} />
                  <span>
                    Läuft ab in{" "}
                    <strong className="text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatCountdown(countdown)}
                    </strong>
                  </span>
                </div>

                {/* Privacy */}
                <p className="text-xs text-slate-500 text-center leading-relaxed px-1">
                  Wird nach {ttlMinutes} Minute{ttlMinutes !== 1 ? "n" : ""}{" "}
                  automatisch gelöscht.{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    Kein Account
                  </strong>
                  , keine dauerhafte Speicherung.
                </p>

                {/* Fullscreen button */}
                <button
                  onClick={() => setFullscreen(true)}
                  className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
                >
                  <Maximize2 size={12} />
                  Vollbild
                </button>
              </motion.div>
            )}

            {/* ── EXPIRED ── */}
            {status === "expired" && (
              <motion.div
                key="expired"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-5 py-10 flex flex-col items-center gap-3 text-center"
              >
                <Clock
                  size={24}
                  className="text-amber-400"
                />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  QR-Code abgelaufen
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Der QR-Code war nur {ttlMinutes} Minute
                  {ttlMinutes !== 1 ? "n" : ""} gültig.
                </p>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setShareId(null);
                  }}
                  className="mt-1 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all"
                >
                  Neuen QR-Code erstellen
                </button>
              </motion.div>
            )}

            {/* ── ERROR ── */}
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-5 py-10 flex flex-col items-center gap-3 text-center"
              >
                <CircleAlert
                  size={24}
                  className="text-red-400"
                />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Fehler beim Erstellen
                </p>
                <p className="text-xs text-slate-500 leading-relaxed px-2">
                  {errorMsg}
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-1 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all"
                >
                  Erneut versuchen
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Fullscreen overlay */}
      {fullscreen && shareUrl && (
        <motion.div
          key="share-fullscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-8"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFullscreen(false);
            }}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Minimize2 size={18} />
          </button>
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 w-full max-w-xs"
          >
            <div className="bg-white rounded-3xl p-5 shadow-xl w-full">
              <QRCode
                value={shareUrl}
                size={280}
                level="L"
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Clock size={11} />
              <span className="tabular-nums">{formatCountdown(countdown)}</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              Tippe irgendwo, um zurückzukehren.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
