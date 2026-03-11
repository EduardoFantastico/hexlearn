import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "hexlearn_question_stats";

/**
 * useQuestionStats
 *
 * Manages per-question attempt statistics persisted in localStorage.
 *
 * Shape stored:
 *   {
 *     [questionId: string]: { correct: number; wrong: number }
 *   }
 *
 * Returns:
 *   stats        – the full stats map
 *   recordRound  – (questions, answers) => void  — call once after a quiz round
 *   clearStats   – () => void                    — wipes all stored data
 *   errorRate    – (questionId) => number [0-1]  — fraction of wrong answers (0 when no attempts)
 */
export function useQuestionStats() {
  const [stats, setStats] = useLocalStorage(STORAGE_KEY, {});

  /**
   * Persist the results of a completed quiz round.
   * @param {Array<{id: string|number}>} questions  ordered list of questions shown
   * @param {number[]} answers                       chosen option indices, same order
   */
  const recordRound = useCallback(
    (questions, answers) => {
      setStats((prev) => {
        const next = { ...prev };
        questions.forEach((q, i) => {
          const id = String(q.id ?? q.question); // fall back to question text as key
          const wasCorrect = answers[i] === q.correctAnswerIndex;
          const existing = next[id] ?? { correct: 0, wrong: 0 };
          next[id] = {
            correct: existing.correct + (wasCorrect ? 1 : 0),
            wrong: existing.wrong + (wasCorrect ? 0 : 1),
          };
        });
        return next;
      });
    },
    [setStats],
  );

  const clearStats = useCallback(() => {
    setStats({});
  }, [setStats]);

  /**
   * Returns the error rate for a question [0, 1].
   * 0 = never wrong (or never attempted), 1 = always wrong.
   */
  const errorRate = useCallback(
    (questionId) => {
      const id = String(questionId);
      const s = stats[id];
      if (!s) return 0;
      const total = s.correct + s.wrong;
      return total === 0 ? 0 : s.wrong / total;
    },
    [stats],
  );

  return { stats, recordRound, clearStats, errorRate };
}
