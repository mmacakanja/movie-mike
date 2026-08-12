# Movie Mike — Version 2

A deployable prototype generated from `Movie Mike.xlsx`.

## What's new
- 358 unique movie titles; duplicate spreadsheet titles remain removed.
- Rating philosophy rewritten around five dimensions and a normal 0–7 component scale.
- 7 = outstanding / best-in-class; 8 is a deliberately rare exception for work that establishes a new standard.
- Aggregate score distribution uses integer bands only.
- Real movie metadata integration via TMDB: posters, year, runtime, genres, director, cast and overview.
- Filter by genre and sort by genre or release year.
- Search extends to director and cast once metadata is loaded.
- Movie detail view combines Movie Mike ratings with conventional metadata.

## Important: metadata requires one free TMDB credential
TMDB requires API authentication. The site keeps the credential server-side in a Vercel Function so visitors never need your token.

1. Create/sign in to a TMDB account.
2. In TMDB account settings, request API access and copy the **API Read Access Token**.
3. Deploy this project to Vercel.
4. In Vercel: Project → Settings → Environment Variables.
5. Add:
   - Name: `TMDB_READ_TOKEN`
   - Value: your TMDB API Read Access Token
6. Redeploy the project.

The `/api/tmdb.js` Vercel Function searches TMDB by title, retrieves movie details and credits, and returns only the fields the site needs. Responses are cached at Vercel's edge for one week; the browser also caches metadata locally.

## Deploying Version 2
Because Version 2 includes a server-side API function, GitHub → Vercel is the cleanest deployment route:

1. Create a new GitHub repository (for example `movie-mike`).
2. Upload the *contents* of this folder to the repository root.
3. In Vercel choose **Add New → Project** and import the GitHub repository.
4. Deploy with the default settings.
5. Add `TMDB_READ_TOKEN` under Settings → Environment Variables.
6. Redeploy.

You can also use the Vercel CLI. Plain local double-clicking of `index.html` still shows the ratings site, but TMDB metadata will not work locally because `/api/tmdb` only exists when the project is served by Vercel (or a compatible local dev server).

## Matching / corrections
Movie titles are matched automatically. A small alias map in `app.js` handles obvious spreadsheet shorthand such as `Maverick`, `John Wick 1`, `Harry Potter 7`, `Avatar 3`, `2001 Space Odyssey`, and `LA Confidential`.

Automatic title matching can occasionally pick the wrong remake or same-named film. When that happens, add an alias to `TITLE_ALIASES` in `app.js`. A future version can add TMDB IDs directly to the source sheet for perfect matching.

## Suggested next step
Once the metadata matching has been reviewed, connect the source Google Sheet so new ratings appear automatically without regenerating `data.js`.
