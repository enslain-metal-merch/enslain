# Events 05:00 Helsinki rollover — stage 1

This isolated feature (not merged to master) applies to:
- main Events index;
- all 15 individual artist detail pages (including Brymir and Kaunis Kuolematon);
- all three existing tour detail pages (2026 Brymir, Kaunis Kuolematon + Insomnium, Pat Metheny).

At 05:00 **Europe/Helsinki** on the day **after an event's end date**, a
previously Upcoming item becomes Past. It is moved between the existing HTML
tables, sorted, removed from the Upcoming filters and stripped of any live
ticket link. For multiday dates, the marked end date wins over the first day.

No network requests, scheduled server processes, GitHub Actions cron jobs,
JSON feed or Netlify deployments are needed for the browser-side rollover.
Page-open rollover happens immediately; an open page checks aligned to each
minute boundary, and also on focus, visibility and pageshow. Year boundaries
and daylight-saving transitions use Intl Europe/Helsinki time.

Individual tour detail pages use **one chronological Tour dates table**, not
Upcoming/Past groups. The same lightweight clock merely removes expired ticket
links at the 05:00 cutoff without reordering or classifying the tour dates.
The touring-history index stays unchanged. The weekly static generator must
preserve this single-table format and add future tours in the same way.

The shared script is included on all 15 artist pages. Pages with a Past-only
archive safely do nothing until a Tuesday build adds an Upcoming table;
pages with both sections roll across the 05:00 threshold.

On the main Events page, the existing filtering/pagination logic is notified
of the changed data-kind and fully reindexes its lists. Upcoming becomes the
default filter (Past and All remain user-selectable). artist pages' existing count
paragraphs update; artist pages hide an empty Upcoming table and show a
plain-language no-upcoming message.

Important boundaries and follow-up work:
1. Original pre-rendered HTML still contains stale upcoming/past *source*
   classification until a weekly static rebuild. This is a client-side visual
   rollover, NOT a complete daily SEO/HTML rebuild or a private-data
   withdrawal mechanism.
2. The Tuesday generator must write accurate data-end-date attributes when
   generating **all** multiday rows, include this shared script for all
   applicable artist, tour and festival pages, preserve the source files,
   and keep search/SEO HTML synchronized.
3. Festival editions, artist directory and other overview directories, and
   the weekly sync are outside stage 1. Tour detail pages are in stage 1.
4. Urgent cancellations need a fresh static deploy that removes the event from
   all public HTML and metadata; the date rollover does not remove cancellations.
5. Existing markup marks date spans with explicit data-end-date to avoid
   prematurely archiving multiday festivals; the script falls back to the
   single-day time datetime when no data-end-date is supplied.
6. This changes only a preview branch. No master edits, webhook, secrets or
   Netlify production deployments are triggered by this change.

## Festival pages: Tuesdays only (agreed future-sync rule)

Dedicated festival detail pages and their festival index require **no client-side
05:00 Upcoming/Past rollover, timers, or daily deployments**. Their content
is rebuilt in the normal Tuesday Roadbook sync **only when a relevant public
change has occurred**:

- a festival edition has ended since its previous published snapshot, so its
  current/historical classification needs refreshing (typically annually);
- an eligible public Roadbook field changed (for example, lineup addition,
  artist withdrawal, full festival cancellation, dates, venue or edition
  details).

If no relevant public field or completed-edition transition changed, **do
not modify the festival HTML or deploy solely for it**. Compare normalized
public outputs, not sheet revision timestamps, so seller/private/admin edits
never cause a public change. If an event is withdrawn, the static output must
omit it from every affected page and SEO asset; urgent withdrawals are handled
by a manually initiated publish rather than waiting until Tuesday.

This is separate from main Events and artist listings: festival event rows
there still move Upcoming → Past at 05:00 Helsinki time on the day after the
last festival day, without a Netlify production deploy. Festival-page copy,
lineup, and SEO are refreshed by the weekly static generator.
