import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FileUploader from "./components/FileUploader";
import CatalogSelector from "./components/CatalogSelector";
import QuizCard from "./components/QuizCard";
import Results from "./components/Results";

/**
 * App modes:
 *   'upload'   – no catalogs yet, show upload screen
 *   'select'   – catalogs available, choose which to use
 *   'quiz'     – actively answering questions
 *   'result'   – quiz finished, show summary
 */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [mode, setMode] = useState("upload"); // 'upload' | 'select' | 'quiz' | 'result'
  const [catalogs, setCatalogs] = useState([]); // [{ name, questions }]
  const [selectedIds, setSelectedIds] = useState([]); // catalog names that are selected
  const [questions, setQuestions] = useState([]); // flattened + shuffled questions for current quiz
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // list of chosen option indices

  function handleCatalogAdded(catalog) {
    setCatalogs((prev) => {
      const exists = prev.find((c) => c.name === catalog.name);
      if (exists) {
        // Replace with updated catalog
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
    const shuffled = shuffle(pooled);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setAnswers([]);
    setMode("quiz");
  }

  function handleNext(chosenIndex) {
    setAnswers((prev) => [...prev, chosenIndex]);
    setCurrentIndex((i) => i + 1);
  }

  function handleFinish(chosenIndex) {
    setAnswers((prev) => [...prev, chosenIndex]);
    setMode("result");
  }

  function handleRestart() {
    setCurrentIndex(0);
    setAnswers([]);
    setMode("select");
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

        {mode === "quiz" && (
          <span className="text-xs text-slate-500">
            {currentIndex + 1} / {questions.length}
          </span>
        )}
      </header>

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
