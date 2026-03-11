import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
    <div className="w-full">
      {/* Single viewport block — all states live here */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: "1 / 1" }}
      >
        {/* Camera feed — always in DOM so html5-qrcode can attach */}
        <div
          id="hl-qr-reader"
          ref={containerRef}
          className={`w-full h-full ${scanStatus === "scanning" ? "" : "invisible"}`}
        />

        {/* Violet scanning frame */}
        {(scanStatus === "scanning" || scanStatus === "fetching") && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[55%] aspect-square border-2 border-violet-400/90 rounded-2xl" />
          </div>
        )}

        {/* Close button — top-right overlay */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors z-10"
        >
          <X size={15} />
        </button>

        {/* Init / loading overlay */}
        {(scanStatus === "init" || scanStatus === "fetching") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <Loader2
              size={28}
              className="animate-spin text-violet-400"
            />
            <p className="text-xs text-white/70">
              {scanStatus === "init"
                ? "Kamera wird gestartet…"
                : "Katalog wird geladen…"}
            </p>
          </div>
        )}

        {/* Success overlay */}
        <AnimatePresence>
          {scanStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <CheckCircle2
                  size={28}
                  className="text-emerald-400"
                />
              </div>
              <p className="font-semibold text-white text-sm text-center px-4">
                {importedName
                  ? `„${importedName}" importiert!`
                  : "Katalog importiert!"}
              </p>
              <button
                onClick={onClose}
                className="mt-1 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all"
              >
                Fertig
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error overlay */}
        {scanStatus === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-5">
            <AlertCircle
              size={24}
              className="text-red-400"
            />
            <p className="text-xs text-white/70 text-center leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={() => {
                didHandleRef.current = false;
                setScanStatus("init");
                setErrorMsg(null);
              }}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all"
            >
              Erneut versuchen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
