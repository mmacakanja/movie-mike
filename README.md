# Movie Mike — Version 6.2

Version 6.2 preserves Version 6 and upgrades the Telluride section so it behaves like the rest of Movie Mike instead of being a static promo block.

## New in Version 6.2

- The Telluride feature now uses a **real background photo** (`telluride-main-street.jpg`) supplied by Mike.
- The Telluride copy now includes the updated Oscar-race paragraph:
  - “The Oscar race is on! I’m looking at John Malkovich, Sandra Hüller, Andrew Scott, John Turturro, and others. I spoke to some of them today (7 Sept); they’re all self-deprecating but we know they want (and deserve) the recognition!”
- The six Telluride standouts are now rendered dynamically in `app.js`.
- Each Telluride card now tries to use the **same TMDB metadata and critic pipeline** as the rest of the site.
- When a Telluride title exists in your ratings data, the card can now show:
  - poster art
  - Metacritic
  - Mike aggregate score
  - a clickable button that opens the standard Movie Mike detail dialog
- Added title alias handling for **The Last Living Pickpocket in New York** and **The Only Living Pickpocket in New York**.

## Important note about clickability

The Telluride cards become fully clickable only when those titles exist in Movie Mike's ratings data.

That means either:

1. the title is present in the bundled `data.js`, or
2. the title is present in the live Google Sheet that `/api/sheet` reads.

All six featured films are expected to resolve against the live Google Sheet. Version 6.2 uses forgiving title matching so minor naming variations in the Sheet do not prevent the cards from linking to Mike’s ratings.

## Preserved from Version 6

- Hero philosophy copy about the five reasons we see movies.
- Expanded Method section with five category explanations.
- Clickable genres.
- Mike vs. Metacritic split view.
- Visiting Columnist.
- Newest Comments.
- Live Google Sheet read/write bridge.
- Compact Owner Tools.
- TMDB / critic cache behavior.

## Deployment

Keep the folder structure intact. The repository root should contain:

- `index.html`
- `app.js`
- `styles.css`
- `data.js`
- `columnist.js`
- `package.json`
- `vercel.json`
- `README.md`
- `PATCH-NOTES.txt`
- `telluride-main-street.jpg`
- `api/` folder

Replace the current repository contents with these Version 6.2 files and commit to the production branch. If GitHub is connected to Vercel, Vercel should deploy automatically.

No new Vercel environment variables are required for Version 6.2.
