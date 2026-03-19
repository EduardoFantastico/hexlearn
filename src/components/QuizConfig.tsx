import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Minus,
  Plus,
  LayoutGrid,
  BrainCircuit,
} from "lucide-react";

/**
 * QuizConfig
 *
 * Props:
 *   catalogs     – full catalog list from useCatalogs
 *   stats        – question stats map from useQuestionStats
 *   initialIds   – catalog IDs pre-selected when this screen opens
 *   onStart      – (catalogIds: string[], count: number, mode: string) => void
 *   onBack       – () => void
 */
export default function QuizConfig({
  catalogs,
  stats,
  initialIds = [],
  onStart,
  onBack,
}) {
  const [selectedIds, setSelectedIds] = useState(() =>
    initialIds.length > 0
      ? initialIds
      : catalogs.length > 0
        ? [catalogs[0].id]
        : [],
  );
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState("quiz"); // 'quiz' or 'flashcards'

  // Unique questions available across selected catalogs (deduplicated by id/text)
  const totalAvailable = useMemo(() => {
    const seen = new Set();
    for (const cat of catalogs.filter((c) => selectedIds.includes(c.id))) {
      for (const q of cat.questions) {
        seen.add(String(q.id ?? q.question));
      }
    }
    return seen.size;
  }, [catalogs, selectedIds]);

  // Clamp displayed count to valid range
  const effectiveCount = Math.min(
    Math.max(1, count),
    Math.max(1, totalAvailable),
  );

  function toggle(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function catalogAccuracy(catalog) {
    let correct = 0;
    let total = 0;
    for (const q of catalog.questions) {
      const s = stats[String(q.id ?? q.question)];
      if (s) {
        correct += s.correct;
        total += s.correct + s.wrong;
      }
    }
    if (total === 0) return null;
    return Math.round((correct / total) * 100);
  }

  // Quick-select presets — only show values ≤ totalAvailable
  const presets = [5, 10, 20, 50].filter((n) => n < totalAvailable);
  if (totalAvailable > 0) presets.push(totalAvailable);

  const canStart = selectedIds.length > 0 && totalAvailable > 0;

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-2 pb-[env(safe-area-inset-bottom,24px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Quiz konfigurieren
        </h1>
      </div>

      {/* ── Catalog selection ──────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Kataloge
          </h2>
          <span className="text-xs text-slate-500">
            {selectedIds.length} ausgewählt · {totalAvailable} Fragen
          </span>
        </div>

        <motion.div
          className="flex flex-col gap-2"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.04 } },
          }}
        >
          {catalogs.map((catalog) => {
            const selected = selectedIds.includes(catalog.id);
            const pct = catalogAccuracy(catalog);
            return (
              <motion.button
                key={catalog.id}
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
                }}
                onClick={() => toggle(catalog.id)}
                className={`w-full text-left rounded-2xl px-4 py-3.5 border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  selected
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox dot */}
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected
                        ? "border-violet-500 bg-violet-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {selected && (
                      <span className="text-white text-[10px] leading-none">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm truncate transition-colors ${
                        selected
                          ? "text-violet-700 dark:text-violet-300"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {catalog.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {catalog.questions.length} Fragen
                    </p>
                  </div>

                  {pct !== null && (
                    <span
                      className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                        pct >= 70
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                          : pct >= 40
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                            : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {pct} %
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* ── Learning Mode ──────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Lernmodus
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("quiz")}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              mode === "quiz"
                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <LayoutGrid
              size={24}
              className={mode === "quiz" ? "text-violet-500" : "text-slate-400"}
            />
            <span className="font-semibold text-sm">Prüfungsmodus</span>
          </button>
          <button
            onClick={() => setMode("flashcards")}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              mode === "flashcards"
                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <BrainCircuit
              size={24}
              className={
                mode === "flashcards" ? "text-violet-500" : "text-slate-400"
              }
            />
            <span className="font-semibold text-sm">Karteikarten</span>
          </button>
        </div>
      </div>

      {/* ── Question count ─────────────────────────────────── */}
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-5 py-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Anzahl der Fragen
          </h2>
          <span className="text-xs text-slate-500">
            {totalAvailable} verfügbar
          </span>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-5 mb-5">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            disabled={effectiveCount <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Minus size={16} />
          </button>

          <span className="text-5xl font-extrabold text-violet-600 dark:text-violet-400 tabular-nums w-20 text-center leading-none">
            {effectiveCount}
          </span>

          <button
            type="button"
            onClick={() => setCount((c) => Math.min(totalAvailable, c + 1))}
            disabled={effectiveCount >= totalAvailable}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={1}
          max={Math.max(1, totalAvailable)}
          value={effectiveCount}
          onChange={(e) => setCount(Number(e.target.value))}
          disabled={totalAvailable === 0}
          className="w-full accent-violet-500 cursor-pointer disabled:opacity-40"
        />

        {/* Quick presets */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {presets.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                effectiveCount === n
                  ? "bg-violet-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {n === totalAvailable ? `Alle (${n})` : n}
            </button>
          ))}
        </div>
      </div>

      {/* ── Start button ───────────────────────────────────── */}
      <button
        onClick={() => canStart && onStart(selectedIds, effectiveCount, mode)}
        disabled={!canStart}
        className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-base shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-[0.98] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:shadow-none bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/40"
      >
        <Play
          size={18}
          fill="currentColor"
        />
        {effectiveCount} {effectiveCount === 1 ? "Frage" : "Fragen"} starten
      </button>
    </div>
  );
}
