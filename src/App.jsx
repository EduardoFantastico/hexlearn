import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, X, Sun, Moon, Pause } from "lucide-react";
import Dashboard from "./components/Dashboard";
import QuizCard from "./components/QuizCard";
import Results from "./components/Results";
import { useQuestionStats } from "./hooks/useQuestionStats";
import { useCatalogs } from "./hooks/useCatalogs";
import { useStreak } from "./hooks/useStreak";
import CatalogManager from "./components/CatalogManager";
import QuizConfig from "./components/QuizConfig";

/** Weighted shuffle — questions with a higher error rate appear earlier. */
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
  const [view, setView] = useState("dashboard");
  const [configInitialIds, setConfigInitialIds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

  // Dark mode — default dark, persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem("hexlearn_theme");
      return stored !== null ? stored === "dark" : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("hexlearn_theme", darkMode ? "dark" : "light");
    } catch {}
  }, [darkMode]);

  // Scroll-hide header
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      if (currentY <= 10) {
        setHeaderVisible(true);
      } else if (currentY > lastScrollY.current + 8) {
        setHeaderVisible(false);
      } else if (currentY < lastScrollY.current - 4) {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentY;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { stats, recordRound, clearStats, errorRate } = useQuestionStats();
  const {
    catalogs,
    addCatalog,
    updateCatalog,
    markUsed,
    removeCatalog,
    clearCatalogs,
  } = useCatalogs();
  const { streak, todayCount, weeklyData, recordActivity, clearStreak } =
    useStreak();

  function handleCatalogAdded({ name, questions: qs }) {
    addCatalog({ name, questions: qs });
  }

  function handleOpenConfig(catalogIds) {
    setConfigInitialIds(catalogIds ?? []);
    setView("config");
  }

  function handleStartQuiz(catalogIds, count = 10) {
    const seen = new Set();
    const pooled = catalogs
      .filter((c) => catalogIds.includes(c.id))
      .flatMap((c) => c.questions)
      .filter((q) => {
        const key = String(q.id ?? q.question);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    if (pooled.length === 0) return;
    markUsed(catalogIds);
    const ordered = smartShuffle(pooled, errorRate).slice(0, count);
    setQuestions(ordered);
    setCurrentIndex(0);
    setAnswers([]);
    setView("quiz");
  }

  function handleNext(chosenIndex) {
    setAnswers((prev) => [...prev, chosenIndex]);
    setCurrentIndex((i) => i + 1);
  }

  function handleFinish(chosenIndex) {
    const finalAnswers = [...answers, chosenIndex];
    setAnswers(finalAnswers);
    recordRound(questions, finalAnswers);
    recordActivity(questions.length);
    setView("result");
  }

  function handleQuitQuiz() {
    setShowPauseModal(false);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setView("dashboard");
  }

  function handleClearData() {
    clearStats();
    clearCatalogs();
    clearStreak();
    setView("dashboard");
    setShowSettings(false);
  }

  function handleUpdateCatalog(id, { name, questions }) {
    if (id === null) {
      addCatalog({ name, questions });
    } else {
      updateCatalog(id, { name, questions });
    }
  }

  function handleDeleteCatalog(id) {
    removeCatalog(id);
  }

  const pageProps = (key) => ({
    key,
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -18 },
    transition: { duration: 0.22, ease: "easeInOut" },
  });

  return (
    <div className="bg-white dark:bg-slate-950 overflow-x-hidden">
      {/* ── Sticky Header ─────────────────────────────────────── */}
      <motion.header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md"
        animate={{ y: headerVisible ? 0 : -100 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <button
          onClick={() => setView("dashboard")}
          aria-label="Dashboard"
          className="group"
        >
          <span className="text-violet-700 dark:text-violet-400 font-extrabold text-2xl tracking-tight group-hover:text-violet-500 dark:group-hover:text-violet-300 transition-colors">
            HexLearn
          </span>
        </button>

        <div className="flex items-center gap-2">
          {view === "quiz" && (
            <>
              <span className="text-xs text-slate-500 tabular-nums">
                {currentIndex + 1} / {questions.length}
              </span>
              <button
                onClick={() => setShowPauseModal(true)}
                aria-label="Quiz pausieren"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <Pause size={18} />
              </button>
            </>
          )}
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode((d) => !d)}
            aria-label={
              darkMode
                ? "In den Hellmodus wechseln"
                : "In den Dunkelmodus wechseln"
            }
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Einstellungen öffnen"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Settings size={19} />
          </button>
        </div>
      </motion.header>

      {/* ── Settings Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            key="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-[env(safe-area-inset-bottom,24px)] sm:pb-0"
          >
            <div
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-10 w-full max-w-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl px-6 py-8 flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Einstellungen
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                  aria-label="Schließen"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Datenschutz &amp; Daten
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  HexLearn speichert deine Fragenkataloge, deinen
                  Lernfortschritt und deinen Lern-Streak ausschließlich lokal in
                  deinem Browser (localStorage). Es werden keine Daten an
                  externe Server gesendet.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-center">
                    <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                      {catalogs.length}
                    </p>
                    <p className="text-[10px] text-slate-500">Kataloge</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-center">
                    <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                      {Object.keys(stats).length}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Fragen getrackt
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearData}
                className="w-full py-3 rounded-2xl border-2 border-red-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Alle Daten löschen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pause Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showPauseModal && (
          <motion.div
            key="pause-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPauseModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl px-6 py-8 flex flex-col items-center gap-5 shadow-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Pause
                  size={28}
                  className="text-violet-600 dark:text-violet-400"
                />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Quiz pausiert
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Frage {currentIndex + 1} von {questions.length}
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => setShowPauseModal(false)}
                  className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-base transition-all shadow-lg shadow-violet-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  Weiter →
                </button>
                <button
                  onClick={handleQuitQuiz}
                  className="w-full py-3 rounded-2xl border-2 border-red-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Quiz beenden
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div
              className="flex-1 flex flex-col py-6"
              {...pageProps("dashboard")}
            >
              <Dashboard
                catalogs={catalogs}
                stats={stats}
                streak={streak}
                todayCount={todayCount}
                weeklyData={weeklyData}
                onOpenConfig={handleOpenConfig}
                onCatalogAdded={handleCatalogAdded}
                onOpenSettings={() => setShowSettings(true)}
                onManageCatalogs={() => setView("manage")}
              />
            </motion.div>
          )}

          {view === "quiz" && questions[currentIndex] && (
            <motion.div
              className="flex-1 flex flex-col justify-center py-8"
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
            </motion.div>
          )}

          {view === "result" && (
            <motion.div
              className="flex-1 flex flex-col py-8"
              {...pageProps("result")}
            >
              <Results
                questions={questions}
                answers={answers}
                stats={stats}
                onPlayAgain={() => {
                  const ordered = smartShuffle(questions, errorRate);
                  setQuestions(ordered);
                  setCurrentIndex(0);
                  setAnswers([]);
                  setView("quiz");
                }}
                onChangeCatalogs={() => setView("dashboard")}
              />
            </motion.div>
          )}
          {view === "config" && (
            <motion.div
              className="flex-1 flex flex-col py-6"
              {...pageProps("config")}
            >
              <QuizConfig
                catalogs={catalogs}
                stats={stats}
                initialIds={configInitialIds}
                onStart={handleStartQuiz}
                onBack={() => setView("dashboard")}
              />
            </motion.div>
          )}

          {view === "manage" && (
            <motion.div
              className="flex-1 flex flex-col py-6"
              {...pageProps("manage")}
            >
              <CatalogManager
                catalogs={catalogs}
                onUpdate={handleUpdateCatalog}
                onDelete={handleDeleteCatalog}
                onBack={() => setView("dashboard")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 px-6 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          HexLearn · Lokal. Privat. Dein Wissen.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-600 max-w-sm mx-auto leading-relaxed">
          Diese App erhebt, speichert oder überträgt keinerlei personenbezogene
          Daten. Alle Inhalte verbleiben ausschließlich lokal auf deinem Gerät
          (localStorage).
        </p>
      </footer>
    </div>
  );
}
