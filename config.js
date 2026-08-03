const STATION_CONFIG = {
  // 1. Publish your Google Sheet as CSV:
  //    File -> Share -> Publish to web -> select your sheet/tab -> CSV -> Publish
  //    Paste the resulting link below.
  sheetCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSCn342rfC-ljICIJPuuQHuSSI2GzRuCwFuaHa0X-MPJHo5e6Zq1K0u81f2lagRCanc1K-Z0Pwz1al3/pub?gid=0&single=true&output=csv",

  // 2. How often to re-fetch the sheet, in milliseconds.
  refreshIntervalMs: 60000, // 1 minute

  // 3. Limit how many of the most recent rows to plot. Useful if your
  //    sheet has grown large and you only care about recent readings
  //    (also keeps the page fast). Set to null to use all rows.
  maxDataPoints: 10,

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
    //   index: 6, // column G
    //   label: "Wind Speed",
    //   unit: "km/h",
    //   color: "var(--c-wind)",
    //   axis: "left",
    //   decimals: 1,
    // },
  ],

  // 6. Forecast / prediction column. This is TEXT (e.g. "Sunny", "Rain"),
  //    not a number, so it isn't charted — instead it's shown as its own
  //    card with an image/gif next to the latest word from your sheet.
  //    Set to null to turn this card off entirely.
  condition: {
    index: 5, // column F
    key: "prediction", // used if hasHeaderRow: true
    label: "Forecast",

    // Map the exact text your sheet cell contains (case-insensitive,
    // spaces ignored) to an image/gif URL. Add as many rows as you like.
    // "default" is used whenever the sheet text doesn't match anything below
    // (e.g. a typo, or a word you haven't mapped yet).
    icons: {
      sunny: "https://media.giphy.com/media/xTiTnxpQ3ghPiB2Hp6/giphy.gif",
      clear: "https://media.giphy.com/media/xTiTnxpQ3ghPiB2Hp6/giphy.gif",
      cloudy: "https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif",
      overcast: "https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif",
      rain: "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif",
      rainy: "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif",
      storm: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
      thunderstorm: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
      snow: "https://media.giphy.com/media/l0MYB8Ory7Hqefo9a/giphy.gif",
      default: "https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif",
    },
  },
};
