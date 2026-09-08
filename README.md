# Movie Mike — Version 6.3

Version 6.3 is a deployment repair for the V6.2 site.

## Fixes

- Restores the clean API URLs expected by `app.js` while retaining the explicit Vercel build configuration that fixed the homepage 404.
- `/api/tmdb` routes to `api/tmdb.js`.
- `/api/critic` routes to `api/critic.js`.
- `/api/critic-summary` routes to `api/critic-summary.js`.
- `/api/comments` routes to `api/comments.js`.
- `/api/sheet` routes to `api/sheet.js`.
- The Telluride background now references `/telluride-main-street.jpg` explicitly.
- Removed technical implementation copy from the public Telluride section.

No new Vercel environment variables are required. Keep the existing TMDB, OMDb, Neon, and Google Sheet environment variables unchanged.
