import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-react";

const VALID_TYPES = new Set([
  "multiple-choice",
  "true-false",
  "text-input",
  "fill-in-the-blank",
  "matching",
]);

function validateCatalog(data) {
  const questions = Array.isArray(data) ? data : data?.questions;
  if (!Array.isArray(questions) || questions.length === 0) return null;
  for (const q of questions) {
    const type = q.type ?? "multiple-choice";
    if (typeof q.id === "undefined" || typeof q.question !== "string")
      return null;
    if (!VALID_TYPES.has(type)) return null;
  }
  return {
    name: data?.name || "Geteilter Katalog",
    questions: questions.map((q) =>
      q.type ? q : { ...q, type: "multiple-choice" },
    ),
  };
}

export default function QRScannerImporter({ onCatalogAdded, onClose }) {
  const [scanStatus, setScanStatus] = useState("init"); // init | scanning | fetching | success | error
  const [errorMsg, setErrorMsg] = useState(null);
  const [importedName, setImportedName] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const didHandleRef = useRef(false);

  const handleScannedUrl = useCallback(
    async (url) => {
      if (didHandleRef.current) return;
      didHandleRef.current = true;

      // Stop scanner
      try {
        await scannerRef.current?.stop();
      } catch {}

      setScanStatus("fetching");

      try {
        // Extract ?share=ID from URL
        let shareId;
        try {
          const parsed = new URL(url);
          shareId = parsed.searchParams.get("share");
        } catch {
          throw new Error("Ungültige URL im QR-Code.");
        }

        if (!shareId || !/^[a-f0-9]{8}$/.test(shareId)) {
          throw new Error("QR-Code enthält keinen gültigen HexLearn-Share.");
        }

        const res = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`);
        if (res.status === 404) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error === "Share abgelaufen."
              ? "Dieser QR-Code ist abgelaufen."
              : "Share nicht gefunden.",
          );
        }
        if (!res.ok) throw new Error(`Server-Fehler ${res.status}`);

        const { catalog } = await res.json();
        const validated = validateCatalog(catalog);
        if (!validated) throw new Error("Ungültiges Katalog-Format.");

        onCatalogAdded(validated);
        setImportedName(validated.name);
        setScanStatus("success");
      } catch (err) {
        setErrorMsg(err.message || "Unbekannter Fehler");
        setScanStatus("error");
      }
    },
    [onCatalogAdded],
  );

  // Start html5-qrcode scanner
  useEffect(() => {
    if (scanStatus !== "init") return;
    let scanner;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        scanner = new Html5Qrcode("hl-qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            handleScannedUrl(decodedText);
          },
          () => {
            /* scanning frame — suppress errors */
          },
        );
        setScanStatus("scanning");
      } catch (err) {
        setErrorMsg(
          err?.message?.includes("NotAllowed") ||
            err?.message?.includes("Permission")
            ? "Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in den Browser-Einstellungen."
            : "Kamera konnte nicht gestartet werden.",
        );
        setScanStatus("error");
      }
    }

    startScanner();

    return () => {
      scanner?.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <QrCode
              size={15}
              className="text-violet-600 dark:text-violet-400"
            />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            QR-Code scannen
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Scanner viewport — always in DOM so html5-qrcode can attach */}
      <div
        className={`w-full rounded-2xl overflow-hidden bg-black relative ${
          scanStatus === "scanning" ? "block" : "hidden"
        }`}
        style={{ aspectRatio: "1 / 1", maxWidth: 320 }}
      >
        <div
          id="hl-qr-reader"
          ref={containerRef}
          className="w-full h-full"
        />
        {/* Viewfinder overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[220px] h-[220px] border-2 border-violet-400/80 rounded-2xl" />
        </div>
      </div>

      {/* Init / loading */}
      {scanStatus === "init" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2
            size={32}
            className="animate-spin text-violet-500"
          />
          <p className="text-sm text-slate-500">Kamera wird gestartet…</p>
        </div>
      )}

      {/* Fetching */}
      {scanStatus === "fetching" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2
            size={32}
            className="animate-spin text-violet-500"
          />
          <p className="text-sm text-slate-500">Katalog wird geladen…</p>
        </div>
      )}

      {/* Success */}
      <AnimatePresence>
        {scanStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-3 py-6 w-full"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle2
                size={28}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-base text-center">
              Katalog importiert!
            </p>
            {importedName && (
              <p className="text-sm text-slate-500 text-center">
                „{importedName}" wurde zu deinen Katalogen hinzugefügt.
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all"
            >
              Fertig
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {scanStatus === "error" && (
        <div className="flex flex-col items-center gap-4 py-4 w-full">
          <div className="flex gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl px-4 py-3 w-full">
            <AlertCircle
              size={15}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
              {errorMsg}
            </p>
          </div>
          <button
            onClick={() => {
              didHandleRef.current = false;
              setScanStatus("init");
              setErrorMsg(null);
            }}
            className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Hint */}
      {scanStatus === "scanning" && (
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          Halte den QR-Code eines geteilten HexLearn-Katalogs in das Suchfeld.
        </p>
      )}
    </div>
  );
}
