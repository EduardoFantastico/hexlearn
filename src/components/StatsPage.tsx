import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Hash,
  CircleCheck,
  CircleAlert,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

function qStatus(qId, stats) {
  const s = stats[String(qId)];
  if (!s || s.lastSeen == null) return "unseen";
  const total = s.correct + s.wrong;
  if (total === 0) return "unseen";
  const pct = (s.correct / total) * 100;
  if (pct >= 70) return "good";
  if (pct >= 40) return "medium";
  return "bad";
}

function qAccuracyPct(qId, stats) {
  const s = stats[String(qId)];
  if (!s) return null;
  const total = s.correct + s.wrong;
  return total === 0 ? null : Math.round((s.correct / total) * 100);
}

const STATUS_CLASSES = {
  unseen:
    "bg-slate-200 dark:bg-slate-700 border border-dashed border-slate-400 dark:border-slate-500",
  good: "bg-emerald-400 dark:bg-emerald-500",
  medium: "bg-amber-400 dark:bg-amber-500",
  bad: "bg-red-500 dark:bg-red-600",
};

function isDue(qId, stats) {
  const s = stats[String(qId)];
  if (!s || s.lastSeen == null) return true;
  const daysSince = (Date.now() - s.lastSeen) / 86_400_000;
  return daysSince >= (s.interval ?? 1);
}

export default function StatsPage({ catalogs, stats, onBack }) {
  const [expanded, setExpanded] = useState(null);

  // ── Global aggregates ──────────────────────────────────────────────
  const allStatValues = Object.values(stats);
  const totalAnswered = allStatValues.reduce(
    (s, v) => s + v.correct + v.wrong,
    0,
  );
  const totalCorrect = allStatValues.reduce((s, v) => s + v.correct, 0);
  const overallPct =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  const totalQ = catalogs.reduce((s, c) => s + c.questions.length, 0);

  const seenIds = new Set();
  catalogs.forEach((c) =>
    c.questions.forEach((q) => {
      const id = String(q.id ?? q.question);
      if (stats[id]?.lastSeen != null) seenIds.add(id);
    }),
  );

  const masteredCount = allStatValues.filter((v) => {
    const t = v.correct + v.wrong;
    return t >= 3 && Math.round((v.correct / t) * 100) >= 70;
  }).length;

  const dueCount = catalogs.reduce((acc, c) => {
    c.questions.forEach((q) => {
      if (isDue(String(q.id ?? q.question), stats)) acc++;
    });
    return acc;
  }, 0);

  // ── Per-catalog helpers ────────────────────────────────────────────
  function catalogSummary(catalog) {
    let correct = 0,
      total = 0,
      seen = 0;
    for (const q of catalog.questions) {
      const s = stats[String(q.id ?? q.question)];
      if (s?.lastSeen != null) {
        correct += s.correct;
        total += s.correct + s.wrong;
        seen++;
      }
    }
    return {
      seen,
      total: catalog.questions.length,
      coveragePct:
        catalog.questions.length > 0
          ? Math.round((seen / catalog.questions.length) * 100)
          : 0,
      accPct: total > 0 ? Math.round((correct / total) * 100) : null,
    };
  }

  function hardestQuestions(catalog, limit = 6) {
    return catalog.questions
      .map((q) => {
        const id = String(q.id ?? q.question);
        const s = stats[id];
        if (!s || s.lastSeen == null) return null;
        const t = s.correct + s.wrong;
        if (t === 0) return null;
        return { q, errorRate: s.wrong / t, attempts: t };
      })
      .filter(Boolean)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  const accColor = (pct) =>
    pct === null
      ? "text-slate-400"
      : pct >= 70
        ? "text-emerald-600 dark:text-emerald-400"
        : pct >= 40
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-500 dark:text-red-400";

  const accBadge = (pct) =>
    pct === null
      ? ""
      : pct >= 70
        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
        : pct >= 40
          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
          : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400";

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Zurück
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
          Statistiken
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Lernfortschritt &amp; Spaced-Repetition-Übersicht
        </p>
      </div>

      {totalAnswered === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Noch keine Antworten aufgezeichnet. Starte ein Quiz!
        </div>
      ) : (
        <>
          {/* ── Global stats ───────────────────────────────────── */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              {
                Icon: Hash,
                label: "Beantwortet",
                value: totalAnswered,
                sub: "gesamt",
                color: "text-violet-600 dark:text-violet-400",
              },
              {
                Icon: Target,
                label: "Genauigkeit",
                value: overallPct !== null ? `${overallPct} %` : "–",
                sub: "aller Antworten",
                color: accColor(overallPct),
              },
              {
                Icon: Eye,
                label: "Abgedeckt",
                value: `${seenIds.size} / ${totalQ}`,
                sub: `${dueCount} fällig`,
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                Icon: CircleCheck,
                label: "Gemeistert",
                value: masteredCount,
                sub: "Fragen ≥ 70 %",
                color: "text-emerald-600 dark:text-emerald-400",
              },
            ].map(({ Icon, label, value, sub, color }) => (
              <motion.div
                key={label}
                variants={item}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <Icon
                    size={11}
                    className="text-slate-400"
                  />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {label}
                  </span>
                </div>
                <span
                  className={`text-xl font-extrabold leading-none ${color}`}
                >
                  {value}
                </span>
                <span className="text-[10px] text-slate-500">{sub}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Legend ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Legende:
            </span>
            {[
              { cls: "bg-emerald-400", label: "≥ 70 % richtig" },
              { cls: "bg-amber-400", label: "40 – 69 %" },
              { cls: "bg-red-500", label: "< 40 %" },
              {
                cls: "bg-slate-200 dark:bg-slate-700 border border-dashed border-slate-400",
                label: "Noch nie gesehen",
              },
            ].map(({ cls, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5"
              >
                <span className={`w-3 h-3 rounded-xs inline-block ${cls}`} />
                {label}
              </span>
            ))}
          </div>

          {/* ── Per-catalog ─────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {catalogs.map((catalog) => {
              const { seen, total, coveragePct, accPct } =
                catalogSummary(catalog);
              const hard = hardestQuestions(catalog);
              const isOpen = expanded === catalog.id;

              return (
                <motion.div
                  key={catalog.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden"
                >
                  {/* Catalog header row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : catalog.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-200/50 dark:hover:bg-slate-700/40 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500"
                  >
                    <BookOpen
                      size={14}
                      className="text-violet-500 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                        {catalog.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {total} Fragen ·{" "}
                        {seen === 0
                          ? "Noch nicht geübt"
                          : `${seen} versucht (${coveragePct} %)`}
                      </p>
                    </div>
                    {accPct !== null && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${accBadge(accPct)}`}
                      >
                        {accPct} %
                      </span>
                    )}
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Heatmap + details (always visible for heatmap, details only when open) */}
                  <div className="px-5 pb-5">
                    {/* Heatmap grid */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {catalog.questions.map((q) => {
                        const id = String(q.id ?? q.question);
                        const status = qStatus(id, stats);
                        const pct = qAccuracyPct(id, stats);
                        const s = stats[id];
                        const due = isDue(id, stats);
                        return (
                          <div
                            key={id}
                            className={`relative w-6 h-6 rounded-md transition-transform hover:scale-125 cursor-default ${STATUS_CLASSES[status]}`}
                            title={`${q.question.slice(0, 70)}${q.question.length > 70 ? "…" : ""}\n${
                              pct !== null
                                ? `${pct} % richtig · ${s.correct + s.wrong}× beantwortet${due ? " · Fällig" : ""}`
                                : "Noch nie gesehen"
                            }`}
                          >
                            {/* tiny dot indicator if overdue */}
                            {status !== "unseen" && due && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-950 border border-slate-400 dark:border-slate-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats summary bar */}
                    <div className="flex gap-3 text-[10px] text-slate-500 mb-3 flex-wrap">
                      {[
                        {
                          Icon: EyeOff,
                          label: `${total - seen} ungesehen`,
                          show: total - seen > 0,
                        },
                        {
                          Icon: CircleCheck,
                          label: `${catalog.questions.filter((q) => qStatus(String(q.id ?? q.question), stats) === "good").length} gemeistert`,
                          show: true,
                        },
                        {
                          Icon: CircleAlert,
                          label: `${catalog.questions.filter((q) => qStatus(String(q.id ?? q.question), stats) === "bad").length} schwierig`,
                          show: true,
                        },
                      ]
                        .filter((x) => x.show)
                        .map(({ Icon, label }) => (
                          <span
                            key={label}
                            className="flex items-center gap-1"
                          >
                            <Icon size={10} />
                            {label}
                          </span>
                        ))}
                    </div>

                    {/* Hardest questions — expandable */}
                    {isOpen && hard.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-700"
                      >
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-1">
                          <CircleAlert size={10} />
                          Schwierigste Fragen
                        </p>
                        {hard.map(({ q, errorRate, attempts }) => (
                          <div
                            key={String(q.id ?? q.question)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 flex items-center gap-3"
                          >
                            <span
                              className={`text-xs font-bold w-10 text-right shrink-0 ${
                                errorRate >= 0.6
                                  ? "text-red-500 dark:text-red-400"
                                  : "text-amber-500 dark:text-amber-400"
                              }`}
                            >
                              {Math.round(errorRate * 100)} %
                            </span>
                            <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 line-clamp-2 leading-snug">
                              {q.question}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {attempts}×
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {isOpen && hard.length === 0 && seen === 0 && (
                      <p className="text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                        Noch keine Daten für diesen Katalog.
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
