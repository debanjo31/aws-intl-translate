const SUPPORTED_LANGUAGES = ["en", "fr", "de", "es"];
const LANGUAGE_NAMES = { en: "English", fr: "français", de: "Deutsch", es: "español" };
const STORAGE_KEY = "atelier-demo-reviews";

const state = {
  language: "en",
  rating: "all",
  reviews: [],
  translations: {},
};

const elements = {
  reviewsList: document.querySelector("#reviews-list"),
  reviewTemplate: document.querySelector("#review-template"),
  emptyState: document.querySelector("#empty-state"),
  visibleCount: document.querySelector("#visible-count"),
  form: document.querySelector("#review-form"),
  formStatus: document.querySelector("#form-status"),
  ratingBreakdown: document.querySelector("#rating-breakdown"),
};

function getSavedReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function translatePage() {
  const copy = state.translations[state.language];
  document.documentElement.lang = state.language;
  document.title = `${copy.productName} — ${copy.reviewsHeading}`;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = copy[element.dataset.i18n];
    if (value) element.textContent = value;
  });

  document.querySelectorAll(".language-button").forEach((button) => {
    const active = button.dataset.language === state.language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function getReviewCopy(review) {
  return review.translations[state.language] || review.translations[review.sourceLanguage];
}

function formatDate(date) {
  return new Intl.DateTimeFormat(state.language, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function renderReview(review) {
  const fragment = elements.reviewTemplate.content.cloneNode(true);
  const copy = getReviewCopy(review);
  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const article = fragment.querySelector("article");
  const date = fragment.querySelector("time");

  article.dataset.reviewId = review.id;
  article.setAttribute(
    "aria-label",
    `${state.translations[state.language].starsLabel.replace("{rating}", review.rating)}: ${copy.title}`,
  );
  fragment.querySelector(".review-card__stars").textContent = stars;
  fragment.querySelector(".review-card__title").textContent = copy.title;
  fragment.querySelector(".review-card__body").textContent = copy.body;
  fragment.querySelector(".review-card__author").textContent = review.author;
  fragment.querySelector(".verified-badge").hidden = !review.verified;
  fragment.querySelector(".verified-badge").textContent = state.translations[state.language].verified;
  date.dateTime = review.date;
  date.textContent = formatDate(review.date);

  if (!review.translations[state.language]) {
    const label = fragment.querySelector(".original-language");
    label.hidden = false;
    label.textContent = state.translations[state.language].originalLanguage.replace(
      "{language}",
      LANGUAGE_NAMES[review.sourceLanguage],
    );
  }

  return fragment;
}

function renderBreakdown() {
  const total = state.reviews.length || 1;
  elements.ratingBreakdown.replaceChildren();

  for (let rating = 5; rating >= 1; rating -= 1) {
    const count = state.reviews.filter((review) => review.rating === rating).length;
    const row = document.createElement("div");
    row.className = "rating-row";

    const label = document.createElement("span");
    label.textContent = String(rating);
    const track = document.createElement("div");
    track.className = "rating-row__track";
    const fill = document.createElement("div");
    fill.className = "rating-row__fill";
    fill.style.width = `${(count / total) * 100}%`;
    track.append(fill);
    const countLabel = document.createElement("span");
    countLabel.textContent = String(count);

    row.append(label, track, countLabel);
    elements.ratingBreakdown.append(row);
  }
}

function renderReviews() {
  const filtered = state.rating === "all"
    ? state.reviews
    : state.reviews.filter((review) => review.rating === Number(state.rating));

  elements.reviewsList.replaceChildren(...filtered.map(renderReview));
  elements.visibleCount.textContent = String(filtered.length);
  elements.emptyState.hidden = filtered.length !== 0;

  const average = state.reviews.reduce((sum, review) => sum + review.rating, 0) / state.reviews.length;
  const averageText = average.toFixed(1);
  document.querySelector("#average-rating-large").textContent = averageText;
  document.querySelector("#review-total-large").textContent = String(state.reviews.length);

  renderBreakdown();
}

function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) return;
  state.language = language;
  localStorage.setItem("atelier-language", language);
  translatePage();
  renderReviews();
}

function setRating(rating) {
  state.rating = rating;
  document.querySelectorAll(".filter-button").forEach((button) => {
    const active = button.dataset.rating === rating;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderReviews();
}

function addReview(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const review = {
    id: `local-${Date.now()}`,
    author: formData.get("name").trim(),
    rating: Number(formData.get("rating")),
    date: new Date().toISOString().slice(0, 10),
    verified: false,
    sourceLanguage: state.language,
    translations: {
      [state.language]: {
        title: formData.get("title").trim(),
        body: formData.get("body").trim(),
      },
    },
  };

  const savedReviews = getSavedReviews();
  savedReviews.unshift(review);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedReviews));
  state.reviews.unshift(review);
  elements.form.reset();
  elements.formStatus.textContent = state.translations[state.language].success;
  setRating("all");
  document.querySelector("#reviews").scrollIntoView({ behavior: "smooth" });
}

async function initialise() {
  try {
    const [reviewsResponse, translationsResponse] = await Promise.all([
      fetch("data/reviews.json"),
      fetch("data/translations.json"),
    ]);

    if (!reviewsResponse.ok || !translationsResponse.ok) throw new Error("Unable to load demo data");

    const [seedReviews, translations] = await Promise.all([
      reviewsResponse.json(),
      translationsResponse.json(),
    ]);

    state.reviews = [...getSavedReviews(), ...seedReviews];
    state.translations = translations;
    state.language = SUPPORTED_LANGUAGES.includes(localStorage.getItem("atelier-language"))
      ? localStorage.getItem("atelier-language")
      : "en";

    document.querySelectorAll(".language-button").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.language));
    });
    document.querySelectorAll(".filter-button").forEach((button) => {
      button.addEventListener("click", () => setRating(button.dataset.rating));
    });
    elements.form.addEventListener("submit", addReview);

    translatePage();
    renderReviews();
  } catch (error) {
    console.error(error);
    elements.reviewsList.textContent = "The demo data could not be loaded. Run this page through a local web server.";
  }
}

initialise();
