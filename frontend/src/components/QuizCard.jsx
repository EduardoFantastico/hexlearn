/**
 * QuizCard
 * Displays a single question card with answer options.
 * Shows progress and allows navigation to the next question.
 */
export default function QuizCard({ question, index, total, onNext, onFinish }) {
  function handleOption(optionIndex) {
    const isLast = index === total - 1;
    if (isLast) {
      onFinish(optionIndex);
    } else {
      onNext(optionIndex);
    }
  }

  const isLast = index === total - 1;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto px-4">
      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>
            Frage {index + 1} von {total}
          </span>
          <span>{Math.round(((index + 1) / total) * 100)} %</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="bg-violet-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-slate-800 border border-slate-700 rounded-3xl px-6 py-7 shadow-xl shadow-slate-950/60">
        <p className="text-lg font-semibold text-slate-100 leading-snug">
          {question.question}
        </p>
      </div>

      {/* Answer options */}
      <ul className="flex flex-col gap-3">
        {question.options.map((option, i) => (
          <li key={i}>
            <button
              onClick={() => handleOption(i)}
              className="w-full text-left flex items-center gap-4 rounded-2xl border-2 border-slate-700 bg-slate-800 px-5 py-4 text-slate-300 text-sm font-medium hover:border-violet-500 hover:bg-violet-900/20 hover:text-slate-100 active:scale-95 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <span className="w-7 h-7 flex-shrink-0 rounded-full border-2 border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400">
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-slate-600">
        {isLast
          ? "Das ist die letzte Frage."
          : `Noch ${total - index - 1} Frage${total - index - 1 === 1 ? "" : "n"} übrig.`}
      </p>
    </div>
  );
}
