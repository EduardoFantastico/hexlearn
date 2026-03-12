# HexLearn

A browser-based flashcard app for self-directed learning. All data is stored locally in `localStorage` — no account, no server, no tracking.

## Features

- Five question types: multiple choice, true/false, text input, fill-in-the-blank, matching
- Weighted question order based on individual error rate
- Learning statistics with streak tracking and weekly chart
- JSON catalog import via file upload or direct paste
- AI-assisted catalog generation (prompt included in the app)
- Dark and light mode

## Tech Stack

- Vite + React 19
- Tailwind CSS 3 (dark mode via class strategy)
- framer-motion, lucide-react

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Catalog Format

Catalogs are JSON arrays. Each item requires at least `id` (number) and `question` (string), plus type-specific fields:

```json
[
  {
    "id": 1,
    "type": "multiple-choice",
    "question": "...",
    "options": ["A", "B", "C"],
    "correctAnswerIndex": 0
  },
  { "id": 2, "type": "true-false", "question": "...", "answer": true },
  { "id": 3, "type": "text-input", "question": "...", "answer": "..." },
  {
    "id": 4,
    "type": "fill-in-the-blank",
    "question": "The ___ is ...",
    "answer": "..."
  },
  {
    "id": 5,
    "type": "matching",
    "question": "...",
    "pairs": [{ "left": "A", "right": "1" }]
  }
]
```

Catalogs can be imported via the app's built-in paste importer or by uploading a `.json` file. An example file is available at `public/example-questions.json`.

## Privacy

All data stays on the user's device. The optional HexShare feature temporarily transfers a catalog to Vercel Blob (max. 10 minutes, auto-deleted). No tracking, no analytics. Crawling is disallowed via `robots.txt`.

## License

[Business Source License 1.1](LICENSE) — free for personal and non-commercial use. Commercial use requires a separate agreement with the author. Converts to MIT on 2030-03-12.
