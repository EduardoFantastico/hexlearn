import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { isAnswerCorrect } from "../utils/questionHelpers";

const STORAGE_KEY = "hexlearn_question_stats";

/**
 * useQuestionStats
 *
 * Manages per-question statistics with SM-2-inspired spaced repetition.
 *
 * Shape stored:
 *   {
 *     [questionId: string]: {
 *       correct:  number,
 *       wrong:    number,
 *       interval: number,   // days until next review
 *       lastSeen: number,   // timestamp (ms) or null
 *     }
 *   }
 */
export function useQuestionStats() {
  const [stats, setStats] = useLocalStorage(STORAGE_KEY, {});

  const recordRound = useCallback(
    (questions, answers) => {
      const now = Date.now();
      setStats((prev) => {
        const next = { ...prev };
        questions.forEach((q, i) => {
          const id = String(q.id ?? q.question);
          const wasCorrect = isAnswerCorrect(q, answers[i]);
          const existing = next[id] ?? {
            correct: 0,
            wrong: 0,
            interval: 1,
            lastSeen: null,
          };
          // SM-2 inspired interval: correct → grow ×2.5 (cap 60d), wrong → reset to 0.5d
          const prevInterval = existing.interval ?? 1;
          const newInterval = wasCorrect
            ? existing.lastSeen === null
              ? 1
              : Math.min(prevInterval * 2.5, 60)
            : 0.5;
          next[id] = {
            correct: existing.correct + (wasCorrect ? 1 : 0),
            wrong: existing.wrong + (wasCorrect ? 0 : 1),
            interval: newInterval,
            lastSeen: now,
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

  /** Error rate [0–1]. 0 when never attempted. */
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

  /**
   * SR-aware shuffle weight (higher = appears earlier).
   *   Never seen          → 3    (should be introduced)
   *   Overdue             → 2–5  (based on error rate)
   *   Not yet due         → 0.2–1.0 (de-prioritised until interval elapsed)
   */
  const srWeight = useCallback(
    (questionId) => {
      const id = String(questionId);
      const s = stats[id];
      if (!s || s.lastSeen == null) return 3;
      const daysSince = (Date.now() - s.lastSeen) / 86_400_000;
      const interval = s.interval ?? 1;
      const er =
        s.correct + s.wrong > 0 ? s.wrong / (s.correct + s.wrong) : 0;
      if (daysSince >= interval) {
        return 2 + er * 3; // overdue: 2–5
      }
      return 0.2 + (daysSince / interval) * 0.8; // not due: 0.2–1.0
    },
    [stats],
  );

  return { stats, recordRound, clearStats, errorRate, srWeight };
}
