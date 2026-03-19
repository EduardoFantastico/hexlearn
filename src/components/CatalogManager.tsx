import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Download,
  Save,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Share2,
} from "lucide-react";
import ShareCatalogModal from "./ShareCatalogModal";

// ── Utilities ──────────────────────────────────────────────────────────

function emptyQuestion(type = "multiple-choice") {
  const base = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    question: "",
    type,
  };
  if (type === "text-input" || type === "fill-in-the-blank") {
    return { ...base, answer: "", acceptedAnswers: [] };
  }
  if (type === "true-false") {
    return { ...base, answer: true };
  }
  if (type === "matching") {
    return {
      ...base,
      pairs: [
        { left: "", right: "" },
        { left: "", right: "" },
      ],
    };
  }
  return { ...base, options: ["", "", "", ""], correctAnswerIndex: 0 };
}

function exportCatalog(catalog) {
  const data = catalog.questions.map((q, i) => {
    const type = q.type ?? "multiple-choice";
    const base = { id: q.id ?? i + 1, question: q.question, type };
    if (type === "text-input" || type === "fill-in-the-blank") {
      return {
        ...base,
        answer: q.answer,
        ...(q.acceptedAnswers?.length
          ? { acceptedAnswers: q.acceptedAnswers }
          : {}),
      };
    }
    if (type === "true-false") {
      return { ...base, answer: q.answer };
    }
    if (type === "matching") {
      return { ...base, pairs: q.pairs };
    }
    return {
      ...base,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
    };
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${catalog.name.replace(/[^a-z0-9äöüß ]/gi, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── QuestionEditor ─────────────────────────────────────────────────────

function QuestionEditor({ question, index, onChange, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
        <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-violet-900/50 text-violet-400 text-xs font-bold">
          {index + 1}
        </span>
        <span
          className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
            {
              "multiple-choice":
                "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
              "text-input":
                "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
              "fill-in-the-blank":
                "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
              "true-false":
                "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
              matching:
                "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
            }[question.type ?? "multiple-choice"] ??
            "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
          }`}
        >
          {{
            "multiple-choice": "MC",
            "text-input": "Eingabe",
            "fill-in-the-blank": "Lückentext",
            "true-false": "R / F",
            matching: "Zuordnung",
          }[question.type ?? "multiple-choice"] ?? "MC"}
        </span>
        <span className="flex-1 text-sm text-slate-600 dark:text-slate-400 truncate min-w-0">
          {question.question.trim() || "Neue Frage"}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label={collapsed ? "Aufklappen" : "Einklappen"}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          aria-label="Frage löschen"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Fragentyp
            </label>
            <select
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-colors"
              value={question.type ?? "multiple-choice"}
              onChange={(e) => {
                const t = e.target.value;
                if (t === "text-input" || t === "fill-in-the-blank") {
                  onChange({
                    ...question,
                    type: t,
                    answer: question.answer ?? "",
                    acceptedAnswers: question.acceptedAnswers ?? [],
                  });
                } else if (t === "true-false") {
                  onChange({
                    ...question,
                    type: t,
                    answer:
                      typeof question.answer === "boolean"
                        ? question.answer
                        : true,
                  });
                } else if (t === "matching") {
                  onChange({
                    ...question,
                    type: t,
                    pairs: question.pairs ?? [
                      { left: "", right: "" },
                      { left: "", right: "" },
                    ],
                  });
                } else {
                  onChange({
                    ...question,
                    type: t,
                    options: question.options ?? ["", "", "", ""],
                    correctAnswerIndex: question.correctAnswerIndex ?? 0,
                  });
                }
              }}
            >
              <option value="multiple-choice">Multiple Choice (MC)</option>
              <option value="text-input">Freie Eingabe (Text)</option>
              <option value="fill-in-the-blank">Lückentext (___)</option>
              <option value="true-false">Richtig / Falsch</option>
              <option value="matching">Zuordnung (Matching)</option>
            </select>
          </div>

          {/* Question text */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Fragetext
            </label>
            <textarea
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 resize-none focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-colors"
              rows={2}
              placeholder="Wie lautet die Frage?"
              value={question.question}
              onChange={(e) =>
                onChange({ ...question, question: e.target.value })
              }
            />
          </div>

          {/* Answer section — conditional by type */}
          {question.type === "text-input" ||
          question.type === "fill-in-the-blank" ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Richtige Antwort
                </label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-colors"
                  placeholder="z.B. 42"
                  value={question.answer ?? ""}
                  onChange={(e) =>
                    onChange({ ...question, answer: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Weitere akzeptierte Antworten{" "}
                  <span className="font-normal text-slate-500 dark:text-slate-600">
                    · eine pro Zeile, optional
                  </span>
                </label>
                <textarea
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 resize-none focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-colors"
                  rows={2}
                  placeholder={"zweiundvierzig\nforty-two"}
                  value={(question.acceptedAnswers ?? []).join("\n")}
                  onChange={(e) =>
                    onChange({
                      ...question,
                      acceptedAnswers: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
          ) : question.type === "true-false" ? (
            /* True / False toggle */
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Richtige Antwort
              </label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => onChange({ ...question, answer: val })}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                      question.answer === val
                        ? val
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-500 hover:border-slate-400"
                    }`}
                  >
                    {val ? "Richtig ✓" : "Falsch ✗"}
                  </button>
                ))}
              </div>
            </div>
          ) : question.type === "matching" ? (
            /* Matching pairs editor */
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Paare{" "}
                <span className="font-normal text-slate-500 dark:text-slate-600">
                  · mind. 2
                </span>
              </label>
              <div className="flex flex-col gap-2">
                {(question.pairs ?? []).map((pair, pi) => (
                  <div
                    key={pi}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-colors"
                      placeholder="Begriff"
                      value={pair.left}
                      onChange={(e) => {
                        const next = [...(question.pairs ?? [])];
                        next[pi] = { ...next[pi], left: e.target.value };
                        onChange({ ...question, pairs: next });
                      }}
                    />
                    <span className="text-slate-400 text-sm flex-shrink-0">
                      →
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-colors"
                      placeholder="Antwort"
                      value={pair.right}
                      onChange={(e) => {
                        const next = [...(question.pairs ?? [])];
                        next[pi] = { ...next[pi], right: e.target.value };
                        onChange({ ...question, pairs: next });
                      }}
                    />
                    {(question.pairs ?? []).length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = (question.pairs ?? []).filter(
                            (_, idx) => idx !== pi,
                          );
                          onChange({ ...question, pairs: next });
                        }}
                        className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        aria-label="Paar löschen"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...question,
                      pairs: [
                        ...(question.pairs ?? []),
                        { left: "", right: "" },
                      ],
                    })
                  }
                  className="self-start flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 font-semibold transition-colors mt-1"
                >
                  <Plus size={12} /> Paar hinzufügen
                </button>
              </div>
            </div>
          ) : (
            /* Answer options (MC) */
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Antwortoptionen{" "}
                <span className="font-normal text-slate-500 dark:text-slate-600">
                  · Richtige anklicken
                </span>
              </label>
              <div className="flex flex-col gap-2">
                {(question.options ?? ["", "", "", ""]).map((opt, oi) => (
                  <div
                    key={oi}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ ...question, correctAnswerIndex: oi })
                      }
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        question.correctAnswerIndex === oi
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-600 hover:border-slate-400"
                      }`}
                      aria-label={`Option ${oi + 1} als richtig markieren`}
                    >
                      {question.correctAnswerIndex === oi && (
                        <span className="text-white text-[10px] leading-none">
                          ✓
                        </span>
                      )}
                    </button>
                    <input
                      type="text"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-colors"
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [
                          ...(question.options ?? ["", "", "", ""]),
                        ];
                        newOpts[oi] = e.target.value;
                        onChange({ ...question, options: newOpts });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CatalogEditor ──────────────────────────────────────────────────────

function CatalogEditor({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [questions, setQuestions] = useState(
    initial?.questions?.length ? initial.questions : [emptyQuestion()],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const QUESTIONS_PER_PAGE = 5;

  const totalPages = Math.max(
    1,
    Math.ceil(questions.length / QUESTIONS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(
    startIndex,
    startIndex + QUESTIONS_PER_PAGE,
  );

  function handleAddQuestion() {
    setQuestions((qs) => {
      const newQs = [...qs, emptyQuestion()];
      setCurrentPage(Math.ceil(newQs.length / QUESTIONS_PER_PAGE));
      return newQs;
    });
    // Scroll to bottom after render
    setTimeout(() => window.scrollTo({ top: 999999, behavior: "smooth" }), 50);
  }

  function handleChangeQuestion(index, updated) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? updated : q)));
  }

  function handleDeleteQuestion(index) {
    setQuestions((qs) => qs.filter((_, i) => i !== index));
  }

  const canSave =
    name.trim().length > 0 &&
    questions.length > 0 &&
    questions.every((q) => {
      if (!q.question.trim()) return false;
      const type = q.type ?? "multiple-choice";
      if (type === "text-input" || type === "fill-in-the-blank") {
        return typeof q.answer === "string" && q.answer.trim().length > 0;
      }
      if (type === "true-false") {
        return typeof q.answer === "boolean";
      }
      if (type === "matching") {
        return (
          Array.isArray(q.pairs) &&
          q.pairs.length >= 2 &&
          q.pairs.every(
            (p) =>
              typeof p.left === "string" &&
              p.left.trim().length > 0 &&
              typeof p.right === "string" &&
              p.right.trim().length > 0,
          )
        );
      }
      return (
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.options.every((o) => typeof o === "string" && o.trim().length > 0)
      );
    });

  return (
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Abbrechen"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex-1">
          {initial ? "Katalog bearbeiten" : "Neuer Katalog"}
        </h2>
        {initial && (
          <button
            type="button"
            onClick={() =>
              exportCatalog({
                ...initial,
                name: name.trim() || initial.name,
                questions,
              })
            }
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => canSave && onSave({ name: name.trim(), questions })}
          disabled={!canSave}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            canSave
              ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          <Save size={14} />
          Speichern
        </button>
      </div>

      {/* Catalog name */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Katalogname
        </label>
        <input
          type="text"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-colors font-semibold"
          placeholder="z.B. JavaScript Grundlagen"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoFocus
        />
      </div>

      {/* Questions */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Fragen ({questions.length})
        </span>
        <button
          type="button"
          onClick={handleAddQuestion}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          <Plus size={13} />
          Hinzufügen
        </button>
      </div>

      <div className="flex flex-col gap-3 pb-8">
        {currentQuestions.map((q, i) => {
          const globalIndex = startIndex + i;
          return (
            <QuestionEditor
              key={q.id}
              question={q}
              index={globalIndex}
              onChange={(updated) => handleChangeQuestion(globalIndex, updated)}
              onDelete={() => handleDeleteQuestion(globalIndex)}
            />
          );
        })}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Vorherige Seite"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Seite {safePage} von {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Nächste Seite"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleAddQuestion}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm text-slate-500 hover:border-violet-600 hover:text-violet-400 transition-colors"
        >
          <Plus size={15} />
          Weitere Frage hinzufügen
        </button>
      </div>
    </div>
  );
}

// ── CatalogManager (list) ──────────────────────────────────────────────

export default function CatalogManager({
  catalogs,
  onUpdate,
  onDelete,
  onBack,
}) {
  const [editing, setEditing] = useState(null); // null | 'new' | catalogId
  const [confirmDelete, setConfirmDelete] = useState(null); // null | catalogId
  const [sharingCatalog, setSharingCatalog] = useState(null); // null | catalog

  const editingCatalog =
    editing && editing !== "new"
      ? (catalogs.find((c) => c.id === editing) ?? null)
      : null;

  function handleSave({ name, questions }) {
    if (editing === "new") {
      onUpdate(null, { name, questions });
    } else {
      onUpdate(editing, { name, questions });
    }
    setEditing(null);
  }

  // Editor view
  if (editing !== null) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 pt-2 pb-[env(safe-area-inset-bottom,24px)]">
        <CatalogEditor
          initial={editingCatalog}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-2 pb-[env(safe-area-inset-bottom,24px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex-1">
          Kataloge verwalten
        </h1>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Plus size={14} />
          Neu
        </button>
      </div>

      {/* Empty state */}
      {catalogs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <p className="font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Keine Kataloge vorhanden
          </p>
          <p className="text-sm text-slate-600">
            Erstelle deinen ersten Katalog mit dem Button oben.
          </p>
        </motion.div>
      )}

      {/* Catalog list */}
      <motion.ul
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05 } },
        }}
        className="flex flex-col gap-3"
      >
        {catalogs.map((catalog) => (
          <motion.li
            key={catalog.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
            }}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {catalog.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{catalog.questions.length} Fragen</span>
                  {catalog.lastUsed && (
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-600">
                      <TrendingUp size={10} />
                      Zuletzt geübt
                    </span>
                  )}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setSharingCatalog(catalog)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-violet-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Katalog teilen"
                >
                  <Share2 size={15} />
                </button>
                <button
                  onClick={() => exportCatalog(catalog)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-violet-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Als JSON herunterladen"
                >
                  <Download size={15} />
                </button>
                <button
                  onClick={() => setEditing(catalog.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Bearbeiten"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setConfirmDelete(catalog.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                  title="Löschen"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      {/* Share modal */}
      <AnimatePresence>
        {sharingCatalog && (
          <ShareCatalogModal
            catalog={sharingCatalog}
            onClose={() => setSharingCatalog(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-[env(safe-area-inset-bottom,24px)] sm:pb-0"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl px-6 py-7 shadow-2xl"
            >
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                Katalog löschen?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  „{catalogs.find((c) => c.id === confirmDelete)?.name}"
                </span>{" "}
                wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig
                gemacht werden.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    onDelete(confirmDelete);
                    setConfirmDelete(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                >
                  Löschen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
