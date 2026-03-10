import { useState, useMemo } from "react";
import FileUploader from "./components/FileUploader";
import CatalogSelector from "./components/CatalogSelector";
import QuizCard from "./components/QuizCard";

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

  const score = useMemo(() => {
    return answers.filter((ans, i) => ans === questions[i]?.correctAnswerIndex)
      .length;
  }, [answers, questions]);

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

      <main className="flex-1 flex flex-col justify-center py-8">
        {mode === "upload" && (
          <section className="flex flex-col items-center gap-8 px-4">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-slate-100">
                Lerne mit deinen eigenen Fragen
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                Lade eine JSON-Datei mit Fragen hoch und starte sofort ein Quiz.
              </p>
            </div>
            <FileUploader onCatalogAdded={handleCatalogAdded} />
          </section>
        )}

        {mode === "select" && (
          <section>
            <CatalogSelector
              catalogs={catalogs}
              selectedIds={selectedIds}
              onToggle={handleToggleCatalog}
              onStart={handleStartQuiz}
              onAddMore={() => setMode("upload")}
            />
          </section>
        )}

        {mode === "quiz" && questions[currentIndex] && (
          <section>
            <QuizCard
              question={questions[currentIndex]}
              index={currentIndex}
              total={questions.length}
              onNext={handleNext}
              onFinish={handleFinish}
            />
          </section>
        )}

        {mode === "result" && (
          <section className="flex flex-col items-center gap-6 px-4 text-center max-w-md mx-auto w-full">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl px-8 py-10 w-full shadow-xl shadow-slate-950/60 flex flex-col items-center gap-4">
              <span className="text-5xl">
                {score === questions.length
                  ? "🏆"
                  : score >= questions.length / 2
                    ? "👍"
                    : "📚"}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-100">
                Quiz beendet!
              </h2>
              <p className="text-slate-300 text-base">
                Du hast{" "}
                <span className="text-violet-400 font-bold">{score}</span> von{" "}
                <span className="font-bold">{questions.length}</span> Fragen
                richtig beantwortet.
              </p>
              <div className="w-full bg-slate-700 rounded-full h-3 mt-2">
                <div
                  className="bg-violet-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${(score / questions.length) * 100}%` }}
                />
              </div>
              <p className="text-slate-400 text-sm">
                {Math.round((score / questions.length) * 100)} % korrekt
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleStartQuiz}
                className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-base transition-colors shadow-lg shadow-violet-900/40"
              >
                Nochmal spielen
              </button>
              <button
                onClick={handleRestart}
                className="w-full py-3 rounded-2xl border-2 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300 font-medium text-sm transition-colors"
              >
                Katalog-Auswahl ändern
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
