# International review experience

A dependency-free storefront prototype for testing a multilingual customer-review experience. The interface and seeded reviews support English, French, German, and Spanish.

The browser application lives entirely under `frontend/`, leaving the repository root available for the upcoming Terraform infrastructure.

## Run locally

The page fetches JSON files, so serve it over HTTP rather than opening `index.html` directly:

```bash
npm --prefix frontend start
```

Open the local URL printed by the command.

## Validate

```bash
npm run check
```

The validation checks JavaScript syntax plus the structure and language coverage of the demo data.

## Demo data

- `frontend/data/reviews.json` contains synthetic reviews and their demo translations.
- `frontend/data/translations.json` contains interface copy.
- Reviews submitted through the form are stored only in browser `localStorage`; they do not modify the fixture files or leave the browser.

## GitLab Pages

The GitLab pipeline validates every branch. On the default branch, it also copies the static site into a `public` artifact and deploys it to GitLab Pages.
