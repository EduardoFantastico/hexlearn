import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Plus,
  ChevronRight,
  Upload,
  BarChart2,
} from "lucide-react";
import FileUploader from "./FileUploader";

/**
 * Dashboard
 *
 * Props:
 *   catalogs        – persisted catalog list from useCatalogs
 *   stats           – question stats map from useQuestionStats
 *   streak          – number (active streak days)
 *   todayCount      – questions answered today
 *   weeklyData      – [{ date, count }] last 7 days
 *   onStartQuiz     – (catalogIds: string[]) => void
 *   onCatalogAdded  – (catalog: { name, questions }) => void
 *   onOpenSettings  – () => void
 */
export default function Dashboard({
  catalogs,
  stats,
  streak,
  todayCount,
  weeklyData,
  onStartQuiz,
  onCatalogAdded,
  onOpenSettings,
}) {
  const fileUploaderRef = useRef(null);

  // Most recently used catalog
  const lastCatalog = catalogs[0] ?? null;

  // Compute per-catalog accuracy from stats
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
    return { pct: Math.round((correct / total) * 100), total };
  }

  // Weekly bar chart — normalise to max
  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);
  const DAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  // Fill last 7 days (including days with 0 activity)
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const found = weeklyData.find((w) => w.date === iso);
    return {
      date: iso,
      count: found?.count ?? 0,
      label: DAY_LABELS[d.getDay()],
    };
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const cardVariant = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <div className="flex flex-col min-h-0 w-full max-w-2xl mx-auto px-4 pb-[env(safe-area-inset-bottom,24px)] pt-2">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-snug">
          Hallo! 👋
          <br />
          <span className="text-violet-400">Bereit zum Lernen?</span>
        </h1>

        {/* Streak + today badge row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${streak > 0 ? "bg-orange-900/40 text-orange-400 border border-orange-700/50" : "bg-slate-800 text-slate-500 border border-slate-700"}`}
          >
            <Flame size={13} />
            {streak > 0 ? `${streak} Tage Streak` : "Noch kein Streak"}
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${todayCount > 0 ? "bg-violet-900/40 text-violet-300 border border-violet-700/50" : "bg-slate-800 text-slate-500 border border-slate-700"}`}
          >
            <CheckCircle2 size={13} />
            {todayCount > 0
              ? `${todayCount} Fragen heute`
              : "Heute noch nichts gelernt"}
          </div>
        </div>

        {/* Quick-start button — most recently used catalog */}
        {lastCatalog && (
          <button
            onClick={() => onStartQuiz([lastCatalog.id])}
            className="mt-4 w-full flex items-center justify-between bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white rounded-2xl px-5 py-4 shadow-lg shadow-violet-900/40 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-xs text-violet-200 font-medium">
                Schnellstart
              </span>
              <span className="font-bold text-base truncate max-w-[200px]">
                {lastCatalog.name}
              </span>
            </div>
            <ChevronRight
              size={20}
              className="flex-shrink-0 opacity-80"
            />
          </button>
        )}
      </motion.div>

      {/* ── Weekly activity mini-chart ───────────────────────── */}
      {weeklyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart2
              size={14}
              className="text-violet-400"
            />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Diese Woche
            </span>
            <span className="ml-auto text-xs text-slate-500">
              {weeklyData.reduce((s, d) => s + d.count, 0)} Fragen gesamt
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-12">
            {last7.map((day) => (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <motion.div
                  className={`w-full rounded-t-sm ${day.count > 0 ? "bg-violet-500" : "bg-slate-700"}`}
                  style={{
                    height: `${Math.max((day.count / maxCount) * 40, day.count > 0 ? 4 : 2)}px`,
                  }}
                  initial={{ scaleY: 0, originY: 1 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.05 * last7.indexOf(day),
                  }}
                />
                <span
                  className={`text-[9px] font-medium ${day.date === today.toISOString().slice(0, 10) ? "text-violet-400" : "text-slate-600"}`}
                >
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Catalog cards ────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen size={14} />
          Meine Kataloge
        </h2>
        {catalogs.length > 0 && (
          <span className="text-xs text-slate-600">
            {catalogs.length} gespeichert
          </span>
        )}
      </div>

      {/* Empty state */}
      {catalogs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-3xl px-6 py-12 flex flex-col items-center gap-4 text-center mb-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-violet-900/30 border border-violet-800/50 flex items-center justify-center">
            <Upload
              size={24}
              className="text-violet-400"
            />
          </div>
          <div>
            <p className="font-bold text-slate-200 text-base">
              Noch kein Katalog
            </p>
            <p className="text-slate-500 text-sm mt-1 max-w-xs">
              Lade deine erste JSON-Datei hoch, um sofort ein Quiz zu starten.
            </p>
          </div>
          <p className="text-xs text-slate-600 font-mono bg-slate-900 rounded-xl px-3 py-2 border border-slate-700">
            {`[{ id, question, options[], correctAnswerIndex }]`}
          </p>
        </motion.div>
      )}

      {/* Catalog grid */}
      {catalogs.length > 0 && (
        <motion.ul
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
        >
          {catalogs.map((catalog) => {
            const acc = catalogAccuracy(catalog);
            const pct = acc?.pct ?? null;
            const barColor =
              pct === null
                ? "bg-slate-700"
                : pct >= 70
                  ? "bg-emerald-500"
                  : pct >= 40
                    ? "bg-amber-400"
                    : "bg-red-500";

            return (
              <motion.li
                key={catalog.id}
                variants={cardVariant}
              >
                <button
                  onClick={() => onStartQuiz([catalog.id])}
                  className="w-full text-left bg-slate-800 border border-slate-700 hover:border-violet-600 hover:bg-slate-800/80 active:scale-[0.98] rounded-2xl px-5 py-4 flex flex-col gap-3 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold text-slate-100 text-sm truncate group-hover:text-violet-300 transition-colors">
                        {catalog.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {catalog.questions.length} Fragen
                      </span>
                    </div>
                    {pct !== null && (
                      <span
                        className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${pct >= 70 ? "bg-emerald-900/40 text-emerald-400" : pct >= 40 ? "bg-amber-900/40 text-amber-400" : "bg-red-900/40 text-red-400"}`}
                      >
                        {pct} %
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="flex flex-col gap-1">
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <motion.div
                        className={`h-1.5 rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: pct !== null ? `${pct}%` : "0%" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-600">
                      {pct === null
                        ? "Noch nicht geübt"
                        : pct >= 70
                          ? "Gut gemeistert"
                          : pct >= 40
                            ? "Im Aufbau"
                            : "Braucht Übung"}
                    </span>
                  </div>

                  {/* Trend icon */}
                  {acc && acc.total >= 5 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <TrendingUp size={10} />
                      {acc.total} Antworten gesamt
                    </div>
                  )}
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      {/* Add catalog card / FileUploader */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-2"
      >
        {catalogs.length === 0 ? (
          <FileUploader onCatalogAdded={onCatalogAdded} />
        ) : (
          <details
            className="group"
            ref={fileUploaderRef}
          >
            <summary className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-violet-600 hover:text-violet-400 transition-colors cursor-pointer list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              <Plus size={16} />
              Neuen Katalog hinzufügen
            </summary>
            <div className="mt-3">
              <FileUploader onCatalogAdded={onCatalogAdded} />
            </div>
          </details>
        )}
      </motion.div>
    </div>
  );
}
