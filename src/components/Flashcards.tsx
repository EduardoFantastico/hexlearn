import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RefreshCcw,
  Check,
  User,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function Flashcards({ questions, onFinish, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const question = questions[currentIndex];

  if (!question) return null;

  let correctAnswer = "";
  if (question.type === "multiple-choice" || !question.type) {
    correctAnswer = question.options?.[question.correctAnswerIndex ?? 0] ?? "";
  } else if (
    question.type === "text-input" ||
    question.type === "fill-in-the-blank"
  ) {
    correctAnswer = question.answer;
  } else if (question.type === "true-false") {
    correctAnswer = question.answer ? "Richtig" : "Falsch";
  } else if (question.type === "matching") {
    correctAnswer =
      question.pairs?.map((p: any) => `${p.left} → ${p.right}`).join("\n") ||
      "";
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>
        <span className="text-sm font-semibold text-slate-500">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="w-full perspective-1000">
        <motion.div
          className="w-full preserve-3d cursor-pointer grid"
          onClick={() => setFlipped(!flipped)}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          {/* Front */}
          <div className="col-start-1 row-start-1 backface-hidden bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 flex flex-col items-center shadow-lg min-h-[350px]">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4 flex-shrink-0">
              Frage
            </span>
            <div className="flex-1 w-full flex items-center justify-center py-4">
              <h2 className="text-xl md:text-2xl font-bold text-center text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
                {question.question}
              </h2>
            </div>
            <div className="mt-auto pt-4 text-sm text-slate-400 flex items-center gap-2 flex-shrink-0">
              <RefreshCcw size={14} /> Tippen zum Wenden
            </div>
          </div>

          {/* Back */}
          <div
            className="col-start-1 row-start-1 backface-hidden bg-violet-50 dark:bg-violet-900/30 border-2 border-violet-200 dark:border-violet-800 rounded-3xl p-6 md:p-8 flex flex-col items-center shadow-lg min-h-[350px]"
            style={{ transform: "rotateY(180deg)" }}
          >
            <span className="text-xs uppercase tracking-widest text-violet-500 dark:text-violet-400 font-bold mb-4 flex-shrink-0">
              Antwort
            </span>
            <div className="flex-1 w-full flex items-center justify-center py-4">
              <h2 className="text-xl md:text-2xl font-bold text-center text-violet-800 dark:text-violet-100 whitespace-pre-wrap break-words">
                {correctAnswer}
              </h2>
            </div>
            <div className="mt-auto pt-4 text-sm text-violet-400/80 flex items-center gap-2 flex-shrink-0">
              <Check size={16} /> Lösung
            </div>
          </div>
        </motion.div>
      </div>

      <div className="w-full flex items-center justify-between gap-4 mt-8">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 py-4 flex justify-center items-center gap-2 rounded-2xl font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} /> Zurück
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-4 flex justify-center items-center gap-2 rounded-2xl font-bold bg-violet-600 text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/40"
        >
          {currentIndex === questions.length - 1 ? "Fertig" : "Nächste"}{" "}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
