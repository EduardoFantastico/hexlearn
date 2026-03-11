/**
 * Shared question helpers — used by QuizCard, Results, and useQuestionStats.
 *
 * Supported types:
 *   "multiple-choice"  (default) — correctAnswerIndex: number
 *   "text-input"                 — answer: string, acceptedAnswers?: string[]
 *   "fill-in-the-blank"          — answer: string, acceptedAnswers?: string[]
 *   "true-false"                 — answer: boolean
 *   "matching"                   — pairs: { left, right }[]
 */
export function isAnswerCorrect(question, answer) {
  const type = question?.type ?? "multiple-choice";

  if (type === "text-input" || type === "fill-in-the-blank") {
    const all = [question.answer, ...(question.acceptedAnswers ?? [])];
    const normalized = String(answer ?? "")
      .trim()
      .toLowerCase();
    return (
      normalized.length > 0 &&
      all.some(
        (a) =>
          String(a ?? "")
            .trim()
            .toLowerCase() === normalized,
      )
    );
  }

  if (type === "true-false") {
    return answer === question.answer;
  }

  if (type === "matching") {
    if (!Array.isArray(answer) || answer.length !== question.pairs?.length)
      return false;
    return answer.every(
      (a, i) =>
        String(a ?? "")
          .trim()
          .toLowerCase() ===
        String(question.pairs[i]?.right ?? "")
          .trim()
          .toLowerCase(),
    );
  }

  return answer === question?.correctAnswerIndex;
}

/** Human-readable label for a question type. */
export const TYPE_LABEL = {
  "multiple-choice": "MC",
  "text-input": "Eingabe",
  "fill-in-the-blank": "Lückentext",
  "true-false": "R / F",
  matching: "Zuordnung",
};

/** Tailwind badge classes per question type (text + bg). */
export const TYPE_BADGE_CLASS = {
  "multiple-choice":
    "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
  "text-input":
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  "fill-in-the-blank":
    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  "true-false":
    "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  matching: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
};
