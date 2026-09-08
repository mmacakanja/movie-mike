# Movie Mike — Version 6

Version 6 preserves the complete Version 5 site and adds a front-page Telluride Film Festival 2026 feature plus a clearer explanation of Movie Mike's five-category philosophy.

## New in Version 6

- A special **TELLURIDE FILM FESTIVAL 2026** section sits immediately below the main hero.
- The feature uses CSS-drawn mountain / night-sky artwork, so no additional image files or image hosting are required.
- The festival block includes a direct link to the Telluride Film Festival website and Mike's festival observations.
- Six festival standouts are highlighted with current U.S. release information:
  - A Long Winter — U.S. date TBA
  - Elsinore — November 20, 2026
  - Fjord — October 9, 2026
  - Wild Horse Nine — November 6, 2026
  - Tenzing — October 9 in select theaters; October 16 on Apple TV
  - The Only Living Pickpocket in New York — October 23, 2026 (limited)
- The homepage hero now leads with:
  - “We see movies for five different reasons.”
  - “The parts matter more than the total score…”
  - “…But the scores do matter.”
- The Method section now contains individual cards explaining all five dimensions.

## Preserved from Version 5

- Larger, high-contrast navigation.
- Clickable genre buttons that filter the movie index.
- Mike-vs-Metacritic disagreements split into two columns.
- Visiting Columnist section driven by `columnist.js`.
- Collapsible Owner Tools box.
- Permanent Neon TMDB and critic-score caches.
- Newest Comments.
- Live Google Sheet read/write bridge.
- Rating colors and black category numerals.

## Deployment

Keep the folder structure intact. The repository root should contain `index.html`, `app.js`, `styles.css`, `data.js`, `columnist.js`, `package.json`, `vercel.json`, `README.md`, and `PATCH-NOTES.txt`. The `api/` folder contains the serverless functions.

Replace the current repository contents with these V6 files and commit to the production branch. If GitHub is connected to Vercel, Vercel should deploy automatically.

No new Vercel environment variables are required for V6.
