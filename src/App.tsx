import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Settings,
  X,
  Sun,
  Moon,
  Pause,
  Download,
  Upload,
  Loader2,
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import QuizCard from "./components/QuizCard";
import Results from "./components/Results";
import { useQuestionStats } from "./hooks/useQuestionStats";
import { useCatalogs } from "./hooks/useCatalogs";
import { useStreak } from "./hooks/useStreak";
import CatalogManager from "./components/CatalogManager";
import QuizConfig from "./components/QuizConfig";
import Flashcards from "./components/Flashcards";
import Tutorial from "./components/Tutorial";
import Legal from "./components/Legal";
import StatsPage from "./components/StatsPage";

/** SR-aware shuffle — weight from srWeight() drives question order. */
function smartShuffle(questions, srWeightFn) {
  return [...questions]
    .map((q) => {
      const id = String(q.id ?? q.question);
      const w = srWeightFn(id);
      return { q, sort: Math.random() ** (1 / w) };
    })
    .sort((a, b) => b.sort - a.sort)
    .map(({ q }) => q);
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [legalSection, setLegalSection] = useState("impressum");
  const [configInitialIds, setConfigInitialIds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizPool, setQuizPool] = useState([]);
  const [quizCount, setQuizCount] = useState(10);
  const [quizOffset, setQuizOffset] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [importError, setImportError] = useState(null);
  const [shareImportToast, setShareImportToast] = useState(null); // null | { status, msg }
  const importRef = useRef(null);

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

  const { stats, recordRound, clearStats, errorRate, srWeight } =
    useQuestionStats();
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

  // Handle ?share=... on first render — fetch catalog from server (HexShare)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("share")) return;

    const shareId = params.get("share");
    if (!shareId || !/^[0-9a-f]{8}$/.test(shareId)) return;

    // Strip query param immediately
    window.history.replaceState(null, "", window.location.pathname);

    async function fetchShare() {
      setShareImportToast({ status: "loading", msg: "Katalog wird geladen…" });
      try {
        const res = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`);
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Ungültiger oder abgelaufener Link.");

        const questions = Array.isArray(data.catalog)
          ? data.catalog
          : data.catalog?.questions;
        if (!Array.isArray(questions) || questions.length === 0)
          throw new Error("Ungültiges Katalog-Format.");

        const name = data.catalog?.name || "Geteilter Katalog";
        addCatalog({
          name,
          questions: questions.map((q) =>
            q.type ? q : { ...q, type: "multiple-choice" },
          ),
        });
        setShareImportToast({
          status: "success",
          msg: `„${name}" importiert!`,
        });
        setTimeout(() => setShareImportToast(null), 4000);
      } catch (err) {
        setShareImportToast({ status: "error", msg: err.message });
        setTimeout(() => setShareImportToast(null), 5000);
      }
    }

    fetchShare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOpenConfig(catalogIds) {
    setConfigInitialIds(catalogIds ?? []);
    setView("config");
  }

  function handleStartQuiz(catalogIds, count = 10, mode = "quiz") {
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
    const shuffled = smartShuffle(pooled, srWeight);
    const batch = shuffled.slice(0, count);
    setQuizPool(shuffled);
    setQuizCount(count);
    setQuizOffset(count);
    setQuestions(batch);
    setCurrentIndex(0);
    setAnswers([]);
    setView(mode === "flashcards" ? "flashcards" : "quiz");
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

  function handlePlayNext() {
    let pool = quizPool;
    let offset = quizOffset;
    if (offset >= pool.length) {
      pool = smartShuffle(pool, srWeight);
      setQuizPool(pool);
      offset = 0;
    }
    const batch = pool.slice(offset, offset + quizCount);
    setQuizOffset(offset + quizCount);
    setQuestions(batch);
    setCurrentIndex(0);
    setAnswers([]);
    setView("quiz");
  }

  function handlePlaySameAgain() {
    const reshuffled = smartShuffle(questions, srWeight);
    setQuestions(reshuffled);
    setCurrentIndex(0);
    setAnswers([]);
    setView("quiz");
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

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      hexlearn_catalogs: JSON.parse(
        localStorage.getItem("hexlearn_catalogs") ?? "[]",
      ),
      hexlearn_question_stats: JSON.parse(
        localStorage.getItem("hexlearn_question_stats") ?? "{}",
      ),
      hexlearn_streak: JSON.parse(
        localStorage.getItem("hexlearn_streak") ?? "null",
      ),
      hexlearn_theme: localStorage.getItem("hexlearn_theme") ?? "dark",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hexlearn-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (
          data.hexlearn_catalogs === undefined &&
          data.hexlearn_question_stats === undefined &&
          data.hexlearn_streak === undefined
        ) {
          setImportError("Ungültige Backup-Datei.");
          return;
        }
        if (data.hexlearn_catalogs !== undefined)
          localStorage.setItem(
            "hexlearn_catalogs",
            JSON.stringify(data.hexlearn_catalogs),
          );
        if (data.hexlearn_question_stats !== undefined)
          localStorage.setItem(
            "hexlearn_question_stats",
            JSON.stringify(data.hexlearn_question_stats),
          );
        if (data.hexlearn_streak !== undefined)
          localStorage.setItem(
            "hexlearn_streak",
            JSON.stringify(data.hexlearn_streak),
          );
        if (data.hexlearn_theme !== undefined)
          localStorage.setItem("hexlearn_theme", data.hexlearn_theme);
        window.location.reload();
      } catch {
        setImportError("Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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

  const pageProps = () => ({
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

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Ger&auml;te&uuml;bergreifend
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Exportiere alle deine Kataloge und deinen Lernfortschritt als
                  JSON-Datei und importiere sie auf einem anderen Ger&auml;t.
                </p>
                {importError && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                    {importError}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-500 font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <Download size={15} />
                    Exportieren
                  </button>
                  <button
                    onClick={() => {
                      setImportError(null);
                      importRef.current?.click();
                    }}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <Upload size={15} />
                    Importieren
                  </button>
                </div>
                <input
                  ref={importRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>

              <button
                onClick={handleClearData}
                className="w-full py-3 rounded-2xl border-2 border-red-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Alle Daten l&ouml;schen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Share-import toast ────────────────────────────────── */}
      <AnimatePresence>
        {shareImportToast && (
          <motion.div
            key="share-toast"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 pointer-events-none w-full max-w-sm"
          >
            <div
              className={`rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 border text-sm font-medium ${
                shareImportToast.status === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
                  : shareImportToast.status === "loading"
                    ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    : "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
              }`}
            >
              {shareImportToast.status === "loading" && (
                <Loader2
                  size={14}
                  className="animate-spin flex-shrink-0"
                />
              )}
              <span>{shareImportToast.msg}</span>
            </div>
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
              key="dashboard"
              className="flex-1 flex flex-col py-6"
              {...pageProps()}
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
                onOpenTutorial={() => setView("tutorial")}
                onOpenStats={() => setView("stats")}
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

          {view === "flashcards" && (
            <motion.div
              className="flex-1 flex flex-col justify-center py-8"
              key="flashcards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <Flashcards
                questions={questions}
                onFinish={() => setView("dashboard")}
                onBack={() => setView("dashboard")}
              />
            </motion.div>
          )}

          {view === "result" && (
            <motion.div
              key="result"
              className="flex-1 flex flex-col py-8"
              {...pageProps()}
            >
              <Results
                questions={questions}
                answers={answers}
                stats={stats}
                onPlayNext={handlePlayNext}
                onPlaySameAgain={handlePlaySameAgain}
                onGoHome={() => setView("dashboard")}
              />
            </motion.div>
          )}
          {view === "config" && (
            <motion.div
              key="config"
              className="flex-1 flex flex-col py-6"
              {...pageProps()}
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
              key="manage"
              className="flex-1 flex flex-col py-6"
              {...pageProps()}
            >
              <CatalogManager
                catalogs={catalogs}
                onUpdate={handleUpdateCatalog}
                onDelete={handleDeleteCatalog}
                onBack={() => setView("dashboard")}
              />
            </motion.div>
          )}

          {view === "tutorial" && (
            <motion.div
              key="tutorial"
              className="flex-1 flex flex-col py-6"
              {...pageProps()}
            >
              <Tutorial onBack={() => setView("dashboard")} />
            </motion.div>
          )}

          {view === "legal" && (
            <motion.div
              key="legal"
              className="flex-1 flex flex-col py-6"
              {...pageProps()}
            >
              <Legal
                section={legalSection}
                onBack={() => setView("dashboard")}
              />
            </motion.div>
          )}

          {view === "stats" && (
            <motion.div
              key="stats"
              className="flex-1 flex flex-col py-6"
              {...pageProps()}
            >
              <StatsPage
                catalogs={catalogs}
                stats={stats}
                onBack={() => setView("dashboard")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-3 px-6 text-center space-y-1">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          HexLearn · Lokal. Privat. Dein Wissen.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-600 max-w-sm mx-auto leading-relaxed">
          Diese App erhebt, speichert oder überträgt keinerlei personenbezogene
          Daten. Alle Inhalte verbleiben ausschließlich lokal auf deinem Gerät
          (localStorage).
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <a
            href="https://github.com/EduardoFantastico"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 dark:text-slate-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors underline underline-offset-2"
          >
            GitHub
          </a>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <button
            onClick={() => {
              setLegalSection("impressum");
              setView("legal");
            }}
            className="text-xs text-slate-400 dark:text-slate-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors underline underline-offset-2"
          >
            Impressum
          </button>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <button
            onClick={() => {
              setLegalSection("datenschutz");
              setView("legal");
            }}
            className="text-xs text-slate-400 dark:text-slate-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors underline underline-offset-2"
          >
            Datenschutz
          </button>
        </div>
      </footer>
    </div>
  );
}
