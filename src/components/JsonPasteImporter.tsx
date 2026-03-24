import { useState, useEffect } from "react";
import { CircleCheck, CircleAlert, Download, Clipboard } from "lucide-react";

const VALID_TYPES = new Set([
  "multiple-choice",
  "true-false",
  "text-input",
  "fill-in-the-blank",
  "matching",
]);

function validateQuestions(text) {
  if (!text.trim()) return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { valid: false, error: "Syntaxfehler – kein gültiges JSON." };
  }
  const questions = Array.isArray(data) ? data : data.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    return { valid: false, error: "Erwartet ein JSON-Array mit Fragen." };
  }
  for (const q of questions) {
    const type = q.type ?? "multiple-choice";
    if (typeof q.id === "undefined" || typeof q.question !== "string") {
      return {
        valid: false,
        error: "Jede Frage braucht 'id' und 'question' (string).",
      };
    }
    if (!VALID_TYPES.has(type)) {
      return { valid: false, error: `Unbekannter Fragetyp: '${type}'.` };
    }
    if (type === "text-input" || type === "fill-in-the-blank") {
      if (typeof q.answer !== "string")
        return {
          valid: false,
          error: `Typ '${type}' braucht 'answer' (string).`,
        };
    } else if (type === "true-false") {
      if (typeof q.answer !== "boolean")
        return {
          valid: false,
          error: "Typ 'true-false' braucht 'answer: true|false'.",
        };
    } else if (type === "matching") {
      if (
        !Array.isArray(q.pairs) ||
        q.pairs.length < 2 ||
        q.pairs.some(
          (p) => typeof p.left !== "string" || typeof p.right !== "string",
        )
      )
        return {
          valid: false,
          error: "Typ 'matching' braucht 'pairs: [{left, right}]' (min. 2).",
        };
    } else {
      if (!Array.isArray(q.options) || typeof q.correctAnswerIndex !== "number")
        return {
          valid: false,
          error:
            "Multiple-Choice braucht 'options[]' und 'correctAnswerIndex'.",
        };
    }
  }
  return {
    valid: true,
    count: questions.length,
    questions: questions.map((q) =>
      q.type ? q : { ...q, type: "multiple-choice" },
    ),
  };
}

export default function JsonPasteImporter({ onCatalogAdded, initialCatalog }) {
  const [name, setName] = useState("");
  const [json, setJson] = useState("");
  const [validation, setValidation] = useState(null);
  const [imported, setImported] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize with provided catalog when switching to JSON view
  useEffect(() => {
    if (initialCatalog && Array.isArray(initialCatalog.questions)) {
      const text = JSON.stringify(initialCatalog.questions, null, 2);
      setName(initialCatalog.name ?? "");
      setJson(text);
      setValidation(validateQuestions(text));
    }
  }, [initialCatalog]);

  useEffect(() => {
    if (!json.trim()) {
      setValidation(null);
      return;
    }
    const id = setTimeout(() => setValidation(validateQuestions(json)), 280);
    return () => clearTimeout(id);
  }, [json]);

  function handleImport() {
    if (!validation?.valid) return;
    const catalogName = name.trim() || "Eingefügter Katalog";
    onCatalogAdded({ name: catalogName, questions: validation.questions });
    setImported(true);
    setTimeout(() => setImported(false), 2200);
  }

  function handleDownload() {
    if (!validation?.valid) return;
    const blob = new Blob([JSON.stringify(validation.questions, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name.trim() || "katalog")
      .replace(/\s+/g, "-")
      .toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    if (!validation?.valid) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(validation.questions, null, 2),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  }

  const canImport = validation?.valid && !imported;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Catalog name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Katalogname (optional)"
        className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500 transition"
      />

      {/* JSON textarea */}
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder={'[\n  { "id": 1, "type": "multiple-choice", ... }\n]'}
        spellCheck={false}
        rows={7}
        className="w-full px-3 py-2.5 rounded-xl text-[12px] font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-violet-600 dark:text-violet-300 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500 transition resize-none leading-relaxed"
      />

      {/* Validation bar */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
          !json.trim()
            ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400"
            : validation === null
              ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400"
              : validation.valid
                ? "bg-emerald-50 dark:bg-emerald-900/25 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400"
        }`}
      >
        {!json.trim() || validation === null ? (
          <span className="text-slate-400">
            {!json.trim() ? "JSON hier einfügen…" : "Prüfe Format…"}
          </span>
        ) : validation.valid ? (
          <>
            <CircleCheck
              size={13}
              className="shrink-0"
            />
            <span>
              <strong>{validation.count}</strong>{" "}
              {validation.count === 1 ? "Frage" : "Fragen"} erkannt – Format
              gültig ✓
            </span>
          </>
        ) : (
          <>
            <CircleAlert
              size={13}
              className="shrink-0"
            />
            <span>{validation.error}</span>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={!canImport}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-violet-500 ${
            imported
              ? "bg-emerald-500 text-white"
              : canImport
                ? "bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          {imported ? "✓ Importiert!" : "Katalog importieren"}
        </button>
        <button
          onClick={handleCopy}
          disabled={!validation?.valid}
          title="In Zwischenablage kopieren"
          className={`flex items-center justify-center gap-2 px-3.5 rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-violet-500 ${
            validation?.valid
              ? copied
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          {copied ? (
            <>
              <CircleCheck size={14} />
              <span className="text-sm font-semibold">Kopiert!</span>
            </>
          ) : (
            <Clipboard size={15} />
          )}
        </button>
        <button
          onClick={handleDownload}
          disabled={!validation?.valid}
          title="Als JSON-Datei herunterladen"
          className={`flex items-center justify-center px-3.5 rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-violet-500 ${
            validation?.valid
              ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          <Download size={15} />
        </button>
      </div>
    </div>
  );
}
