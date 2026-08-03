// ============================================================
// Weather Station Readout — app logic
// You shouldn't need to edit this file. Edit config.js instead.
// ============================================================

(function () {
  const cfg = STATION_CONFIG;
  const tilesEl = document.getElementById("tiles");
  const legendEl = document.getElementById("legend");
  const statusLine = document.getElementById("statusLine");
  const updatedLine = document.getElementById("updatedLine");
  const chartStateEl = document.getElementById("chartState");
  const refreshLine = document.getElementById("refreshLine");
  const liveDot = document.getElementById("liveDot");
  const canvas = document.getElementById("chart");
  const conditionCard = document.getElementById("conditionCard");
  const conditionImg = document.getElementById("conditionImg");
  const conditionLabel = document.getElementById("conditionLabel");
  const conditionValue = document.getElementById("conditionValue");

  if (cfg.condition && conditionLabel) {
    conditionLabel.textContent = cfg.condition.label || "Forecast";
  } else if (conditionCard) {
    conditionCard.classList.add("hidden");
  }

  let chart = null;
  const hidden = new Set(); // series keys currently toggled off

  refreshLine.textContent = `refreshing every ${Math.round(
    cfg.refreshIntervalMs / 1000
  )}s`;

  // ---------- helpers ----------

  function normalizeHeader(h) {
    return String(h || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  }

  function setStatus(text, kind) {
    statusLine.textContent = text;
    statusLine.className = kind ? `status-${kind}` : "";
  }

  function setChartState(html) {
    if (html === null) {
      chartStateEl.classList.add("hidden");
    } else {
      chartStateEl.classList.remove("hidden");
      chartStateEl.innerHTML = html;
    }
  }

  // Try a wide range of time formats into a Date. Google Sheets' published
  // CSV can render date/time cells in several different text shapes
  // depending on locale/format, so we try several strategies.
  function parseTime(raw) {
    if (raw === null || raw === undefined || raw === "") return null;
    const s = String(raw).trim();

    // 1. Direct parse (handles ISO, "2026-08-03 11:57:34", many others)
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;

    // 2. Comma between date and time, e.g. "8/3/2026, 11:57:34"
    d = new Date(s.replace(",", ""));
    if (!isNaN(d.getTime())) return d;

    // 3. Dot-separated date, e.g. "03.08.2026 11:57:34"
    d = new Date(s.replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})/, "$3-$2-$1"));
    if (!isNaN(d.getTime())) return d;

    // 4. Slash date with dashes swapped, e.g. "2026/08/03 11:57:34"
    d = new Date(s.replace(/\//g, "-"));
    if (!isNaN(d.getTime())) return d;

    // 5. Bare "HH:MM" or "HH:MM:SS" label — use today as the date part
    const m = s.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
    if (m) {
      const today = new Date();
      today.setHours(Number(m[1]), Number(m[2]), Number(m[4] || 0), 0);
      return today;
    }

    console.warn("[weather-dashboard] Could not parse time value:", JSON.stringify(raw));
    return null;
  }

  // ---------- build static UI (tiles + legend) ----------

  function buildTiles() {
    tilesEl.innerHTML = "";
    cfg.series.forEach((s) => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.style.setProperty("--tile-accent", s.color);
      tile.id = `tile-${s.key}`;
      tile.innerHTML = `
        <div class="tile-label"><span class="tile-swatch"></span>${s.label}</div>
        <div class="tile-value"><span class="num">—</span><span class="unit">${s.unit}</span></div>
        <div class="tile-sub">no data yet</div>
      `;
      tilesEl.appendChild(tile);
    });
  }

  function buildLegend() {
    legendEl.innerHTML = "";
    cfg.series.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "legend-btn active";
      btn.style.setProperty("--dot-color", s.color);
      btn.innerHTML = `<span class="dot"></span>${s.label}`;
      btn.addEventListener("click", () => toggleSeries(s.key, btn));
      legendEl.appendChild(btn);
    });
  }

  function toggleSeries(key, btn) {
    if (hidden.has(key)) {
      hidden.delete(key);
      btn.classList.add("active");
      btn.classList.remove("off");
    } else {
      hidden.add(key);
      btn.classList.remove("active");
      btn.classList.add("off");
    }
    if (chart) {
      const ds = chart.data.datasets.find((d) => d.key === key);
      if (ds) {
        ds.hidden = hidden.has(key);
        chart.update();
      }
    }
  }

  // ---------- data fetch + parse ----------

  async function fetchRows() {
    const res = await fetch(cfg.sheetCsvUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Sheet responded with HTTP ${res.status}`);
    }
    const csvText = await res.text();
    const parsed = Papa.parse(csvText.trim(), {
      header: cfg.hasHeaderRow !== false,
      skipEmptyLines: true,
    });
    if (parsed.errors && parsed.errors.length) {
      console.warn("CSV parse warnings:", parsed.errors);
    }
    return parsed.data;
  }

  // Map raw sheet rows to a clean shape: { time: Date, temperature: number, ... }
  // Supports two modes, set via cfg.hasHeaderRow:
  //  - true:  rows are objects keyed by header text (case/space-insensitive)
  //  - false: rows are arrays, matched by column position (index)
  function normalizeRows(rawRows) {
    if (!rawRows.length) return [];

    if (cfg.hasHeaderRow === false) {
      return normalizeRowsByIndex(rawRows);
    }
    return normalizeRowsByHeader(rawRows);
  }

  function normalizeRowsByIndex(rawRows) {
    const timeIndex = cfg.columns.time.index;
    return rawRows
      .map((row) => {
        const time = parseTime(row[timeIndex]);
        if (!time) return null;
        const out = { time };
        cfg.series.forEach((s) => {
          const v = parseFloat(String(row[s.index] ?? "").replace(/,/g, ""));
          out[s.key] = isNaN(v) ? null : v;
        });
        if (cfg.condition) {
          const raw = row[cfg.condition.index];
          out.prediction = raw === undefined || raw === null ? null : String(raw).trim();
        }
        return out;
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);
  }

  function normalizeRowsByHeader(rawRows) {
    const sampleHeaders = Object.keys(rawRows[0]);
    const headerLookup = {};
    sampleHeaders.forEach((h) => {
      headerLookup[normalizeHeader(h)] = h;
    });

    const timeHeader = headerLookup[normalizeHeader(cfg.columns.time.key)];
    const seriesHeaders = {};
    cfg.series.forEach((s) => {
      seriesHeaders[s.key] = headerLookup[normalizeHeader(s.key)];
    });
    const conditionHeader = cfg.condition
      ? headerLookup[normalizeHeader(cfg.condition.key)]
      : null;

    const missing = [];
    if (!timeHeader) missing.push(cfg.columns.time.label);
    cfg.series.forEach((s) => {
      if (!seriesHeaders[s.key]) missing.push(s.label);
    });
    if (cfg.condition && !conditionHeader) missing.push(cfg.condition.label);
    if (missing.length) {
      const err = new Error(
        `Sheet is missing expected column(s): ${missing.join(", ")}`
      );
      err.code = "MISSING_COLUMNS";
      err.found = sampleHeaders;
      throw err;
    }

    return rawRows
      .map((row) => {
        const time = parseTime(row[timeHeader]);
        if (!time) return null;
        const out = { time };
        cfg.series.forEach((s) => {
          const v = parseFloat(String(row[seriesHeaders[s.key]]).replace(/,/g, ""));
          out[s.key] = isNaN(v) ? null : v;
        });
        if (cfg.condition) {
          const raw = conditionHeader ? row[conditionHeader] : null;
          out.prediction = raw === undefined || raw === null ? null : String(raw).trim();
        }
        return out;
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);
  }

  // ---------- rendering ----------

  function updateTiles(rows) {
    if (!rows.length) return;
    const latest = rows[rows.length - 1];
    cfg.series.forEach((s) => {
      const tile = document.getElementById(`tile-${s.key}`);
      if (!tile) return;
      const numEl = tile.querySelector(".num");
      const subEl = tile.querySelector(".tile-sub");
      const val = latest[s.key];
      numEl.textContent = val === null || val === undefined ? "—" : val.toFixed(s.decimals ?? 1);
      subEl.textContent = `as of ${latest.time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    });
  }

  function updateCondition(rows) {
    if (!cfg.condition || !conditionCard || !rows.length) return;
    const latest = rows[rows.length - 1];
    const text = latest.prediction;
    const icons = cfg.condition.icons || {};
    const key = normalizeHeader(text || "");
    const iconUrl = (key && icons[key]) || icons.default || "";

    conditionValue.textContent = text || "no forecast yet";
    if (iconUrl) {
      conditionImg.src = iconUrl;
      conditionImg.alt = text || "forecast";
      conditionImg.classList.remove("hidden");
    } else {
      conditionImg.classList.add("hidden");
    }
  }

  function renderChart(rows) {
    const latestTime = rows[rows.length - 1].time;
    const labels = rows.map((r) => {
      const minutesAgo = Math.round((latestTime - r.time) / 60000);
      return minutesAgo <= 0 ? "now" : `${minutesAgo}m ago`;
    });

    const datasets = cfg.series.map((s) => ({
      key: s.key,
      label: `${s.label} (${s.unit})`,
      data: rows.map((r) => r[s.key]),
      borderColor: resolveColor(s.color),
      backgroundColor: resolveColor(s.color),
      pointRadius: rows.length > 60 ? 0 : 2,
      pointHoverRadius: 4,
      borderWidth: 2,
      tension: 0.3,
      spanGaps: true,
      yAxisID: s.axis === "right" ? "yRight" : "yLeft",
      hidden: hidden.has(s.key),
    }));

    const rightAxisUsed = cfg.series.some((s) => s.axis === "right");

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets = datasets;
      chart.update();
      return;
    }

    chart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0d1520",
            borderColor: "#1e2c3d",
            borderWidth: 1,
            titleFont: { family: "JetBrains Mono", size: 11 },
            bodyFont: { family: "JetBrains Mono", size: 11 },
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { color: "#1e2c3d", drawTicks: false },
            ticks: {
              color: "#7c8ca1",
              font: { family: "JetBrains Mono", size: 10 },
              maxRotation: 0,
              autoSkip: true,
            },
            border: { color: "#1e2c3d" },
          },
          yLeft: {
            position: "left",
            grid: { color: "#1e2c3d", drawTicks: false },
            ticks: { color: "#7c8ca1", font: { family: "JetBrains Mono", size: 10 } },
            border: { color: "#1e2c3d" },
          },
          yRight: {
            position: "right",
            display: rightAxisUsed,
            grid: { drawOnChartArea: false },
            ticks: { color: "#7c8ca1", font: { family: "JetBrains Mono", size: 10 } },
            border: { color: "#1e2c3d" },
          },
        },
      },
    });
  }

  function resolveColor(cssVarExpr) {
    // cssVarExpr looks like "var(--c-temp)" — resolve to actual hex for Chart.js canvas rendering
    const match = cssVarExpr.match(/--[\w-]+/);
    if (!match) return cssVarExpr;
    return getComputedStyle(document.documentElement).getPropertyValue(match[0]).trim();
  }

  // ---------- main loop ----------

  async function refresh() {
    try {
      setStatus("fetching latest reading…");
      const rawRows = await fetchRows();
      let rows = normalizeRows(rawRows);

      if (cfg.maxDataPoints && rows.length > cfg.maxDataPoints) {
        rows = rows.slice(-cfg.maxDataPoints);
      }

      if (!rows.length) {
        setChartState(
          `<span>Sheet connected, but no valid rows were found yet.<br/>Open your browser's console (F12 → Console tab) to see the exact raw time value that couldn't be parsed.<br/>Add a row with a time and readings to see the graph.</span>`
        );
        setStatus("connected — waiting for data", "ok");
        return;
      }

      setChartState(null);
      updateTiles(rows);
      updateCondition(rows);
      renderChart(rows);
      setStatus("connected", "ok");
      updatedLine.textContent = `last updated ${new Date().toLocaleTimeString()}`;
    } catch (err) {
      console.error(err);
      setStatus("connection error", "err");
      const isNetworkish =
        err instanceof TypeError || /HTTP \d/.test(err.message || "");

      if (err.code === "MISSING_COLUMNS") {
        setChartState(
          `<span>${err.message}.<br/>Check that your sheet's header row matches the keys in <code>config.js</code>.<br/>Found headers: ${err.found.join(
            ", "
          )}</span>`
        );
      } else if (isNetworkish) {
        setChartState(
          `<span>Couldn't load the sheet.<br/>Make sure it's published to the web as CSV and the URL in <code>config.js</code> is correct.<br/><a href="https://support.google.com/docs/answer/183965" target="_blank" rel="noopener">How to publish a Google Sheet as CSV</a></span>`
        );
      } else {
        // Not a network/column problem — the sheet loaded fine, something
        // failed afterwards (e.g. while drawing the chart). Show the real
        // error so it's obvious what broke, without needing devtools.
        setChartState(
          `<span>Data loaded, but something failed while rendering the chart:<br/><code>${(
            err.message || String(err)
          ).replace(/</g, "&lt;")}</code></span>`
        );
      }
    }
  }

  buildTiles();
  buildLegend();
  refresh();
  setInterval(refresh, cfg.refreshIntervalMs);
})();
