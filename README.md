# Weather Station Readout

A static dashboard that reads live weather data from a Google Sheet and
plots it: **time on the x‑axis**, and temperature / humidity / pressure
(or anything else you add) on the y‑axis. No backend, no build step —
just HTML/CSS/JS, deployable straight to GitHub Pages.

## 1. Set up your Google Sheet

Create a sheet with a header row and one row per reading, e.g.:

| time             | temperature | humidity | pressure |
|------------------|-------------|----------|----------|
| 2026-08-03 09:00 | 27.4        | 68       | 1012     |
| 2026-08-03 10:00 | 28.1        | 65       | 1011     |

- Header names are case-insensitive and can have spaces (`Pressure (hPa)`
  and `pressure` both match the `pressure` key).
- The `time` column accepts most formats Google Sheets/JS can parse
  (`2026-08-03 09:00`, `8/3/2026 9:00 AM`, ISO timestamps, etc.), or a
  bare `HH:MM`.
- Add more columns any time — see step 4.

## 2. Publish the sheet as CSV

1. In Google Sheets: **File → Share → Publish to web**
2. Under "Link", choose the specific sheet/tab
3. Under the format dropdown, choose **Comma-separated values (.csv)**
4. Click **Publish**, copy the link it gives you

This link auto-updates whenever the sheet changes — no need to republish.

## 3. Connect the site to your sheet

Open `config.js` and paste your link into `sheetCsvUrl`:

```js
sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/XXXXX/pub?output=csv",
```

Open `index.html` locally (or deploy, see below) — the page fetches the
sheet directly in the browser and redraws the chart on a timer
(default: every 60 seconds, adjustable via `refreshIntervalMs`).

## 4. Adding more data later

You mentioned more columns are coming later — that's handled by design.
To add a new reading (say, wind speed):

1. Add a `wind_speed` column to your Google Sheet.
2. In `config.js`, add an entry to the `series` array:

```js
{
  key: "wind_speed",
  label: "Wind Speed",
  unit: "km/h",
  color: "var(--c-wind)",   // already defined in style.css
  axis: "left",
  decimals: 1,
},
```

That's it — a new instrument tile, legend toggle, and chart line appear
automatically. No other code changes needed.

## 5. Deploy to GitHub Pages

1. Create a new GitHub repo and push these files to it:
   ```bash
   git init
   git add .
   git commit -m "Weather station readout"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. On GitHub: go to your repo → **Settings → Pages**
3. Under **Build and deployment → Source**, choose **Deploy from a branch**
4. Branch: `main`, folder: `/ (root)` → **Save**
5. Wait a minute, then your site is live at:
   `https://<your-username>.github.io/<your-repo>/`

No further configuration needed — it's a static site.

## Notes

- If the chart shows a connection error, double-check the sheet is
  actually **published** (not just "shared") as CSV, and that the URL
  in `config.js` is the `pub?output=csv` link, not the normal edit link.
- If it says columns are missing, compare the "Found headers" it lists
  against the `key` values in `config.js` — they just need to match
  once spaces/casing are ignored.
- Click any legend item under the chart to show/hide that line.

## Files

- `index.html` — page structure
- `style.css` — visual design
- `config.js` — **the only file you should need to edit**
- `app.js` — fetch/parse/render logic
