/**
 * CatalogSelector
 * Shows all uploaded catalogs as selectable cards with accuracy badges.
 * The user can toggle multiple catalogs and then start the quiz.
 */
export default function CatalogSelector({
  catalogs,
  selectedIds,
  onToggle,
  onStart,
  onAddMore,
  stats = {},
}) {
  const canStart = selectedIds.length > 0;

  /** Compute accuracy for a catalog based on stored stats. Returns null when no data exists. */
  function catalogAccuracy(catalog) {
    let totalCorrect = 0;
    let totalAttempts = 0;
    for (const q of catalog.questions) {
      const id = String(q.id ?? q.question);
      const s = stats[id];
      if (s) {
        totalCorrect += s.correct;
        totalAttempts += s.correct + s.wrong;
      }
    }
    if (totalAttempts === 0) return null;
    return Math.round((totalCorrect / totalAttempts) * 100);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100">Fragenkataloge</h2>
        <p className="text-slate-400 text-sm mt-1">
          Wähle einen oder mehrere Kataloge für dein Quiz aus.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {catalogs.map((catalog) => {
          const selected = selectedIds.includes(catalog.name);
          const accuracy = catalogAccuracy(catalog);
          const accuracyColor =
            accuracy === null
              ? "text-slate-500"
              : accuracy >= 70
                ? "text-emerald-400"
                : accuracy >= 40
                  ? "text-amber-400"
                  : "text-red-400";
          return (
            <li key={catalog.name}>
              <button
                onClick={() => onToggle(catalog.name)}
                aria-pressed={selected}
                className={`
                  w-full flex items-center justify-between rounded-2xl px-5 py-4 text-left
                  border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                  ${
                    selected
                      ? "border-violet-500 bg-violet-900/30 text-slate-100"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                  }
                `}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-base">
                    {catalog.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{catalog.questions.length} Fragen</span>
                    {accuracy !== null && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className={`font-semibold ${accuracyColor}`}>
                          {accuracy} % korrekt
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "border-violet-400 bg-violet-500" : "border-slate-600"}`}
                >
                  {selected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        onClick={onAddMore}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-violet-600 hover:text-violet-400 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Weiteren Katalog hinzufügen
      </button>

      <button
        onClick={onStart}
        disabled={!canStart}
        className={`
          w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
          ${
            canStart
              ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40"
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
          }
        `}
      >
        Quiz starten
      </button>
    </div>
  );
}
