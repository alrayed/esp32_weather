// ============================================================
// STATION CONFIG
// This is the only file you need to touch to connect your sheet.
// ============================================================

const STATION_CONFIG = {
  // 1. Publish your Google Sheet as CSV:
  //    File -> Share -> Publish to web -> select your sheet/tab -> CSV -> Publish
  //    Paste the resulting link below.
  sheetCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSiVauhiltFVeL26Mby6x8m4FWyQ40xzcdnyIhgSQh5WJTx9m7NAvc8WZ-ohe96KIWU6oQ5C8t27Jqq/pubhtml?gid=0&single=true",

  // 2. How often to re-fetch the sheet, in milliseconds.
  refreshIntervalMs: 60000, // 1 minute

  // 3. Does row 1 of your sheet contain header labels (e.g. "time",
  //    "temperature"...)? If your sheet starts straight into data
  //    (column A = timestamp, no label row), set this to false and
  //    use "index" below instead of "key". Index is 0-based:
  //    A=0, B=1, C=2, D=3, E=4...
  hasHeaderRow: false,

  // 4. Column mapping.
  //    - With hasHeaderRow: true  -> match by "key" (sheet header text,
  //      case-insensitive, spaces ignored)
  //    - With hasHeaderRow: false -> match by "index" (0-based column
  //      position: A=0, B=1, C=2...)
  columns: {
    time: { index: 0, key: "time", label: "Time" },
  },

  // 5. Each reading you want plotted / shown as a live tile.
  //    - key: internal id (also matches sheet header when hasHeaderRow: true)
  //    - index: column position when hasHeaderRow: false (A=0, B=1, C=2...)
  //    - label: display name
  //    - unit: shown next to the value
  //    - color: CSS variable name from style.css
  //    - axis: "left" or "right" (lets you pair readings that share
  //            a similar scale, e.g. temp+humidity on left, pressure on right)
  series: [
    {
      key: "temperature",
      index: 1, // column B
      label: "Temperature",
      unit: "°C",
      color: "var(--c-temp)",
      axis: "left",
      decimals: 1,
    },
    {
      key: "humidity",
      index: 2, // column C
      label: "Humidity",
      unit: "%",
      color: "var(--c-humidity)",
      axis: "left",
      decimals: 0,
    },
    {
      key: "pressure",
      index: 3, // column D
      label: "Pressure",
      unit: "hPa",
      color: "var(--c-pressure)",
      axis: "right",
      decimals: 2,
    },
    {
      key: "altitude",
      index: 4, // column E
      label: "Altitude",
      unit: "m",
      color: "var(--c-altitude)",
      axis: "right",
      decimals: 1,
    },
    // --- Add future readings here, e.g. ---
    // {
    //   key: "wind_speed",
    //   index: 5, // column F
    //   label: "Wind Speed",
    //   unit: "km/h",
    //   color: "var(--c-wind)",
    //   axis: "left",
    //   decimals: 1,
    // },
  ],
};
