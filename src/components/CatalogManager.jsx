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
  TrendingUp,
} from "lucide-react";

// ── Utilities ──────────────────────────────────────────────────────────

function emptyQuestion() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    question: "",
    options: ["", "", "", ""],
    correctAnswerIndex: 0,
  };
}

function exportCatalog(catalog) {
  const data = catalog.questions.map((q, i) => ({
    id: q.id ?? i + 1,
    question: q.question,
    options: q.options,
    correctAnswerIndex: q.correctAnswerIndex,
  }));
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

          {/* Answer options */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Antwortoptionen{" "}
              <span className="font-normal text-slate-500 dark:text-slate-600">
                · Richtige anklicken
              </span>
            </label>
            <div className="flex flex-col gap-2">
              {question.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
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
                      const newOpts = [...question.options];
                      newOpts[oi] = e.target.value;
                      onChange({ ...question, options: newOpts });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
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

  function handleAddQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()]);
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
    questions.every(
      (q) =>
        q.question.trim() &&
        q.options.length === 4 &&
        q.options.every((o) => o.trim()),
    );

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
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            onChange={(updated) => handleChangeQuestion(i, updated)}
            onDelete={() => handleDeleteQuestion(i)}
          />
        ))}

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

export default function CatalogManager({ catalogs, onUpdate, onDelete, onBack }) {
  const [editing, setEditing] = useState(null); // null | 'new' | catalogId
  const [confirmDelete, setConfirmDelete] = useState(null); // null | catalogId

  const editingCatalog =
    editing && editing !== "new"
      ? catalogs.find((c) => c.id === editing) ?? null
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
