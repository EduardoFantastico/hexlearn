import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookPlus,
  Play,
  BarChart2,
  Sparkles,
  Copy,
  Check,
  Upload,
  Pencil,
  QrCode,
} from "lucide-react";

const STEPS = [
  {
    icon: BookPlus,
    title: "Katalog erstellen",
    desc: (
      <>
        Klicke auf{" "}
        <strong className="text-slate-700 dark:text-slate-300">
          „Katalog manuell erstellen"
        </strong>{" "}
        um Fragen direkt im Editor einzugeben. Oder nutze{" "}
        <strong className="text-slate-700 dark:text-slate-300">
          „Katalog importieren"
        </strong>{" "}
        – dort kannst du eine JSON-Datei hochladen oder JSON direkt einfügen.
      </>
    ),
  },
  {
    icon: Play,
    title: "Lernmodus starten",
    desc: (
      <>
        Wähle auf dem Dashboard einen oder mehrere Kataloge aus und drücke{" "}
        <strong className="text-slate-700 dark:text-slate-300">
          „Lernen starten"
        </strong>
        . Du kannst die Fragenanzahl festlegen. HexLearn zeigt Fragen mit
        höherer Fehlerquote automatisch häufiger.
      </>
    ),
  },
  {
    icon: BarChart2,
    title: "Fortschritt verfolgen",
    desc: (
      <>
        Nach jeder Runde siehst du eine detaillierte Auswertung. Das Dashboard
        zeigt deinen{" "}
        <strong className="text-slate-700 dark:text-slate-300">Streak</strong>,
        den{" "}
        <strong className="text-slate-700 dark:text-slate-300">
          Wochenüberblick
        </strong>{" "}
        und wie viele Fragen du je Katalog bereits gemeistert hast.
      </>
    ),
  },
];

const CATALOG_TYPES = [
  {
    icon: Pencil,
    label: "Manuell",
    desc: "Fragen direkt im Editor eingeben",
  },
  {
    icon: Upload,
    label: "JSON-Import",
    desc: "Fertige Katalog-Datei hochladen",
  },
  {
    icon: Sparkles,
    label: "KI-generiert",
    desc: "Prompt nutzen → JSON importieren",
  },
  {
    icon: QrCode,
    label: "QR-Code",
    desc: "Katalog kontaktlos von Freunden übernehmen",
  },
];

const AI_PROMPT = `Erstelle mir einen HexLearn-Lernkatalog als JSON-Array zum Thema [THEMA].

Verwende folgende Fragetypen (mix):
- "multiple-choice": Frage mit options-Array und correctAnswerIndex (0-basiert)
- "true-false": Frage mit answer: true oder false
- "text-input": Frage mit answer (String) und optional acceptedAnswers-Array
- "fill-in-the-blank": Satz mit ___ als Lücke, answer als Lösung

Erstelle mindestens 10 Fragen. Gib NUR das JSON-Array zurück, ohne Erklärungen.

Beispielformat:
[
  { "id": 1, "type": "multiple-choice", "question": "...", "options": ["A","B","C"], "correctAnswerIndex": 0 },
  { "id": 2, "type": "true-false", "question": "...", "answer": true },
  { "id": 3, "type": "text-input", "question": "...", "answer": "..." },
  { "id": 4, "type": "fill-in-the-blank", "question": "Die ___ ist ...", "answer": "..." }
]`;

export default function Tutorial({ onBack }) {
  const [promptCopied, setPromptCopied] = useState(false);

  function copyPrompt() {
    navigator.clipboard.writeText(AI_PROMPT).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto px-4 pt-4 pb-16">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6 -ml-1 self-start"
      >
        <ArrowLeft size={15} />
        Zurück
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-10"
      >
        {/* ── Section 1: How it works ─────────────────────────── */}
        <section>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
            Wie funktioniert HexLearn?
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            In drei Schritten vom Katalog zur Lernrunde.
          </p>

          <div className="flex flex-col gap-3">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex gap-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4"
              >
                <div className="flex-shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <Icon
                      size={15}
                      className="text-violet-600 dark:text-violet-400"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-violet-400 dark:text-violet-500 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    {title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 2: Catalog options ──────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            Katalog einspeisen
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Es gibt drei Wege, um Lerninhalte hinzuzufügen.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {CATALOG_TYPES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <Icon
                    size={14}
                    className="text-violet-600 dark:text-violet-400"
                  />
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {label}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: QR-Code Sharing ──────────────────────── */}
        <section>
          <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/60 dark:bg-violet-950/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <QrCode
                  size={13}
                  className="text-violet-600 dark:text-violet-400"
                />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Kataloge kontaktlos teilen
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Du kannst jeden Katalog per QR-Code an Freunde weitergeben –{" "}
              <strong className="text-slate-600 dark:text-slate-300">
                ohne Dateien zu verschicken
              </strong>
              . Einfach QR-Code zeigen, scannen, fertig.
            </p>

            <ol className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 list-decimal list-inside space-y-1.5 pl-1">
              <li>
                Öffne{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  „Kataloge verwalten"
                </strong>{" "}
                und klicke neben einem Katalog auf das{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  Teilen-Symbol
                </strong>
                .
              </li>
              <li>
                Wähle, wie lange der QR-Code gültig sein soll (max.{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  10 Minuten
                </strong>
                ), und klicke auf{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  „QR-Code generieren"
                </strong>
                .
              </li>
              <li>
                Zeige den QR-Code deinen Freunden – oder drücke{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  „Vollbild"
                </strong>{" "}
                für maximale Lesbarkeit.
              </li>
              <li>
                Deine Freunde öffnen HexLearn, wählen{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  „QR-Code"
                </strong>{" "}
                in der Importsektion und scannen den Code.
              </li>
            </ol>

            <div className="flex gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-3 py-2.5">
              <QrCode
                size={13}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                Die Daten werden nur für max.{" "}
                <strong>10 Minuten zwischengespeichert</strong> und danach
                automatisch gelöscht. Kein Account, keine dauerhafte
                Speicherung.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4: AI ───────────────────────────────────── */}
        <section>
          <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/60 dark:bg-violet-950/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Sparkles
                  size={13}
                  className="text-violet-600 dark:text-violet-400"
                />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Katalog mit KI erstellen
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-1">
              Du hast ein Thema, aber keine Zeit Fragen zu schreiben? Nutze
              einfach ChatGPT, Gemini oder ein anderes KI-Tool:
            </p>

            <ol className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 list-decimal list-inside space-y-1 pl-1">
              <li>
                Kopiere den Prompt unten und ersetze{" "}
                <code className="bg-slate-200 dark:bg-slate-700 rounded px-1 text-[10px]">
                  [THEMA]
                </code>{" "}
                durch dein Lernthema.
              </li>
              <li>Füge den Prompt in ChatGPT / Gemini ein und sende ihn ab.</li>
              <li>Kopiere die Antwort der KI.</li>
              <li>
                Öffne auf der Startseite{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  „Katalog importieren"
                </strong>{" "}
                und wechsle zum Tab{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  „JSON einfügen"
                </strong>{" "}
                – füge den Inhalt direkt ein und klicke auf{" "}
                <strong className="text-slate-600 dark:text-slate-300">
                  „Katalog importieren"
                </strong>
                .
              </li>
            </ol>

            {/* Prompt box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  KI-Prompt
                </span>
                <button
                  onClick={copyPrompt}
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${
                    promptCopied
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                  }`}
                >
                  {promptCopied ? <Check size={11} /> : <Copy size={11} />}
                  {promptCopied ? "Kopiert!" : "Kopieren"}
                </button>
              </div>
              <pre className="text-[11px] text-violet-600 dark:text-violet-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {AI_PROMPT}
              </pre>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
              Tipp: Bitte die KI ausdrücklich, <em>nur</em> das JSON-Array
              zurückzugeben – ohne Einleitung oder Erklärungen. So lässt sich
              die Datei direkt importieren.
            </p>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
