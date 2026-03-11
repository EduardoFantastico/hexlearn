import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Share2,
  Maximize2,
  Minimize2,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import QRCode from "react-qr-code";

const BASE_URL = "https://hexlearn.eddy.rip";

function formatCountdown(ms) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ShareCatalogModal({ catalog, onClose }) {
  const [ttl, setTtl] = useState(10);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | expired | error
  const [shareId, setShareId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const shareUrl = shareId ? `${BASE_URL}/?share=${shareId}` : null;

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = expiresAt - Date.now();
      if (left <= 0) {
        setTimeLeft(0);
        setStatus("expired");
      } else {
        setTimeLeft(left);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [expiresAt]);

  const handleGenerate = useCallback(async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalog, ttlMinutes: ttl }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || `Server-Fehler ${res.status}`);
      }
      const { id, expiresAt: exp } = await res.json();
      setShareId(id);
      setExpiresAt(exp);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Unbekannter Fehler");
      setStatus("error");
    }
  }, [catalog, ttl]);

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
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
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
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
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

          <div className="px-5 py-5 flex flex-col gap-5">
            {/* Privacy notice */}
            <div className="flex gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl px-3.5 py-3">
              <Clock
                size={14}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Daten werden nur für max.{" "}
                <strong>10 Minuten zwischengespeichert</strong> und danach
                automatisch gelöscht. Kein Account, keine dauerhafte
                Speicherung.
              </p>
            </div>

            {/* TTL Slider — only before generating */}
            {status === "idle" || status === "error" ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Verfügbar für
                  </label>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                    {ttl} {ttl === 1 ? "Minute" : "Minuten"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1 Min</span>
                  <span>10 Min</span>
                </div>
              </div>
            ) : null}

            {/* Error */}
            {status === "error" && errorMsg && (
              <div className="flex gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl px-3.5 py-3">
                <AlertCircle
                  size={14}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errorMsg}
                </p>
              </div>
            )}

            {/* QR Code area */}
            {(status === "ready" || status === "expired") && shareUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col items-center gap-3"
              >
                {/* QR container */}
                <div
                  className={`relative bg-white rounded-2xl p-3 shadow-inner ${
                    status === "expired" ? "opacity-40 grayscale" : ""
                  }`}
                >
                  <QRCode
                    value={shareUrl}
                    size={220}
                    level="L"
                    style={{ display: "block" }}
                  />
                  {status === "expired" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
                      <span className="bg-white/90 dark:bg-slate-900/90 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200">
                        Abgelaufen
                      </span>
                    </div>
                  )}
                </div>

                {/* Countdown */}
                {status === "ready" && timeLeft !== null && (
                  <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                    <Clock
                      size={13}
                      className="text-violet-500"
                    />
                    <span>{formatCountdown(timeLeft)}</span>
                    <span className="text-xs font-normal text-slate-500">
                      verbleibend
                    </span>
                  </div>
                )}

                {/* Short URL display */}
                <p className="text-[11px] text-slate-400 break-all text-center font-mono px-2">
                  {shareUrl}
                </p>

                {/* Fullscreen button */}
                {status === "ready" && (
                  <button
                    onClick={() => setFullscreen(true)}
                    className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
                  >
                    <Maximize2 size={12} />
                    Vollbild
                  </button>
                )}
              </motion.div>
            )}

            {/* Generate / Retry button */}
            {(status === "idle" ||
              status === "error" ||
              status === "expired") && (
              <button
                onClick={handleGenerate}
                disabled={status === "loading"}
                className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={14} />
                {status === "expired"
                  ? "Neuen QR-Code generieren"
                  : "QR-Code generieren"}
              </button>
            )}

            {/* Loading spinner */}
            {status === "loading" && (
              <div className="flex justify-center py-4">
                <Loader2
                  size={28}
                  className="animate-spin text-violet-500"
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Fullscreen overlay */}
      {fullscreen && shareUrl && status === "ready" && (
        <motion.div
          key="share-fullscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-8"
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
            <div className="bg-white rounded-3xl p-4 shadow-2xl w-full flex items-center justify-center">
              <QRCode
                value={shareUrl}
                size={Math.min(
                  window.innerWidth - 80,
                  window.innerHeight - 160,
                  400,
                )}
                level="L"
                style={{ display: "block", maxWidth: "100%", height: "auto" }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
              <Clock
                size={13}
                className="text-violet-500"
              />
              <span>{formatCountdown(timeLeft)}</span>
              <span className="text-xs font-normal text-slate-400">
                verbleibend
              </span>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Antippen zum Schließen
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
