import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isAnswerCorrect } from "../utils/questionHelpers";

const TYPE_BADGE = {
  "text-input": [
    "Freie Eingabe",
    "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30",
  ],
  "fill-in-the-blank": [
    "Lückentext",
    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
  ],
  "true-false": [
    "Richtig / Falsch",
    "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30",
  ],
  matching: [
    "Zuordnung",
    "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30",
  ],
};

const CheckIcon = () => (
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
);

const XIcon = () => (
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
);

/**
 * QuizCard
 * Supports: "multiple-choice", "text-input", "fill-in-the-blank", "true-false", "matching"
 */
export default function QuizCard({ question, index, total, onNext, onFinish }) {
  // MC + true-false: selected holds number (MC) or boolean (true-false)
  const [selected, setSelected] = useState(null);
  // text-input + fill-in-the-blank
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  // matching
  const [matchingSelections, setMatchingSelections] = useState(() =>
    (question.pairs ?? []).map(() => ""),
  );
  const [shuffledRights] = useState(() =>
    [...(question.pairs ?? []).map((p) => p.right)].sort(
      () => Math.random() - 0.5,
    ),
  );

  const isLast = index === total - 1;
  const questionType = question.type ?? "multiple-choice";
  const isMC = questionType === "multiple-choice";
  const isTrueFalse = questionType === "true-false";
  const isTextLike =
    questionType === "text-input" || questionType === "fill-in-the-blank";
  const isMatching = questionType === "matching";

  const correct = question.correctAnswerIndex;
  const textCorrect =
    isTextLike && submitted ? isAnswerCorrect(question, inputValue) : null;
  const allMatchingFilled = matchingSelections.every((s) => s !== "");
  const matchingResultsPerPair =
    isMatching && submitted
      ? matchingSelections.map(
          (sel, i) =>
            String(sel ?? "")
              .trim()
              .toLowerCase() ===
            String(question.pairs[i]?.right ?? "")
              .trim()
              .toLowerCase(),
        )
      : null;

  // ── Advance ──────────────────────────────────────────────────────────
  function handleAdvance() {
    let choice;
    if (isMC || isTrueFalse) {
      if (selected === null) return;
      choice = selected;
      setSelected(null);
    } else if (isTextLike) {
      if (!submitted) return;
      choice = inputValue.trim();
      setInputValue("");
      setSubmitted(false);
    } else if (isMatching) {
      if (!submitted) return;
      choice = [...matchingSelections];
      setMatchingSelections((question.pairs ?? []).map(() => ""));
      setSubmitted(false);
    }
    if (isLast) onFinish(choice);
    else onNext(choice);
  }

  // ── MC helpers ────────────────────────────────────────────────────────
  function handleOption(i) {
    if (selected !== null) return;
    setSelected(i);
  }

  function optionStyle(i) {
    if (selected === null)
      return "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer active:scale-95";
    if (i === correct)
      return "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 cursor-default";
    if (i === selected)
      return "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 cursor-default";
    return "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-default";
  }

  function optionBadgeStyle(i) {
    if (selected === null)
      return "border-slate-400 dark:border-slate-600 text-slate-500 dark:text-slate-400";
    if (i === correct)
      return "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40";
    if (i === selected)
      return "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40";
    return "border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600";
  }

  const progressPct = ((index + 1) / total) * 100;
  const badge = TYPE_BADGE[questionType];

  const continueBtn = (
    <button
      onClick={handleAdvance}
      className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-base transition-all duration-150 shadow-lg shadow-violet-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      {isLast ? "Ergebnis anzeigen" : "Nächste Frage →"}
    </button>
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto px-4">
      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>
            Frage {index + 1} von {total}
          </span>
          <span>{Math.round(progressPct)} %</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
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
          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl px-6 py-7 shadow-xl shadow-slate-950/10 dark:shadow-slate-950/60"
        >
          {badge && (
            <span
              className={`inline-block mb-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge[1]}`}
            >
              {badge[0]}
            </span>
          )}
          {/* Fill-in-the-blank: highlight ___ in question text */}
          {questionType === "fill-in-the-blank" ? (
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {question.question.split("___").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block border-b-2 border-blue-500 dark:border-blue-400 mx-1 min-w-[3rem]">
                      &nbsp;
                    </span>
                  )}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {question.question}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── MULTIPLE CHOICE ────────────────────────────────────── */}
      {isMC && (
        <>
          <ul className="flex flex-col gap-3">
            {question.options.map((option, i) => (
              <li key={i}>
                <button
                  onClick={() => handleOption(i)}
                  disabled={
                    selected !== null && i !== correct && i !== selected
                  }
                  className={`w-full text-left flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${optionStyle(i)}`}
                >
                  <span
                    className={`w-7 h-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors duration-200 ${optionBadgeStyle(i)}`}
                  >
                    {selected !== null && i === correct ? (
                      <CheckIcon />
                    ) : selected !== null && i === selected && i !== correct ? (
                      <XIcon />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  {option}
                </button>
              </li>
            ))}
          </ul>
          <AnimatePresence>
            {selected !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                {continueBtn}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── TRUE / FALSE ───────────────────────────────────────── */}
      {isTrueFalse && (
        <>
          <div className="flex gap-3">
            {[true, false].map((val) => {
              const label = val ? "Richtig ✓" : "Falsch ✗";
              const isSelected = selected === val;
              const isTheCorrect = val === question.answer;
              let cls =
                "flex-1 py-5 rounded-2xl border-2 font-bold text-base transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ";
              if (selected === null) {
                cls +=
                  "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 cursor-pointer active:scale-95";
              } else if (isTheCorrect) {
                cls +=
                  "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 cursor-default";
                if (isSelected) cls += " ring-2 ring-emerald-400 ring-offset-1";
              } else if (isSelected) {
                cls +=
                  "border-red-500 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 cursor-default ring-2 ring-red-400 ring-offset-1";
              } else {
                cls +=
                  "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-default opacity-50";
              }
              return (
                <button
                  key={String(val)}
                  onClick={() => selected === null && setSelected(val)}
                  disabled={selected !== null}
                  className={cls}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {selected !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                {continueBtn}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── TEXT INPUT / FILL-IN-THE-BLANK ─────────────────────── */}
      {isTextLike && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => !submitted && setInputValue(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              !submitted &&
              inputValue.trim() &&
              setSubmitted(true)
            }
            disabled={submitted}
            placeholder="Antwort eingeben…"
            autoFocus
            className={`w-full rounded-2xl border-2 px-5 py-4 text-sm font-medium focus:outline-none transition-all duration-200 ${
              submitted
                ? textCorrect
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                  : "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-violet-500"
            }`}
          />
          <AnimatePresence>
            {submitted && !textCorrect && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-5 py-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 flex-shrink-0 text-emerald-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-emerald-700 dark:text-emerald-300">
                  <span className="font-semibold">Richtig wäre: </span>
                  {question.answer}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.button
                key="submit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                onClick={() => inputValue.trim() && setSubmitted(true)}
                disabled={!inputValue.trim()}
                className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold text-base transition-all duration-150 shadow-lg shadow-violet-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:shadow-none"
              >
                Antwort prüfen
              </motion.button>
            ) : (
              <motion.button
                key="next"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                onClick={handleAdvance}
                className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-base transition-all duration-150 shadow-lg shadow-violet-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {isLast ? "Ergebnis anzeigen" : "Nächste Frage →"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── MATCHING ───────────────────────────────────────────── */}
      {isMatching && (
        <div className="flex flex-col gap-3">
          {question.pairs.map((pair, i) => {
            const sel = matchingSelections[i];
            const res = matchingResultsPerPair?.[i];
            return (
              <div
                key={i}
                className="flex items-center gap-2"
              >
                {/* Left label */}
                <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 truncate">
                  {pair.left}
                </span>
                <span className="text-slate-400 flex-shrink-0 text-sm">→</span>
                {/* Right selector */}
                <div className="flex-1 min-w-0 relative">
                  <select
                    disabled={submitted}
                    value={sel}
                    onChange={(e) => {
                      const next = [...matchingSelections];
                      next[i] = e.target.value;
                      setMatchingSelections(next);
                    }}
                    className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm font-medium focus:outline-none transition-all duration-200 appearance-none ${
                      !submitted
                        ? sel
                          ? "border-violet-400 dark:border-violet-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500"
                        : res
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                          : "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    }`}
                  >
                    <option value="">Wählen…</option>
                    {shuffledRights.map((r, ri) => (
                      <option
                        key={ri}
                        value={r}
                      >
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Result icon */}
                {submitted && (
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      res
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {res ? <CheckIcon /> : <XIcon />}
                  </span>
                )}
              </div>
            );
          })}

          {/* Show correct pairs when there were mistakes */}
          <AnimatePresence>
            {submitted && matchingResultsPerPair?.some((r) => !r) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3 flex flex-col gap-1"
              >
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  Richtige Zuordnung:
                </p>
                {question.pairs.map((pair, i) =>
                  matchingResultsPerPair[i] ? null : (
                    <p
                      key={i}
                      className="text-xs text-emerald-700 dark:text-emerald-300"
                    >
                      <span className="font-semibold">{pair.left}</span> →{" "}
                      {pair.right}
                    </p>
                  ),
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.button
                key="check"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                onClick={() => allMatchingFilled && setSubmitted(true)}
                disabled={!allMatchingFilled}
                className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold text-base transition-all duration-150 shadow-lg shadow-violet-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:shadow-none"
              >
                Zuordnung prüfen
              </motion.button>
            ) : (
              <motion.button
                key="next"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                onClick={handleAdvance}
                className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-base transition-all duration-150 shadow-lg shadow-violet-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {isLast ? "Ergebnis anzeigen" : "Nächste Frage →"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
