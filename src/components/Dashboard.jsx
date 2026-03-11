import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Plus,
  ChevronRight,
  BarChart2,
  Sparkles,
  ShieldCheck,
  Target,
  Hash,
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
 *   onOpenConfig   – (catalogIds: string[]) => void
 *   onCatalogAdded  – (catalog: { name, questions }) => void
 *   onManageCatalogs – () => void
 */
export default function Dashboard({
  catalogs,
  stats,
  streak,
  todayCount,
  weeklyData,
  onOpenConfig,
  onCatalogAdded,
  onManageCatalogs,
}) {
  const fileUploaderRef = useRef(null);

  // Compute per-catalog accuracy from stats
  function catalogAccuracy(catalog) {
    let correct = 0;
    let attempts = 0;
    let attempted = 0;
    const totalQuestions = catalog.questions.length;
    for (const q of catalog.questions) {
      const s = stats[String(q.id ?? q.question)];
      if (s) {
        correct += s.correct;
        attempts += s.correct + s.wrong;
        attempted++;
      }
    }
    if (attempts === 0) return null;
    return {
      accuracyPct: Math.round((correct / attempts) * 100), // correct / all answer events
      coveragePct: Math.round((attempted / totalQuestions) * 100), // unique q tried / total q
      attempted,
      totalQuestions,
      total: attempts,
    };
  }

  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);
  const DAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  // Aggregate stats
  const allStatValues = Object.values(stats);
  const totalAnswered = allStatValues.reduce(
    (s, v) => s + v.correct + v.wrong,
    0,
  );
  const totalCorrect = allStatValues.reduce((s, v) => s + v.correct, 0);
  const overallPct =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
  const totalQuestionsAcrossAll = catalogs.reduce(
    (s, c) => s + c.questions.length,
    0,
  );
  const uniqueAttempted = catalogs.reduce((s, c) => {
    for (const q of c.questions) {
      if (stats[String(q.id ?? q.question)]) s++;
    }
    return s;
  }, 0);
  const masteredCount = allStatValues.filter((v) => {
    const t = v.correct + v.wrong;
    return t >= 3 && Math.round((v.correct / t) * 100) >= 70;
  }).length;

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

  // ── Landing page (first visit, no catalogs yet) ─────────────────────
  if (catalogs.length === 0) {
    return (
      <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4 pt-10 pb-[env(safe-area-inset-bottom,24px)]">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-8"
        >
          {/* Hexagon logo */}
          <div className="w-20 h-20 mx-auto mb-5">
            <svg
              viewBox="0 0 100 115"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                points="50,5 96,30 96,85 50,110 4,85 4,30"
                className="fill-violet-100 dark:fill-violet-950"
                stroke="rgb(109,40,217)"
                strokeWidth="3"
              />
              <text
                x="50"
                y="72"
                textAnchor="middle"
                className="fill-violet-700 dark:fill-violet-400"
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Hx
              </text>
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
            HexLearn
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mt-3 leading-relaxed">
            Lerne smarter&nbsp;–{" "}
            <span className="text-violet-600 dark:text-violet-400 font-semibold">
              mit deinen eigenen Fragen.
            </span>
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {[
            { Icon: Sparkles, label: "Spaced Repetition" },
            { Icon: ShieldCheck, label: "Lokal · Kein Login" },
            { Icon: BarChart2, label: "Lernstatistiken" },
          ].map(({ Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 font-medium"
            >
              <Icon size={12} />
              {label}
            </span>
          ))}
        </motion.div>

        {/* Upload call-to-action */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="w-full"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-4">
            Katalog hochladen um zu starten
          </p>

          <FileUploader onCatalogAdded={onCatalogAdded} />

          {/* JSON format hint */}
          <details className="mt-5 group">
            <summary className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer transition-colors select-none list-none">
              <ChevronRight
                size={12}
                className="transition-transform duration-200 group-open:rotate-90"
              />
              JSON-Format anzeigen
            </summary>
            <div className="mt-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                Deine Datei muss ein Array von Fragen enthalten:
              </p>
              <pre className="text-[11px] text-violet-600 dark:text-violet-300 font-mono leading-relaxed overflow-x-auto">{`[
  {
    "id": 1,
    "type": "multiple-choice",
    "question": "Was ist React?",
    "options": ["Ein Framework","Eine UI-Library","Ein Browser"],
    "correctAnswerIndex": 1
  },
  {
    "id": 2,
    "type": "text-input",
    "question": "Was ist 6 × 7?",
    "answer": "42",
    "acceptedAnswers": ["zweiundvierzig"]
  },
  {
    "id": 3,
    "type": "fill-in-the-blank",
    "question": "Die Hauptstadt von Deutschland ist ___.",
    "answer": "Berlin"
  },
  {
    "id": 4,
    "type": "true-false",
    "question": "Die Erde ist rund.",
    "answer": true
  },
  {
    "id": 5,
    "type": "matching",
    "question": "Ordne die Hauptstädte zu:",
    "pairs": [
      { "left": "Deutschland", "right": "Berlin" },
      { "left": "Frankreich", "right": "Paris" }
    ]
  }
]`}</pre>
            </div>
          </details>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard (returning user with catalogs) ────────────────────────
  return (
    <div className="flex flex-col min-h-0 w-full max-w-2xl mx-auto px-4 pb-[env(safe-area-inset-bottom,24px)] pt-2">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
          Hallo! 👋
          <br />
          <span className="text-violet-600 dark:text-violet-400">
            Bereit zum Lernen?
          </span>
        </h1>

        {/* Streak + today badge row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              streak > 0
                ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-700/50"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Flame size={13} />
            {streak > 0 ? `${streak} Tage Streak` : "Noch kein Streak"}
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              todayCount > 0
                ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <CheckCircle2 size={13} />
            {todayCount > 0
              ? `${todayCount} Fragen heute`
              : "Heute noch nichts gelernt"}
          </div>
        </div>
      </motion.div>

      {/* Aggregate stats row */}
      {totalAnswered > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            {
              Icon: Hash,
              label: "Beantwortet",
              value: totalAnswered,
              sub: "insgesamt",
              color: "text-violet-600 dark:text-violet-400",
            },
            {
              Icon: Target,
              label: "Genauigkeit",
              value: overallPct !== null ? `${overallPct} %` : "–",
              sub:
                overallPct !== null
                  ? `${uniqueAttempted} / ${totalQuestionsAcrossAll} Fragen versucht`
                  : "keine Daten",
              color:
                overallPct === null
                  ? "text-slate-500"
                  : overallPct >= 70
                    ? "text-emerald-600 dark:text-emerald-400"
                    : overallPct >= 40
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400",
            },
            {
              Icon: CheckCircle2,
              label: "Gemeistert",
              value: masteredCount,
              sub: "Fragen ≥ 70 %",
              color: "text-emerald-600 dark:text-emerald-400",
            },
          ].map(({ Icon, label, value, sub, color }) => (
            <div
              key={label}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-3.5 flex flex-col gap-1"
            >
              <div className="flex items-center gap-1.5">
                <Icon
                  size={12}
                  className="text-slate-400"
                />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {label}
                </span>
              </div>
              <span className={`text-xl font-extrabold leading-none ${color}`}>
                {value}
              </span>
              <span className="text-[10px] text-slate-500">{sub}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Weekly activity mini-chart */}
      {weeklyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2
              size={14}
              className="text-violet-500 dark:text-violet-400"
            />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Diese Woche
            </span>
            <span className="ml-auto text-xs font-semibold text-slate-700 dark:text-slate-300">
              {weeklyData.reduce((s, d) => s + d.count, 0)}
              <span className="font-normal text-slate-500"> Fragen</span>
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {last7.map((day) => {
              const isToday = day.date === today.toISOString().slice(0, 10);
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  {day.count > 0 && (
                    <span
                      className={`text-[9px] font-bold ${isToday ? "text-violet-500 dark:text-violet-400" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {day.count}
                    </span>
                  )}
                  <motion.div
                    className={`w-full rounded-sm ${
                      day.count > 0
                        ? isToday
                          ? "bg-violet-500"
                          : "bg-violet-400 dark:bg-violet-600"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                    style={{
                      height: `${Math.max(
                        (day.count / maxCount) * 56,
                        day.count > 0 ? 6 : 3,
                      )}px`,
                    }}
                    initial={{ scaleY: 0, originY: 1 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.05 * last7.indexOf(day),
                    }}
                  />
                  <span
                    className={`text-[9px] font-medium ${
                      isToday
                        ? "text-violet-500 dark:text-violet-400 font-bold"
                        : "text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Streak + today summary inside chart card */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex-wrap">
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                streak > 0
                  ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400"
                  : "text-slate-500"
              }`}
            >
              <Flame size={11} />
              {streak > 0 ? `${streak} Tage Streak` : "Noch kein Streak"}
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                todayCount > 0
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400"
                  : "text-slate-500"
              }`}
            >
              <CheckCircle2 size={11} />
              {todayCount > 0 ? `${todayCount} heute` : "Heute noch nichts"}
            </div>
          </div>
        </motion.div>
      )}

      {/* Catalog section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen size={14} />
          Meine Kataloge
        </h2>
        <button
          onClick={onManageCatalogs}
          className="text-xs text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 font-medium transition-colors flex items-center gap-0.5"
        >
          Verwalten
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Catalog grid */}
      <motion.ul
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
      >
        {catalogs.map((catalog) => {
          const acc = catalogAccuracy(catalog);
          const accuracyPct = acc?.accuracyPct ?? null;
          const coveragePct = acc?.coveragePct ?? null;
          const barColor =
            accuracyPct === null
              ? "bg-slate-300 dark:bg-slate-700"
              : accuracyPct >= 70
                ? "bg-emerald-500"
                : accuracyPct >= 40
                  ? "bg-amber-400"
                  : "bg-red-500";

          return (
            <motion.li
              key={catalog.id}
              variants={cardVariant}
            >
              <button
                onClick={() => onOpenConfig([catalog.id])}
                className="w-full text-left bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] rounded-2xl px-5 py-4 flex flex-col gap-3 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                      {catalog.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {catalog.questions.length} Fragen
                    </span>
                  </div>
                  {accuracyPct !== null && (
                    <span
                      className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                        accuracyPct >= 70
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                          : accuracyPct >= 40
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                            : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {accuracyPct} %
                    </span>
                  )}
                </div>

                {/* Progress bar — width = coverage (attempted/total), colour = accuracy */}
                <div className="flex flex-col gap-1">
                  <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-1.5">
                    <motion.div
                      className={`h-1.5 rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{
                        width: coveragePct !== null ? `${coveragePct}%` : "0%",
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {acc === null
                      ? "Noch nicht geübt"
                      : acc.coveragePct < 100
                        ? `${acc.attempted} / ${acc.totalQuestions} Fragen versucht`
                        : accuracyPct >= 70
                          ? "Alle geübt · Stark"
                          : accuracyPct >= 40
                            ? "Alle geübt · Im Aufbau"
                            : "Alle geübt · Mehr üben!"}
                  </span>
                </div>

                {/* Trend info */}
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

      {/* Add new catalog */}
      <motion.div
        ref={fileUploaderRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-2"
      >
        <details className="group">
          <summary className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-3 text-sm text-slate-500 hover:border-violet-500 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <Plus size={16} />
            Neuen Katalog hinzufügen
          </summary>
          <div className="mt-3">
            <FileUploader onCatalogAdded={onCatalogAdded} />
          </div>
        </details>
      </motion.div>
    </div>
  );
}
