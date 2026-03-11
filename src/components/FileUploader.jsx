import { useState, useRef } from "react";

/**
 * FileUploader
 * Accepts one or more JSON files via Drag-and-Drop or file picker.
 * Each file must contain an array of questions:
 *   { id, question, options: string[], correctAnswerIndex: number }
 *
 * On success, calls onCatalogAdded({ name: string, questions: Question[] })
 */
export default function FileUploader({ onCatalogAdded }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  function parseFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.name.endsWith(".json")) {
        return reject(new Error(`"${file.name}" ist keine JSON-Datei.`));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const questions = Array.isArray(data) ? data : data.questions;
          if (!Array.isArray(questions) || questions.length === 0) {
            return reject(
              new Error(`"${file.name}" enthält kein gültiges Fragen-Array.`),
            );
          }
          for (const q of questions) {
            const type = q.type ?? "multiple-choice";
            if (typeof q.id === "undefined" || typeof q.question !== "string") {
              return reject(
                new Error(
                  `"${file.name}": Ungültiges Fragen-Format — jede Frage braucht 'id' und 'question'.`,
                ),
              );
            }
            if (type === "text-input" || type === "fill-in-the-blank") {
              if (typeof q.answer !== "string") {
                return reject(
                  new Error(
                    `"${file.name}": Frage vom Typ '${type}' braucht ein 'answer'-Feld (string).`,
                  ),
                );
              }
            } else if (type === "true-false") {
              if (typeof q.answer !== "boolean") {
                return reject(
                  new Error(
                    `"${file.name}": Frage vom Typ 'true-false' braucht 'answer: true|false'.`,
                  ),
                );
              }
            } else if (type === "matching") {
              if (
                !Array.isArray(q.pairs) ||
                q.pairs.length < 2 ||
                q.pairs.some(
                  (p) =>
                    typeof p.left !== "string" || typeof p.right !== "string",
                )
              ) {
                return reject(
                  new Error(
                    `"${file.name}": Frage vom Typ 'matching' braucht 'pairs: [{left, right}]' mit mind. 2 Paaren.`,
                  ),
                );
              }
            } else {
              if (
                !Array.isArray(q.options) ||
                typeof q.correctAnswerIndex !== "number"
              ) {
                return reject(
                  new Error(
                    `"${file.name}": Ungültiges Fragen-Format. Erwartet: { id, question, options[], correctAnswerIndex }.`,
                  ),
                );
              }
            }
          }
          resolve({
            name: file.name.replace(/\.json$/i, ""),
            questions: questions.map((q) =>
              q.type ? q : { ...q, type: "multiple-choice" },
            ),
          });
        } catch {
          reject(
            new Error(`"${file.name}" konnte nicht als JSON geparst werden.`),
          );
        }
      };
      reader.onerror = () =>
        reject(new Error(`Fehler beim Lesen von "${file.name}".`));
      reader.readAsText(file);
    });
  }

  async function handleFiles(files) {
    setError(null);
    for (const file of Array.from(files)) {
      try {
        const catalog = await parseFile(file);
        onCatalogAdded(catalog);
      } catch (err) {
        setError(err.message);
      }
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="JSON-Datei hochladen"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          w-full rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer
          transition-colors duration-200 select-none
          ${
            dragging
              ? "border-violet-400 bg-violet-50 dark:bg-violet-900/30"
              : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-violet-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16v-8m0 0-3 3m3-3 3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
          />
        </svg>
        <p className="text-slate-700 dark:text-slate-300 text-sm text-center leading-relaxed">
          JSON-Datei per{" "}
          <span className="text-violet-400 font-semibold">Drag & Drop</span>{" "}
          hierher ziehen
          <br />
          oder <span className="text-violet-400 font-semibold">
            klicken
          </span>{" "}
          zum Auswählen
        </p>
        <p className="text-xs text-slate-500">
          Format: {`{ id, question, options[], correctAnswerIndex }`}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p
          role="alert"
          className="text-red-400 text-sm bg-red-900/20 border border-red-700 rounded-xl px-4 py-2 text-center w-full"
        >
          {error}
        </p>
      )}
    </div>
  );
}
