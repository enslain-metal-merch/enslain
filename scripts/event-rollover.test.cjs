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
