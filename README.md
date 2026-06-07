# ServiceNow University Question Bank

Structured JSON question sets for ServiceNow University courses, consumed by the
[PrepNow](https://github.com/klimenik/prepnow) quiz app. The format is generic, so any
multiple-choice course content can live here.

## Structure

```
manifest.json              # index of all courses and their quizzes
schema/quiz.schema.json    # JSON Schema (draft-07) for a quiz file
courses/<course>/          # one folder per course
  course.json              # course metadata + module list
  <quiz>.json              # one file per quiz/module
```

- **`manifest.json`** is the entry point the app fetches first. It lists every course and,
  per course, the available quizzes with their relative `path` and `questionCount`.
- Each **quiz file** conforms to `schema/quiz.schema.json`.

## Courses

| Course | Title | Quizzes |
|---|---|---|
| `cad` | Certified Application Developer (CAD) | Module 1 |

## Quiz file format

```json
{
  "id": "cad-module-1",
  "course": "cad",
  "title": "Module 1: Application Development Overview",
  "description": "...",
  "questions": [
    {
      "id": "q1",
      "type": "single",            // "single" or "multi"
      "difficulty": "easy",        // easy | medium | hard
      "prompt": "Question text (Markdown allowed).",
      "choices": [
        { "key": "A", "text": "..." },
        { "key": "B", "text": "..." }
      ],
      "correct": ["B"],            // one key for single, multiple for multi
      "explanation": "Shown after submit (Markdown allowed)."
    }
  ]
}
```

## Adding content

1. Create or edit a quiz file under `courses/<course>/`, following the schema.
2. Register the course and quiz in `manifest.json` (set the correct `path` and `questionCount`).
3. Validate: `npm run validate` (requires Node.js).
4. Commit and push. GitHub Pages serves the files so the app fetches the latest content.

## Hosting

This repo is published via GitHub Pages, so the app can fetch
`https://klimenik.github.io/servicenow-university-questions/manifest.json` directly.
