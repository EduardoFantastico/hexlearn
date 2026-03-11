/**
 * Shared question helpers — used by QuizCard, Results, and useQuestionStats.
 */

/**
 * Returns true if `answer` is correct for the given question.
 *
 * - "multiple-choice" (default): checks answer === correctAnswerIndex
 * - "text-input": case-insensitive trimmed match against answer + acceptedAnswers[]
 */
export function isAnswerCorrect(question, answer) {
  const type = question?.type ?? "multiple-choice";
  if (type === "text-input") {
    const all = [question.answer, ...(question.acceptedAnswers ?? [])];
    const normalized = String(answer ?? "").trim().toLowerCase();
    return (
      normalized.length > 0 &&
      all.some((a) => String(a ?? "").trim().toLowerCase() === normalized)
    );
  }
  return answer === question?.correctAnswerIndex;
}
