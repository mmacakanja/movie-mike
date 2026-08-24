# Movie Mike — Version 5

Version 5 keeps Version 4's permanent cache, live ratings and comments, while making the public site clearer and adding guest columns.

## What changed

### New in Version 5

- Larger, higher-contrast navigation.
- Clickable genre buttons that open the full movie list filtered to that genre.
- Mike-vs-Metacritic disagreements separated into “Mike is higher” and “Metacritic is higher.”
- A fuller explanation of the five-category philosophy, including the rule that a 5+ in any category is a recommendation.
- A Visiting Columnist section controlled by the small `columnist.js` file.
- A compact, collapsible Owner Tools box.
- Technical cache and Google Sheet status prose removed from the public page.

### Preserved from Version 4

- **Permanent movie metadata cache:** when Neon is connected, TMDB results are stored in Postgres. The first lookup for a movie calls TMDB; later visitors get the saved metadata instead of re-querying TMDB.
- **Permanent critic-score cache:** Metacritic scores obtained through OMDb are also stored in Neon.
- **Stronger rating colors:** discrete red → orange → yellow → green colors make 1–7 easier to distinguish.
- **Black category numbers:** category numbers in colored circles are black for legibility, including the movie detail popup.
- **Mike vs. Critics:** a new section shows the largest differences between Mike's normalized score and Metacritic, with short automatically generated explanations based on the component ratings.
- **Newest Comments:** the homepage shows the eight latest visitor comments from Neon.
- **Search near the top:** a prominent search box now sits immediately under the hero area.
- **Owner Add Movie moved to the bottom:** no more public-looking header button or popup.
- **Live Google Sheet read/write:** once the Apps Script bridge is connected, the site reads the Google Sheet on every page load and can write a new review back to it.

## The "Owner passcode" / REVIEW_ADMIN_SECRET

There is no pre-existing admin secret. **You choose it.**

In Vercel go to:

`Movie Mike project → Settings → Environment Variables`

Create:

`REVIEW_ADMIN_SECRET`

Give it a password/value only you know. For example, use a long password from your password manager. Do not put the value in GitHub or in any site file.

At the bottom of Movie Mike, the Owner Tools form asks for **Owner passcode**. The browser sends it to `/api/sheet`; the Vercel server compares it with `REVIEW_ADMIN_SECRET`. A visitor who does not know the passcode cannot write a review to the Sheet.

After adding or changing an environment variable in Vercel, redeploy so the new deployment receives it.

## Environment variables

### Required for movie metadata

`TMDB_READ_TOKEN`

### Required for Metacritic comparison

`OMDB_API_KEY`

### Required for permanent metadata cache + comments

`DATABASE_URL`

This is normally supplied automatically when the Neon database is connected to the Vercel project.

### Required for live Google Sheet read/write

`GOOGLE_SHEETS_WEBHOOK_URL`

`REVIEW_ADMIN_SECRET`

`SHEETS_WEBHOOK_SECRET`

`SHEETS_WEBHOOK_SECRET` is a second random secret used only between Vercel and the Google Apps Script. It should be different from the Owner passcode.

## Publishing a Visiting Columnist

In GitHub, open `columnist.js` and click the pencil icon. Replace the sample author, title, date and paragraph text, set `published: true`, then commit the change. Vercel will deploy it automatically. Each backtick-wrapped item in the `paragraphs` array becomes a separate paragraph. Set `published: false` and commit again to return to the default invitation.

---

# Connect the Google Sheet directly

Yes. The recommended approach is a small **Google Apps Script Web App** attached to the Movie Mike spreadsheet. Movie Mike talks to that web app through the server-side `/api/sheet` function.

This has two benefits:

1. **Live reads:** each Movie Mike page load asks the Sheet for the current ratings. There is no Vercel rebuild just because you added a row.
2. **Owner writes:** the Add Movie form can append a new review directly to the spreadsheet.

The current workbook tab is named **Movies**, and the sample below matches the workbook layout:

- Column B = movie title
- Columns D–H = five category ratings
- Column J = aggregate

## Google Apps Script code

Open your Google Sheet, then use **Extensions → Apps Script**. Replace the starter code with:

```javascript
const SHEET_NAME = 'Movies';
const WEBHOOK_SECRET = 'PUT_YOUR_SHEETS_WEBHOOK_SECRET_HERE';

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const values = sh.getDataRange().getValues();
  const rows = values.slice(1).map((r, i) => ({ row: r, sourceRow: i + 2 }))
    .filter(x => String(x.row[1] || '').trim());

  // Keep the LAST occurrence of a duplicate title, matching Movie Mike's rule.
  const byTitle = new Map();
  rows.forEach(x => {
    const r = x.row;
    const title = String(r[1]).trim();
    const o = Number(r[3]);
    const d = Number(r[4]);
    const a = Number(r[5]);
    const e = Number(r[6]);
    const p = Number(r[7]);
    const calculated = (o + d + a + e + p) / 5;
    byTitle.set(title.toLowerCase(), {
      title, o, d, a, e, p,
      score: Number(r[9]) || calculated,
      sourceRow: x.sourceRow
    });
  });

  return json_({ movies: Array.from(byTitle.values()) });
}

function doPost(e) {
  const x = JSON.parse(e.postData.contents || '{}');
  if (x.secret !== WEBHOOK_SECRET) return json_({ error: 'unauthorized' });

  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const vals = [x.o, x.d, x.a, x.e, x.p].map(Number);
  if (!x.title || vals.some(v => !Number.isInteger(v) || v < 0 || v > 7)) {
    return json_({ error: 'invalid review' });
  }
  const score = vals.reduce((a,b) => a+b, 0) / 5;

  // A-J: blank, title, blank, five category scores, blank, aggregate.
  sh.appendRow(['', String(x.title).trim(), '', ...vals, '', score]);
  return json_({ ok: true, score });
}
```

Change only this line to your private server-to-server secret:

`const WEBHOOK_SECRET = 'PUT_YOUR_SHEETS_WEBHOOK_SECRET_HERE';`

Use the **same exact value** for `SHEETS_WEBHOOK_SECRET` in Vercel.

## Deploy the Apps Script

In Apps Script:

1. Click **Deploy → New deployment**.
2. Choose **Web app**.
3. Execute as: **Me**.
4. Choose access that permits the Vercel server to call the web app. For a personal bridge, this generally means the deployed web app must be callable without an interactive Google login; the secret in the POST body protects writes.
5. Click **Deploy** and authorize the script to access the spreadsheet.
6. Copy the `/exec` Web App URL.
7. Put that URL in Vercel as `GOOGLE_SHEETS_WEBHOOK_URL`.
8. Redeploy Movie Mike.

After this, the small status line under the hero should say **Live Google Sheet connected**.

### How updates behave

- Edit/add a row directly in Google Sheets → reload Movie Mike → the change appears.
- Add a review from the Owner Tools form → Movie Mike writes to Google Sheets → it immediately re-reads the Sheet and updates the page.
- You do **not** need to commit to GitHub or redeploy merely because you rated another movie.

---

# Permanent metadata cache

With `DATABASE_URL` present, `/api/tmdb` automatically creates a table called:

`movie_metadata_cache`

It stores the TMDB payload for each matched movie. This means poster/year/genre/director/cast/IMDb ID are persistent across browsers and visitors.

The critic endpoint similarly creates:

`critic_score_cache`

This stores Metacritic scores obtained through OMDb. The new Mike vs. Critics section can reuse those scores without repeatedly burning OMDb requests.

No manual SQL setup is required; the tables are created on first use.

---

# Comments

With Neon connected, `/api/comments` automatically creates `movie_comments`.

Version 4 added **Newest Comments** near the top of the homepage. It displays the latest eight comments across all movies. Clicking one opens that movie.

Before broadly publicizing comments, consider adding spam protection and moderation.

---

# Updating to Version 5

Upload all V5 files to the same GitHub repository and preserve the folder structure. Replace the old files with the V5 versions. In particular, make sure the repository root contains:

- `index.html`
- `app.js`
- `styles.css`
- `data.js`
- `package.json`
- `vercel.json`
- `api/` folder

and that the `api/` folder is uploaded with the rest of the project.

If the repository is already linked to Vercel, committing the files to the production branch should trigger a new Vercel deployment automatically.
