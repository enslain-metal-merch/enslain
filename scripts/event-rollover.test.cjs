const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const rollover = require("../src/js/event-rollover.js");
const root = path.resolve(__dirname, "..");

test("05:00 Helsinki cutoff, not midnight and not browser time zone", () => {
  assert.equal(rollover.effectiveDay(new Date("2026-10-17T01:59:59Z")), "2026-10-16");
  assert.equal(rollover.effectiveDay(new Date("2026-10-17T02:00:00Z")), "2026-10-17");
  assert.equal(rollover.isPast("2026-10-16", new Date("2026-10-17T01:59:59Z")), false);
  assert.equal(rollover.isPast("2026-10-16", new Date("2026-10-17T02:00:00Z")), true);
  assert.equal(rollover.isPast("2026-10-17", new Date("2026-10-17T02:00:00Z")), false);
});
test("multi-day festival only rolls after its final date", () => {
  assert.equal(rollover.isPast("2026-11-08", new Date("2026-11-09T02:59:59Z")), false);
  assert.equal(rollover.isPast("2026-11-08", new Date("2026-11-09T03:00:00Z")), true);
});
test("Helsinki daylight-saving and year boundaries", () => {
  // Summer to winter: Helsinki is UTC+2 after October 25, 2026.
  assert.equal(rollover.effectiveDay(new Date("2026-10-25T02:59:59Z")), "2026-10-24");
  assert.equal(rollover.effectiveDay(new Date("2026-10-25T03:00:00Z")), "2026-10-25");
  // Winter to summer: Helsinki is UTC+3 after March 29, 2026.
  assert.equal(rollover.effectiveDay(new Date("2026-03-29T01:59:59Z")), "2026-03-28");
  assert.equal(rollover.effectiveDay(new Date("2026-03-29T02:00:00Z")), "2026-03-29");
  assert.equal(rollover.effectiveDay(new Date("2027-01-01T02:59:59Z")), "2026-12-31");
  assert.equal(rollover.effectiveDay(new Date("2027-01-01T03:00:00Z")), "2027-01-01");
});
test("main Events: existing 878 public rows move without losing filter behavior", () => {
  const html = fs.readFileSync(path.join(root, "public/events/index.html"), "utf8");
  const dom = new JSDOM(html, { url: "https://www.enslain.net/events/", runScripts: "outside-only" });
  const doc = dom.window.document;
  const up = doc.querySelector('[data-group="upcoming"] tbody');
  const past = doc.querySelector('[data-group="past"] tbody');
  assert.equal(up.querySelectorAll("tr[data-event-id]").length + past.querySelectorAll("tr[data-event-id]").length, 878);
  const show = [...up.querySelectorAll("tr")].find(row => row.querySelector('time[datetime="2026-10-16"]'));
  assert.ok(show);
  assert.equal(rollover.run(doc, new Date("2026-10-17T01:59:59Z")), true);
  assert.equal(show.parentNode, up);
  const eventsJS = fs.readFileSync(path.join(root, "public/assets/events.js"), "utf8");
  dom.window.eval(eventsJS);
  assert.equal(rollover.run(doc, new Date("2026-10-17T02:00:00Z")), true);
  assert.equal(show.parentNode, past);
  assert.equal(show.dataset.kind, "past");
  assert.equal(show.querySelector(".events-v2__tickets"), null);
  assert.match(doc.querySelector("#events-summary").textContent, /events found/);
  assert.equal(up.querySelectorAll("tr[data-event-id]").length + past.querySelectorAll("tr[data-event-id]").length, 878);
  assert.equal(doc.querySelector("#events-timing").value, "upcoming");
  // A page kept open for weeks must preserve chronological paging too.
  doc.querySelector("#events-timing").value = "past";
  doc.querySelector("#events-timing").dispatchEvent(new dom.window.Event("change"));
  rollover.run(doc, new Date("2026-11-09T03:00:00Z"));
  const firstPast = [...past.querySelectorAll("tr")].slice(0, 55);
  assert.ok(firstPast.every(row => !row.classList.contains("is-paged-out")));
  assert.ok(firstPast.every(row => !row.classList.contains("is-filtered-out")));
  assert.ok([...past.querySelectorAll("tr")].slice(55).every(row => row.classList.contains("is-paged-out")));
  dom.window.close();
});
test("Brymir and Kaunis Kuolematon artist pages migrate real rows and tickets", () => {
  for (const artist of ["brymir", "kaunis-kuolematon"]) {
    const html = fs.readFileSync(path.join(root, "public/artists", artist, "index.html"), "utf8");
    const dom = new JSDOM(html, { url: "https://www.enslain.net/artists/" + artist + "/" });
    const doc = dom.window.document;
    const containers = doc.querySelectorAll(".roadbook-page__body .events-v2__table-wrap tbody");
    assert.equal(containers.length, 2);
    const [up, past] = containers;
    const initial = up.querySelectorAll("tr").length + past.querySelectorAll("tr").length;
    const show = [...up.querySelectorAll("tr")].find(row => row.querySelector('time[datetime="2026-10-16"]'));
    assert.ok(show, artist);
    rollover.run(doc, new Date("2026-10-17T01:59:59Z"));
    assert.equal(show.parentNode, up);
    rollover.run(doc, new Date("2026-10-17T02:00:00Z"));
    assert.equal(show.parentNode, past);
    assert.equal(show.querySelector(".events-v2__tickets"), null);
    assert.equal(up.querySelectorAll("tr").length + past.querySelectorAll("tr").length, initial);
    if (artist === "brymir") {
      const lead = doc.querySelector(".roadbook-lead").textContent;
      assert.match(lead, /\d+ past events · \d+ upcoming/);
    }
    dom.window.close();
  }
});
test("all existing date ranges have explicit end dates", () => {
  for (const file of [
    "public/events/index.html",
    "public/artists/brymir/index.html",
    "public/artists/kaunis-kuolematon/index.html"
  ]) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    for (const m of html.matchAll(/<time datetime="(\d{4}-\d{2}-\d{2})"(.*?)>(\d+–\d+ [A-Za-z]{3} \d{4})<\/time>/g)) {
      assert.match(m[2], /data-end-date="\d{4}-\d{2}-\d{2}"/, file + ": " + m[3]);
    }
  }
  const html = fs.readFileSync(path.join(root, "public/events/index.html"), "utf8");
  assert.match(html, /datetime="2026-11-06" data-end-date="2026-11-08">6–8 Nov 2026/);
});
test("rollover scripts are included in all three target pages, but not on unrelated pages", () => {
  for (const file of ["public/events/index.html","public/artists/brymir/index.html","public/artists/kaunis-kuolematon/index.html"]) {
    const s = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(s, /<script src="\/assets\/event-rollover\.js" defer><\/script>/, file);
  }
  assert.equal(fs.readFileSync(path.join(root, "src/js/event-rollover.js"), "utf8"),
               fs.readFileSync(path.join(root, "public/assets/event-rollover.js"), "utf8"));
  assert.equal(fs.readFileSync(path.join(root, "src/js/events.js"), "utf8"),
               fs.readFileSync(path.join(root, "public/assets/events.js"), "utf8"));
});


test("all three individual tours use one date-ordered table without sections", () => {
  const tours = [
    ["2026-brymir", 12, 5],
    ["2026-kaunis-kuolematon", 9, 9],
    ["2026-pat-metheny", 41, 0]
  ];
  for (const [slug, count, liveTickets] of tours) {
    const html = fs.readFileSync(path.join(root, "public/touring-history", slug, "index.html"), "utf8");
    const dom = new JSDOM(html, { url: "https://www.enslain.net/touring-history/" + slug + "/" });
    const doc = dom.window.document;
    const section = doc.querySelector("main[data-tour-dates]");
    assert.ok(section, slug);
    const headings = [...section.querySelectorAll("h2")].map(x => x.textContent.trim());
    assert.deepEqual(headings, ["Tour dates"], slug);
    assert.equal(section.querySelectorAll("tbody").length, 1, slug);
    const rows = [...section.querySelectorAll("tbody tr")];
    assert.equal(rows.length, count, slug);
    const starts = rows.map(r => r.querySelector("time[datetime]").getAttribute("datetime"));
    assert.deepEqual(starts, [...starts].sort(), slug);
    assert.equal(section.querySelectorAll(".events-v2__ticket").length, liveTickets, slug);
    assert.match(html, /<script src="\/assets\/event-rollover\.js" defer><\/script>/);
    const before = new Date("2026-10-17T01:59:59Z");
    rollover.run(doc, before);
    assert.equal(section.querySelectorAll(".events-v2__ticket").length, liveTickets, slug);
    const after = new Date("2026-10-17T02:00:00Z");
    rollover.run(doc, after);
    const expectedAfter = slug === "2026-brymir" ? liveTickets - 1
      : slug === "2026-kaunis-kuolematon" ? liveTickets - 1 : 0;
    assert.equal(section.querySelectorAll(".events-v2__ticket").length, expectedAfter, slug);
    assert.equal(section.querySelectorAll("tbody tr").length, count);
    assert.deepEqual([...section.querySelectorAll("h2")].map(x => x.textContent.trim()), ["Tour dates"]);
    dom.window.close();
  }
});
test("multi-day tour dates preserve last-day metadata for future ticket expiration", () => {
  const html = fs.readFileSync(path.join(root, "public/touring-history/2026-pat-metheny/index.html"), "utf8");
  assert.match(html, /datetime="2026-07-11" data-end-date="2026-07-12">11–12 Jul 2026<\/time>/);
});


test("every individual artist page has the shared 05:00 clock and correct multi-day metadata", () => {
  const slugs = [
    "battle-beast","brymir","charon","crimson-sun","kalmah",
    "kauan","kaunis-kuolematon","mors-subita","mygrain","pat-metheny",
    "shade-empire","tarja-turunen","the-man-eating-tree","tyrantti","vorna"
  ];
  for (const slug of slugs) {
    const html = fs.readFileSync(path.join(root, "public/artists", slug, "index.html"), "utf8");
    assert.match(html, /<script src="\/assets\/event-rollover\.js" defer><\/script>/, slug);
    const dom = new JSDOM(html, { url: "https://www.enslain.net/artists/" + slug + "/" });
    const doc = dom.window.document;
    const section = doc.querySelector("main.roadbook-page");
    assert.ok(section, slug);
    const rows = [...section.querySelectorAll("tbody tr.events-v2__row")];
    assert.ok(rows.length >= 2, slug);
    for (const row of rows) {
      const time = row.querySelector("time[datetime]");
      assert.ok(time, slug);
      const label = time.textContent.trim();
      if (/^\d+–\d+ [A-Za-z]{3} \d{4}$/.test(label)) {
        assert.match(time.getAttribute("data-end-date") || "", /^\d{4}-\d{2}-\d{2}$/, slug + " : " + label);
        assert.ok(time.getAttribute("data-end-date") >= time.getAttribute("datetime"), slug + " : " + label);
      }
    }
    const beforeCounts = rows.length;
    const headings = [...section.querySelectorAll("h2")].map(x => x.textContent.trim());
    assert.ok(headings.includes("Past events"), slug);
    // All individual artist pages are safe to run at an arbitrary future date.
    rollover.run(doc, new Date("2027-01-01T03:00:00Z"));
    assert.equal(section.querySelectorAll("tbody tr.events-v2__row").length, beforeCounts, slug);
    if (headings.includes("Upcoming gigs")) {
      const wraps = section.querySelectorAll(".events-v2__table-wrap");
      assert.equal(wraps[0].querySelectorAll("tbody tr").length, 0, slug);
      assert.equal(wraps[1].querySelectorAll("tbody tr").length, beforeCounts, slug);
      assert.equal(wraps[0].hidden, true, slug);
      assert.equal(section.querySelectorAll(".events-v2__ticket").length, 0, slug);
    }
    dom.window.close();
  }
});
