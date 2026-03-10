import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FileUploader from "./components/FileUploader";
import CatalogSelector from "./components/CatalogSelector";
import QuizCard from "./components/QuizCard";
import Results from "./components/Results";
import { useQuestionStats } from "./hooks/useQuestionStats";

/**
 * App modes:
 *   'upload'   – no catalogs yet, show upload screen
 *   'select'   – catalogs available, choose which to use
 *   'quiz'     – actively answering questions
 *   'result'   – quiz finished, show summary
 */

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Weighted shuffle: questions with a higher error rate are more likely
 * to appear early. Weight = 1 + errorRate * 4  (range [1, 5]).
 * Uses a standard weighted-random sort via Math.random() ^ (1/weight).
 */
function smartShuffle(questions, errorRateFn) {
  return [...questions]
    .map((q) => {
      const id = String(q.id ?? q.question);
      const w = 1 + errorRateFn(id) * 4;
      return { q, sort: Math.random() ** (1 / w) };
    })
    .sort((a, b) => b.sort - a.sort)
    .map(({ q }) => q);
}

export default function App() {
  const [mode, setMode] = useState("upload"); // 'upload' | 'select' | 'quiz' | 'result'
  const [catalogs, setCatalogs] = useState([]); // [{ name, questions }]
  const [selectedIds, setSelectedIds] = useState([]); // catalog names that are selected
  const [questions, setQuestions] = useState([]); // questions for current quiz
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // chosen option indices
  const [showSettings, setShowSettings] = useState(false);

  const { stats, recordRound, clearStats, errorRate } = useQuestionStats();

  function handleCatalogAdded(catalog) {
    setCatalogs((prev) => {
      const exists = prev.find((c) => c.name === catalog.name);
      if (exists) {
        return prev.map((c) => (c.name === catalog.name ? catalog : c));
      }
      return [...prev, catalog];
    });
    setMode("select");
  }

  function handleToggleCatalog(name) {
    setSelectedIds((prev) =>
      prev.includes(name) ? prev.filter((id) => id !== name) : [...prev, name],
    );
  }

  function handleStartQuiz() {
    const pooled = catalogs
      .filter((c) => selectedIds.includes(c.name))
      .flatMap((c) => c.questions);
    const ordered = smartShuffle(pooled, errorRate);
    setQuestions(ordered);
    setCurrentIndex(0);
    setAnswers([]);
    setMode("quiz");
  }

  function handleNext(chosenIndex) {
    setAnswers((prev) => [...prev, chosenIndex]);
    setCurrentIndex((i) => i + 1);
  }

  function handleFinish(chosenIndex) {
    const finalAnswers = [...answers, chosenIndex];
    setAnswers(finalAnswers);
    recordRound(questions, finalAnswers);
    setMode("result");
  }

  function handleRestart() {
    setCurrentIndex(0);
    setAnswers([]);
    setMode("select");
  }

  function handleClearData() {
    clearStats();
    setShowSettings(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <button
          onClick={() => {
            if (mode !== "upload")
              setMode(catalogs.length ? "select" : "upload");
          }}
          className="flex items-center gap-2 group"
          aria-label="Zur Startseite"
        >
          <span className="text-violet-400 font-extrabold text-xl tracking-tight group-hover:text-violet-300 transition-colors">
            HexLearn
          </span>
        </button>

        <div className="flex items-center gap-3">
          {mode === "quiz" && (
            <span className="text-xs text-slate-500">
              {currentIndex + 1} / {questions.length}
            </span>
          )}
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Einstellungen"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            key="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl px-6 py-8 flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-100">
                  Einstellungen
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  aria-label="Schließen"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-300">
                  Lernfortschritt
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  HexLearn speichert, wie oft du jede Frage richtig oder falsch
                  beantwortet hast, um schwierige Fragen bevorzugt abzufragen.
                  Diese Daten liegen ausschließlich in deinem Browser
                  (localStorage).
                </p>
                <div className="text-xs text-slate-500 mt-1">
                  Gespeicherte Fragen:{" "}
                  <span className="text-slate-300 font-semibold">
                    {Object.keys(stats).length}
                  </span>
                </div>
              </div>

              <button
                onClick={handleClearData}
                className="w-full py-3 rounded-2xl border-2 border-red-700 text-red-400 hover:bg-red-900/20 hover:border-red-500 font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Alle Lernfortschrittsdaten löschen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col justify-center py-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === "upload" && (
            <motion.section
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-8 px-4"
            >
              <div className="text-center">
                <h1 className="text-3xl font-extrabold text-slate-100">
                  Lerne mit deinen eigenen Fragen
                </h1>
                <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                  Lade eine JSON-Datei mit Fragen hoch und starte sofort ein
                  Quiz.
                </p>
              </div>
              <FileUploader onCatalogAdded={handleCatalogAdded} />
            </motion.section>
          )}

          {mode === "select" && (
            <motion.section
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <CatalogSelector
                catalogs={catalogs}
                selectedIds={selectedIds}
                onToggle={handleToggleCatalog}
                onStart={handleStartQuiz}
                onAddMore={() => setMode("upload")}
                stats={stats}
              />
            </motion.section>
          )}

          {mode === "quiz" && questions[currentIndex] && (
            <motion.section
              key={`quiz-${currentIndex}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <QuizCard
                question={questions[currentIndex]}
                index={currentIndex}
                total={questions.length}
                onNext={handleNext}
                onFinish={handleFinish}
              />
            </motion.section>
          )}

          {mode === "result" && (
            <motion.section
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Results
                questions={questions}
                answers={answers}
                stats={stats}
                onPlayAgain={handleStartQuiz}
                onChangeCatalogs={handleRestart}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
