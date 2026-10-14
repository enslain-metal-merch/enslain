// Stage 1: deterministic, public-only Roadbook projection.
// This does not access Google Sheets, schedule jobs, or publish anything.
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';

const neededEvents = ['Event ID','Status','Public?','Date','Event Name','Venue','City','Country','Public Lineup / Context','Start Date','End Date','Ticket URL'];
const neededFeed = ['Event ID','Publish','Date','Event','Venue','City','Country','Public Lineup / Context','Start Date','End Date','Ticket URL','Search Bands'];
const val = (row, position) => String(row?.[position] ?? '').trim();

function headerMap(rows, required, label) {
  if (!Array.isArray(rows) || rows.length < 2 || !Array.isArray(rows[0])) {
    throw new Error(label + ': missing data');
  }
  const columns = Object.fromEntries(required.map(name => [name, rows[0].indexOf(name)]));
  for (const name of required) {
    if (columns[name] < 0) throw new Error(label + ': missing required column ' + name);
  }
  return columns;
}

export function helsinkiDay(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now).map(x => [x.type, x.value]));
  return [parts.year, parts.month, parts.day].join('-');
}

function safeTicket(raw) {
  if (!raw) return '';
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid upcoming ticket URL'); }
  if (!['https:','http:'].includes(url.protocol)) throw new Error('Unsafe upcoming ticket URL');
  return raw;
}

export function buildPublicFeed(input, day = helsinkiDay()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Invalid Helsinki date');
  const events = input?.events, feed = input?.feed;
  const E = headerMap(events, neededEvents, 'Events');
  const F = headerMap(feed, neededFeed, 'Website Feed');
  const sourceEvents = new Map();
  for (const row of events.slice(1)) {
    const id = val(row, E['Event ID']);
    if (!id) continue;
    if (!/^EV-\d{4}-\d{4}$/.test(id) || sourceEvents.has(id)) {
      throw new Error('Invalid or duplicated event identity');
    }
    sourceEvents.set(id, row);
  }

  const seen = new Set(), published = [];
  for (const row of feed.slice(1)) {
    const id = val(row, F['Event ID']);
    if (!id) continue;
    if (seen.has(id)) throw new Error('Duplicate Website Feed identity');
    seen.add(id);
    const original = sourceEvents.get(id);
    // IMPORTANT: never trust Feed Publish on its own. Every permission must agree.
    if (!original || val(original,E['Status']) !== 'Confirmed' ||
        val(original,E['Public?']) !== 'Yes' || val(row,F['Publish']) !== 'Yes') continue;

    const matching = [
      ['Date','Date'], ['Event','Event Name'], ['Venue','Venue'],
      ['City','City'], ['Country','Country'],
      ['Public Lineup / Context','Public Lineup / Context'],
      ['Start Date','Start Date'], ['End Date','End Date'], ['Ticket URL','Ticket URL']
    ];
    for (const [web,source] of matching) {
      if (val(row,F[web]) !== val(original,E[source])) {
        throw new Error('Published data mismatch for ' + id + ': ' + web);
      }
    }
    const start = val(row,F['Start Date']), end = val(row,F['End Date']);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) {
      throw new Error('Bad public event date for ' + id);
    }
    const bands = [...new Set(val(row,F['Search Bands']).split('|').map(x => x.trim()).filter(Boolean))];
    // Explicit field allowlist: sellers, client records, notes and internal tours never serialize.
    published.push({
      id, start, end,
      date: val(row,F['Date']), name: val(row,F['Event']),
      venue: val(row,F['Venue']), city: val(row,F['City']),
      country: val(row,F['Country']),
      details: val(row,F['Public Lineup / Context']),
      bands,
      // Past ticket URLs remain private in Roadbook, not in public JSON.
      ticket: end >= day ? safeTicket(val(row,F['Ticket URL'])) : ''
    });
  }
  if (!published.length) throw new Error('Empty public output: refused');
  published.sort((a,b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  return { schemaVersion: 1, events: published };
}

export function serializePublicFeed(output) {
  return JSON.stringify(output, null, 2) + '\n';
}

// Never rewrite unchanged bytes; atomic replacement avoids partial public data.
export async function writeFeedIfChanged(filename, output) {
  const next = serializePublicFeed(output);
  let previous;
  try { previous = await readFile(filename, 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous === next) return false;
  await mkdir(dirname(filename), {recursive:true});
  const temporary = filename + '.tmp-' + process.pid;
  try {
    await writeFile(temporary, next, {flag:'wx'});
    await rename(temporary, filename);
  } catch (error) {
    await rm(temporary, {force:true}).catch(() => {});
    throw error;
  }
  return true;
}
