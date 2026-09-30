import { readFile } from "node:fs/promises";

const supportedLanguages = ["en", "fr", "de", "es"];
const reviews = JSON.parse(await readFile(new URL("../data/reviews.json", import.meta.url), "utf8"));
const translations = JSON.parse(await readFile(new URL("../data/translations.json", import.meta.url), "utf8"));

if (!Array.isArray(reviews) || reviews.length === 0) throw new Error("reviews.json must contain reviews");

const ids = new Set();
for (const review of reviews) {
  if (!review.id || ids.has(review.id)) throw new Error(`Invalid or duplicate review id: ${review.id}`);
  ids.add(review.id);
  if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
    throw new Error(`Review ${review.id} has an invalid rating`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.date)) throw new Error(`Review ${review.id} has an invalid date`);
  if (!supportedLanguages.includes(review.sourceLanguage)) throw new Error(`Review ${review.id} has an unsupported source language`);

  for (const language of supportedLanguages) {
    const copy = review.translations?.[language];
    if (!copy?.title?.trim() || !copy?.body?.trim()) {
      throw new Error(`Review ${review.id} is missing ${language} copy`);
    }
  }
}

const requiredTranslationKeys = Object.keys(translations.en);
for (const language of supportedLanguages) {
  if (!translations[language]) throw new Error(`Missing ${language} interface translations`);
  for (const key of requiredTranslationKeys) {
    if (!translations[language][key]) throw new Error(`Missing ${language}.${key}`);
  }
}

console.log(`Validated ${reviews.length} reviews across ${supportedLanguages.length} languages.`);
