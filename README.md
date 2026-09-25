# Pure Prep

Cozy plant-y meal planning: Dashboard → onboarding questionnaire → daily plan, micros, and estimated grocery list (Walmart-style prices; no live API yet).

## Screens
- **Home** — welcome by time of day, week-at-a-glance (hollow macro pie), inventory & schedule panels
- **Inventory** — confirm groceries ordered; depletes on selected plan weekdays
- **Schedule** — month calendar with coverage + next order date
- **Profile** — your onboarding questionnaire answers (budget, cadence, calories, weight goal/macros, meals, **day checkboxes**), editable with a Save button. The questionnaire itself runs only once (first visit). Saved profile changes apply only to meal plans scheduled afterwards; each scheduled plan block keeps a snapshot of the settings it was generated with.

## Docs
Snapshots from the Google Drive Meal Plan Project live in `docs/` (`onboarding.txt`, `meal-templates.txt`, `overview.txt`, `dashboard.txt`).

## Local
Open `index.html` or use GitHub Pages: https://leyuh.github.io/pure-prep/

`onboarding.js` holds planning logic; the page shell is `index.html`.

## Brand
App icon: Leaf P monogram (`assets/icon.png`, also `assets/logo.png`). Favicons in `assets/`.
