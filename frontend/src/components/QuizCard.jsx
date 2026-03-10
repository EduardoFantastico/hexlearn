import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * QuizCard
 * Displays a single question with immediate correct/wrong feedback.
 * A "Next" button appears after an answer is selected.
 */
export default function QuizCard({ question, index, total, onNext, onFinish }) {
  const [selected, setSelected] = useState(null); // index of chosen option, null = unanswered
  const isLast = index === total - 1;
  const correct = question.correctAnswerIndex;

  function handleOption(i) {
    if (selected !== null) return; // lock after first pick
    setSelected(i);
  }

  function handleAdvance() {
    if (selected === null) return;
    const choice = selected;
    setSelected(null); // reset for next card (AnimatePresence swaps the node)
    if (isLast) {
      onFinish(choice);
    } else {
      onNext(choice);
    }
  }

  function optionStyle(i) {
    if (selected === null) {
      return "border-slate-700 bg-slate-800 text-slate-300 hover:border-violet-500 hover:bg-violet-900/20 hover:text-slate-100 cursor-pointer active:scale-95";
    }
    if (i === correct) {
      return "border-emerald-500 bg-emerald-900/30 text-emerald-300 cursor-default";
    }
    if (i === selected) {
      return "border-red-500 bg-red-900/30 text-red-300 cursor-default";
    }
    return "border-slate-700 bg-slate-800/50 text-slate-500 cursor-default";
  }

  function optionBadgeStyle(i) {
    if (selected === null) return "border-slate-600 text-slate-400";
    if (i === correct)
      return "border-emerald-500 text-emerald-400 bg-emerald-900/40";
    if (i === selected) return "border-red-500 text-red-400 bg-red-900/40";
    return "border-slate-700 text-slate-600";
  }

  const progressPct = ((index + 1) / total) * 100;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto px-4">
      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>
            Frage {index + 1} von {total}
          </span>
          <span>{Math.round(progressPct)} %</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <motion.div
            className="bg-violet-500 h-2 rounded-full"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id ?? index}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="bg-slate-800 border border-slate-700 rounded-3xl px-6 py-7 shadow-xl shadow-slate-950/60"
        >
          <p className="text-lg font-semibold text-slate-100 leading-snug">
            {question.question}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Answer options */}
      <ul className="flex flex-col gap-3">
        {question.options.map((option, i) => (
          <li key={i}>
            <button
              onClick={() => handleOption(i)}
              disabled={selected !== null && i !== correct && i !== selected}
              className={`w-full text-left flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${optionStyle(i)}`}
            >
              <span
                className={`w-7 h-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors duration-200 ${optionBadgeStyle(i)}`}
              >
                {selected !== null && i === correct ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : selected !== null && i === selected && i !== correct ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              {option}
            </button>
          </li>
        ))}
      </ul>

      {/* Next / Finish button — appears after selection */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={handleAdvance}
              className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-base transition-all duration-150 shadow-lg shadow-violet-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {isLast ? "Ergebnis anzeigen" : "Nächste Frage →"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
