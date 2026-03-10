import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "hexlearn_streak";

/**
 * useStreak
 *
 * Tracks:
 *  - streak:      number of consecutive days the user completed at least one quiz
 *  - todayCount:  questions answered today
 *  - lastDate:    ISO date string of the last activity ('YYYY-MM-DD')
 *  - weeklyData:  last 7 days of question counts [{ date, count }]
 */

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT = {
  streak: 0,
  todayCount: 0,
  lastDate: null,
  weeklyData: [], // [{ date: 'YYYY-MM-DD', count: number }]
};

export function useStreak() {
  const [data, setData] = useLocalStorage(STORAGE_KEY, DEFAULT);

  /**
   * Call after a quiz round is finished.
   * @param {number} questionsAnswered  total questions answered in this round
   */
  const recordActivity = useCallback(
    (questionsAnswered) => {
      if (questionsAnswered <= 0) return;
      const today = todayISO();

      setData((prev) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayISO = yesterday.toISOString().slice(0, 10);

        // Streak logic
        let newStreak = prev.streak;
        if (prev.lastDate === today) {
          // Same day — streak unchanged
        } else if (prev.lastDate === yesterdayISO) {
          // Consecutive day
          newStreak = (prev.streak || 0) + 1;
        } else {
          // Gap — reset
          newStreak = 1;
        }

        // Today's count
        const newTodayCount =
          prev.lastDate === today
            ? (prev.todayCount || 0) + questionsAnswered
            : questionsAnswered;

        // Weekly data: keep last 7 days, upsert today
        const weeklyMap = Object.fromEntries(
          (prev.weeklyData || []).map((d) => [d.date, d.count]),
        );
        weeklyMap[today] = (weeklyMap[today] || 0) + questionsAnswered;

        // Build sorted last-7-days array
        const allDates = Object.keys(weeklyMap).sort();
        const last7 = allDates.slice(-7).map((date) => ({
          date,
          count: weeklyMap[date],
        }));

        return {
          streak: newStreak,
          todayCount: newTodayCount,
          lastDate: today,
          weeklyData: last7,
        };
      });
    },
    [setData],
  );

  const clearStreak = useCallback(() => {
    setData(DEFAULT);
  }, [setData]);

  // Compute whether streak is still active (last activity was today or yesterday)
  const today = todayISO();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().slice(0, 10);
  const streakActive =
    data.lastDate === today || data.lastDate === yesterdayISO;

  return {
    streak: streakActive ? data.streak : 0,
    todayCount: data.lastDate === today ? data.todayCount : 0,
    weeklyData: data.weeklyData || [],
    recordActivity,
    clearStreak,
  };
}
