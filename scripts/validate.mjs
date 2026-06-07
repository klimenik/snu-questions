#!/usr/bin/env node
// Zero-dependency validator for the question bank.
// Checks manifest integrity and every quiz file against the expected shape.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let errors = 0;
const fail = (msg) => {
  errors++;
  console.error("  ✗ " + msg);
};

const readJson = (relPath) => {
  const full = join(root, relPath);
  try {
    return JSON.parse(readFileSync(full, "utf8"));
  } catch (e) {
    fail(`Cannot read/parse ${relPath}: ${e.message}`);
    return null;
  }
};

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const TYPES = new Set(["single", "multi"]);

function validateQuiz(relPath, expectedCount) {
  console.log(`\nQuiz: ${relPath}`);
  const quiz = readJson(relPath);
  if (!quiz) return;

  if (!quiz.id) fail("missing quiz.id");
  if (!quiz.title) fail("missing quiz.title");
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    fail("questions must be a non-empty array");
    return;
  }

  if (expectedCount != null && quiz.questions.length !== expectedCount) {
    fail(`manifest questionCount (${expectedCount}) != actual (${quiz.questions.length})`);
  }

  const ids = new Set();
  quiz.questions.forEach((q, i) => {
    const tag = `Q[${i}]${q.id ? " " + q.id : ""}`;
    if (!q.id) fail(`${tag}: missing id`);
    else if (ids.has(q.id)) fail(`${tag}: duplicate id`);
    else ids.add(q.id);

    if (!TYPES.has(q.type)) fail(`${tag}: invalid type "${q.type}"`);
    if (q.difficulty && !DIFFICULTIES.has(q.difficulty))
      fail(`${tag}: invalid difficulty "${q.difficulty}"`);
    if (!q.prompt) fail(`${tag}: missing prompt`);

    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      fail(`${tag}: needs at least 2 choices`);
      return;
    }
    const keys = new Set();
    q.choices.forEach((c, ci) => {
      if (!c.key) fail(`${tag}: choice[${ci}] missing key`);
      else if (keys.has(c.key)) fail(`${tag}: duplicate choice key "${c.key}"`);
      else keys.add(c.key);
      if (!c.text) fail(`${tag}: choice "${c.key}" missing text`);
    });

    if (!Array.isArray(q.correct) || q.correct.length < 1) {
      fail(`${tag}: correct must list at least one key`);
    } else {
      q.correct.forEach((k) => {
        if (!keys.has(k)) fail(`${tag}: correct key "${k}" is not a choice`);
      });
      if (q.type === "single" && q.correct.length !== 1)
        fail(`${tag}: type=single must have exactly 1 correct answer`);
      if (q.type === "multi" && q.correct.length < 2)
        fail(`${tag}: type=multi should have 2+ correct answers`);
    }
  });

  if (errors === 0) console.log(`  ✓ ${quiz.questions.length} questions OK`);
}

console.log("Validating question bank...");
const manifest = readJson("manifest.json");
if (manifest) {
  if (!Array.isArray(manifest.courses)) fail("manifest.courses must be an array");
  else {
    for (const course of manifest.courses) {
      if (!course.id) fail("a course is missing id");
      if (!Array.isArray(course.quizzes)) {
        fail(`course ${course.id}: quizzes must be an array`);
        continue;
      }
      for (const quiz of course.quizzes) {
        if (!quiz.path) {
          fail(`course ${course.id}: a quiz is missing path`);
          continue;
        }
        validateQuiz(quiz.path, quiz.questionCount);
      }
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} error(s) found.`);
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
