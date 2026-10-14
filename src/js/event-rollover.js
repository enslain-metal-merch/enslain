/* Enslain Events: browser-only 05:00 Europe/Helsinki rollover, no fetch or deploy.
 * Kept as plain JS for the static site; exported for Node/browser regression tests.
 */
(function (global, makeRollover) {
  "use strict";
  const api = makeRollover();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (global && global.document) api.start(global);
})(typeof window === "undefined" ? null : window, function () {
  "use strict";
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const helsinkiClock = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", hourCycle: "h23"
  });
  const pad = number => String(number).padStart(2, "0");

  function effectiveDay(now) {
    const p = Object.fromEntries(helsinkiClock.formatToParts(now).map(part => [part.type, part.value]));
    let day = p.year + "-" + p.month + "-" + p.day;
    // Before 05:00, yesterday's shows are still Upcoming.
    if (Number(p.hour) < 5) {
      const previous = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day) - 1));
      day = previous.getUTCFullYear() + "-" + pad(previous.getUTCMonth() + 1) + "-" + pad(previous.getUTCDate());
    }
    return day;
  }
  function isPast(endDate, now) {
    if (!DATE.test(endDate || "")) return false;
    return endDate < effectiveDay(now);
  }
  function dateOf(row, attr) {
    const time = row.querySelector("time[datetime]");
    const value = time && time.getAttribute(attr);
    return value && DATE.test(value) ? value : null;
  }
  function startDate(row) { return dateOf(row, "datetime") || ""; }
  function endDate(row) { return dateOf(row, "data-end-date") || startDate(row); }

  // Both pages have real upcoming/past TBODYs. Moving the existing approved
  // HTML rows preserves links, text, accessibility and the site's CSS.
  function moveRows(upcomingBody, pastBody, now) {
    if (!upcomingBody || !pastBody) return null;
    const rows = [...upcomingBody.querySelectorAll("tr"), ...pastBody.querySelectorAll("tr")];
    const order = new Map(rows.map((row, index) => [row, index]));
    let changed = false;
    const buckets = { upcoming: [], past: [] };
    for (const row of rows) {
      const previous = row.parentNode === upcomingBody ? "upcoming" : "past";
      const end = endDate(row);
      const kind = end ? (isPast(end, now) ? "past" : "upcoming") : previous;
      if (kind !== previous) changed = true;
      if (row.dataset.kind !== undefined) row.dataset.kind = kind;
      if (kind === "past") {
        // Past tables have six columns; ticket links should not survive.
        const tickets = row.querySelector("td.events-v2__tickets");
        if (tickets) { tickets.remove(); changed = true; }
      }
      buckets[kind].push(row);
    }
    if (changed) {
      for (const kind of ["upcoming", "past"]) {
        buckets[kind].sort((a, b) => {
          const first = startDate(a), second = startDate(b);
          const chronological = kind === "upcoming"
            ? first.localeCompare(second) : second.localeCompare(first);
          return chronological || order.get(a) - order.get(b);
        });
      }
      upcomingBody.replaceChildren(...buckets.upcoming);
      pastBody.replaceChildren(...buckets.past);
    }
    return { changed, upcoming: buckets.upcoming.length, past: buckets.past.length };
  }

  function indexPage(doc, now) {
    const root = doc.querySelector("main.events-v2:not(.roadbook-page)");
    if (!root) return false;
    const upcoming = root.querySelector('[data-group="upcoming"] tbody');
    const past = root.querySelector('[data-group="past"] tbody');
    const result = moveRows(upcoming, past, now);
    if (result && result.changed) root.dispatchEvent(new doc.defaultView.Event("enslain:event-rollover"));
    return !!result;
  }

  function artistPage(doc, now) {
    const root = doc.querySelector("main.roadbook-page");
    if (!root) return false;
    const body = root.querySelector(".roadbook-page__body");
    if (!body) return false;
    const headings = [...body.children].filter(el => el.tagName === "H2");
    const upcomingHeading = headings.find(el => el.textContent.trim() === "Upcoming gigs");
    const pastHeading = headings.find(el => el.textContent.trim() === "Past events");
    if (!upcomingHeading || !pastHeading) return false;
    const upcomingWrap = upcomingHeading.nextElementSibling;
    const pastWrap = pastHeading.nextElementSibling;
    const upcoming = upcomingWrap && upcomingWrap.querySelector("tbody");
    const past = pastWrap && pastWrap.querySelector("tbody");
    const result = moveRows(upcoming, past, now);
    if (!result) return false;
    const lead = body.querySelector(".roadbook-lead");
    if (lead && /\d+ past events · \d+ upcoming/.test(lead.textContent)) {
      lead.textContent = lead.textContent.replace(
        /\d+ past events · \d+ upcoming/,
        result.past + " past events · " + result.upcoming + " upcoming"
      );
    }
    // Avoid displaying a blank table when the artist has no upcoming gigs.
    let empty = body.querySelector("[data-rollover-empty]");
    if (!empty && result.upcoming === 0) {
      empty = doc.createElement("p");
      empty.className = "roadbook-lead";
      empty.setAttribute("data-rollover-empty", "");
      empty.textContent = "No upcoming gigs currently.";
      upcomingWrap.after(empty);
    }
    if (empty) empty.hidden = result.upcoming !== 0;
    if (upcomingWrap) upcomingWrap.hidden = result.upcoming === 0;
    return true;
  }

  function run(doc, now) {
    if (!doc) return false;
    return indexPage(doc, now) || artistPage(doc, now);
  }
  function start(win) {
    const doc = win.document;
    let lastDay = null;
    function refresh() {
      const now = new Date();
      const day = effectiveDay(now);
      if (day !== lastDay) {
        lastDay = day;
        run(doc, now);
      }
    }
    function tick() {
      refresh();
      // Helsinki's 05:00 is an exact UTC minute even on DST changes.
      win.setTimeout(tick, 60000 - Date.now() % 60000 + 30);
    }
    refresh();
    win.setTimeout(tick, 60000 - Date.now() % 60000 + 30);
    win.addEventListener("focus", refresh);
    win.addEventListener("pageshow", refresh);
    doc.addEventListener("visibilitychange", () => { if (!doc.hidden) refresh(); });
  }
  return { effectiveDay, isPast, startDate, endDate, moveRows, indexPage, artistPage, run, start };
});
