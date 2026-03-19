import { motion } from "framer-motion";
import { isAnswerCorrect } from "../utils/questionHelpers";

/**
 * Results
 * Shows the final score, per-question historical stats, and a wrong-answer review.
 */
export default function Results({
  questions,
  answers,
  stats = {},
  onPlayNext,
  onPlaySameAgain,
  onGoHome,
}) {
  const total = questions.length;
  const score = answers.filter((ans, i) =>
    isAnswerCorrect(questions[i], ans),
  ).length;
  const pct = Math.round((score / total) * 100);
  const wrongItems = questions
    .map((q, i) => ({ q, chosen: answers[i] }))
    .filter(({ q, chosen }) => !isAnswerCorrect(q, chosen));

  const emoji =
    score === total ? "🏆" : pct >= 70 ? "👍" : pct >= 40 ? "📚" : "💪";

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-6 w-full max-w-md mx-auto px-4"
    >
      {/* Score card */}
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl px-8 py-10 flex flex-col items-center gap-4 shadow-xl shadow-slate-950/10 dark:shadow-slate-950/60 text-center">
        <span className="text-5xl">{emoji}</span>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Quiz beendet!
        </h2>

        {/* Percentage ring-like display */}
        <div className="flex flex-col items-center gap-1 w-full">
          <span className="text-4xl font-extrabold text-violet-600 dark:text-violet-400">
            {pct} %
          </span>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {score} von {total} Fragen richtig beantwortet
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-3 mt-1">
          <motion.div
            className={`h-3 rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </div>
      </div>

      {/* Wrong answers review */}
      {wrongItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">
            Falsch beantwortet ({wrongItems.length})
          </h3>
          <motion.ul
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {wrongItems.map(({ q, chosen }, idx) => {
              const id = String(q.id ?? q.question);
              const s = stats[id];
              const totalAttempts = s ? s.correct + s.wrong : 0;
              const histPct =
                totalAttempts > 0
                  ? Math.round((s.correct / totalAttempts) * 100)
                  : null;
              return (
                <motion.li
                  key={q.id ?? idx}
                  variants={item}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-snug">
                      {q.question}
                    </p>
                    {histPct !== null && (
                      <span
                        className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${histPct >= 70 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : histPct >= 40 ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"}`}
                      >
                        {histPct} % gesamt
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {/* Wrong chosen answer */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-2.5 w-2.5 text-red-600 dark:text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        <span className="font-semibold">Deine Antwort: </span>
                        {(() => {
                          const type = q.type ?? "multiple-choice";
                          if (
                            type === "text-input" ||
                            type === "fill-in-the-blank"
                          )
                            return String(chosen ?? "").trim() || "—";
                          if (type === "true-false")
                            return chosen === true
                              ? "Richtig"
                              : chosen === false
                                ? "Falsch"
                                : "—";
                          if (type === "matching")
                            return Array.isArray(chosen)
                              ? `${
                                  chosen.filter(
                                    (a, i) =>
                                      String(a ?? "")
                                        .trim()
                                        .toLowerCase() ===
                                      String(q.pairs[i]?.right ?? "")
                                        .trim()
                                        .toLowerCase(),
                                  ).length
                                } / ${q.pairs?.length ?? 0} richtig`
                              : "—";
                          return q.options?.[chosen] ?? "—";
                        })()}
                      </span>
                    </div>
                    {/* Correct answer */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-500 dark:border-emerald-600 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        <span className="font-semibold">Richtig: </span>
                        {(() => {
                          const type = q.type ?? "multiple-choice";
                          if (
                            type === "text-input" ||
                            type === "fill-in-the-blank"
                          )
                            return q.answer;
                          if (type === "true-false")
                            return q.answer ? "Richtig" : "Falsch";
                          if (type === "matching")
                            return (
                              q.pairs
                                ?.map((p) => `${p.left} → ${p.right}`)
                                .join(", ") ?? "—"
                            );
                          return q.options?.[q.correctAnswerIndex];
                        })()}
                      </span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
      )}

      {wrongItems.length === 0 && (
        <p className="text-center text-emerald-400 text-sm font-medium">
          Perfekt! Alle Fragen richtig beantwortet. 🎉
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onPlayNext}
          className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-base transition-all duration-150 shadow-lg shadow-violet-900/40 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Weiter →
        </button>
        <button
          onClick={onPlaySameAgain}
          className="w-full py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-300 font-medium text-sm transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Nochmal gleiches Quiz
        </button>
        <button
          onClick={onGoHome}
          className="w-full py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-300 font-medium text-sm transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Hauptmenü
        </button>
      </div>
    </motion.div>
  );
}
