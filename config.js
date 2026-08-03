// ============================================================
// STATION CONFIG
// This is the only file you need to touch to connect your sheet.
// ============================================================

const STATION_CONFIG = {
  // 1. Publish your Google Sheet as CSV:
  //    File -> Share -> Publish to web -> select your sheet/tab -> CSV -> Publish
  //    Paste the resulting link below.
  sheetCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/PASTE_YOUR_SHEET_ID_HERE/pub?output=csv",

  // 2. How often to re-fetch the sheet, in milliseconds.
  refreshIntervalMs: 60000, // 1 minute

  // 3. Column mapping. The "key" is what the sheet's header row
  //    contains (case-insensitive, spaces ignored). Add a new entry
  //    here any time you add a new column to your sheet later —
  //    no other code needs to change.
  columns: {
    time: { key: "time", label: "Time" },
  },

  // 4. Each reading you want plotted / shown as a live tile.
  //    - key: must match a header in your sheet
  //    - label: display name
  //    - unit: shown next to the value
  //    - color: CSS variable name from style.css
  //    - axis: "left" or "right" (lets you pair readings that share
  //            a similar scale, e.g. temp+humidity on left, pressure on right)
  series: [
    {
      key: "temperature",
      label: "Temperature",
      unit: "°C",
      color: "var(--c-temp)",
      axis: "left",
      decimals: 1,
    },
    {
      key: "humidity",
      label: "Humidity",
      unit: "%",
      color: "var(--c-humidity)",
      axis: "left",
      decimals: 0,
    },
    {
      key: "pressure",
      label: "Pressure",
      unit: "hPa",
      color: "var(--c-pressure)",
      axis: "right",
      decimals: 0,
    },
    // --- Add future readings here, e.g. ---
    // {
    //   key: "wind_speed",
    //   label: "Wind Speed",
    //   unit: "km/h",
    //   color: "var(--c-wind)",
    //   axis: "left",
    //   decimals: 1,
    // },
  ],
};
