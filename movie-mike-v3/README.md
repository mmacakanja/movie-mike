# Movie Mike — Version 3

A personal movie-rating site built from Mike's five-category spreadsheet.

## What changed in V3

- Denser poster layout (7 across on a typical desktop).
- The movie `Odyssey` is explicitly matched to Christopher Nolan's 2026 **The Odyssey**.
- Six auto-generated score lenses: Beautiful but Hollow, All Heart, Swinging for the Fences, The Complete Package, Originals, and Mike Says No.
- Category scores are color-coded from red (1) to green (7).
- Historical category scores of 8 are displayed as **7+** with a special ring; 7 remains the stated maximum of the scale.
- Optional Metacritic critic score beside the Mike score, provided through OMDb.
- Optional public comments backed by a free Neon Postgres database.
- Optional `+ Add review` admin form that can write directly to the Google Sheet through a Google Apps Script bridge.
- Optional live read from the Google Sheet: when configured, the site can use the Sheet instead of the bundled `data.js` snapshot.

## Basic deployment

Deploy this repository to Vercel. The site works immediately using the bundled ratings. Real metadata requires the TMDB token below.

### 1. TMDB metadata (recommended)

Set this Vercel environment variable:

`TMDB_READ_TOKEN`

The token is kept server-side. The site uses it for posters, year, genres, runtime, director, cast, synopsis, and IMDb ID.

### 2. Metacritic score (optional)

Get an OMDb API key and set:

`OMDB_API_KEY`

OMDb's `Metascore` field is displayed as the Metacritic critic score. If this variable is missing, the site simply shows a dash.

### 3. Public comments (optional)

In Vercel, add the Neon integration (Storage / Marketplace) and connect a free Postgres database to the project. It should supply:

`DATABASE_URL`

The first comments request automatically creates a small `movie_comments` table. For a public site, add moderation/spam controls before sharing broadly.

### 4. Add reviews directly to Google Sheets (optional)

The site includes an admin-only Add Review form. It talks to `/api/sheet`, which proxies a Google Apps Script web app.

Set these Vercel environment variables:

- `GOOGLE_SHEETS_WEBHOOK_URL` — the Apps Script web-app URL
- `REVIEW_ADMIN_SECRET` — a password you enter in the Add Review form
- `SHEETS_WEBHOOK_SECRET` — a second server-to-server secret used by Apps Script

Create an Apps Script attached to the Google Sheet and use code along these lines (adjust SHEET_NAME and columns if needed):

```javascript
const SHEET_NAME = 'Sheet1';
const WEBHOOK_SECRET = 'PUT_THE_SAME_SHEETS_WEBHOOK_SECRET_HERE';

function doGet() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const values = sh.getDataRange().getValues();
  const rows = values.slice(1).filter(r => r[1]);
  const movies = rows.map((r, i) => ({
    title: String(r[1]),
    o: Number(r[3]),
    d: Number(r[4]),
    a: Number(r[5]),
    e: Number(r[6]),
    p: Number(r[7]),
    score: Number(r[9]) || (Number(r[3])+Number(r[4])+Number(r[5])+Number(r[6])+Number(r[7]))/5,
    sourceRow: i + 2
  }));
  return ContentService.createTextOutput(JSON.stringify({movies}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const x = JSON.parse(e.postData.contents || '{}');
  if (x.secret !== WEBHOOK_SECRET) {
    return ContentService.createTextOutput(JSON.stringify({error:'unauthorized'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const score = (Number(x.o)+Number(x.d)+Number(x.a)+Number(x.e)+Number(x.p))/5;
  sh.appendRow(['', x.title, '', x.o, x.d, x.a, x.e, x.p, '', score]);
  return ContentService.createTextOutput(JSON.stringify({ok:true, score}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Deploy Apps Script as a Web App. The sample above matches the current workbook layout: title in column B, five category ratings in D–H, and aggregate in J. If the live Google Sheet differs, adjust the indexes accordingly.

Once this bridge is configured, the website tries `/api/sheet` on startup and uses the returned movie list. That means a review entered on the site can be written to the Sheet and appear on the site after refresh.

## Score lenses used in this prototype

These rules are easy to tune:

- **Beautiful but Hollow:** Artistry >= 6 and Emotional Resonance <= 4.
- **All Heart:** Emotional Resonance >= 6.
- **Swinging for the Fences:** Degree of Difficulty >= 6.
- **The Complete Package:** every category >= 5 and aggregate >= 5.6.
- **Originals:** Originality / Voice >= 6.
- **Mike Says No:** aggregate <= 3.2.

## Notes on Rotten Tomatoes

V3 uses Metacritic/OMDb rather than scraping Rotten Tomatoes. Rotten Tomatoes requires review/access and brand attribution for integration of its data, so using its scores casually through an unofficial scraper is a poor foundation for this site.
