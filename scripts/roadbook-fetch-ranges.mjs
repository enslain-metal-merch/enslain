// The website bot reads ONLY the separate, Viewer-shared public feed.
// All private status/permission checks run in the owner-controlled Roadbook
// "Website Public Export" formula before IMPORTRANGE reaches this file.
export const ROADBOOK_RANGES = ["'Public Events'!A1:N2000"];
export const PUBLIC_HEADERS = [
  'Event ID','Start Date','End Date','Date','Event','Venue','City','Country',
  'Tour / Series','Public Lineup / Context','Search Bands','Publish',
  'Ticket URL','Client Summary'
];
const EVENT_HEADERS = [
  'Event ID','Status','Date','Event Name','Venue','City','Country',
  'Tour / Series','Client Summary','Public Lineup / Context','Public?',
  'Start Date','End Date','Ticket URL'
];
const FEED_HEADERS = PUBLIC_HEADERS.slice(0,13);
const check = (v,msg) => {if(!v) throw Error('Public website feed blocked: '+msg)};
const string = x => String(x ?? '').trim();
export function assembleRoadbookInput(valueRanges) {
  check(Array.isArray(valueRanges) && valueRanges.length === 1,
    'expected exactly one public-only spreadsheet range');
  const values=valueRanges[0]?.values;
  check(Array.isArray(values) && values.length > 1, 'empty public export');
  check(PUBLIC_HEADERS.every((name,i) => values[0]?.[i] === name),
    'changed public export header order');
  const events=[EVENT_HEADERS], feed=[FEED_HEADERS], seen=new Set();
  for (const raw of values.slice(1)) {
    const r=PUBLIC_HEADERS.map((_,i)=>string(raw?.[i]));
    const id=r[0];
    if (!id) {
      check(r.every(x=>!x), 'empty ID with unexpected values');
      continue;
    }
    check(/^EV-\d{4}-\d{4}$/.test(id) && !seen.has(id),'invalid or duplicated event ID');
    seen.add(id);
    check(r[11] === 'Yes', 'non-approved publish marker in isolated feed for '+id);
    check(/^\d{4}-\d{2}-\d{2}$/.test(r[1]) && /^\d{4}-\d{2}-\d{2}$/.test(r[2]),'missing ISO dates '+id);
    check(r[3] && r[4] && r[5] && r[6], 'missing public fields '+id);
    check(!r.some(x=>/^#(?:REF!|ERROR!|N\/A|VALUE!)/.test(x)), 'spreadsheet formula error '+id);
    feed.push(r.slice(0,13));
    // Synthetic source relationship rows; private Events is never read by GitHub.
    // All approval checks happened before these rows entered the isolated file.
    events.push([
      id,'Confirmed',r[3],r[4],r[5],r[6],r[7],r[8],r[13],
      r[9],'Yes',r[1],r[2],r[12]
    ]);
  }
  check(seen.size >= 600,'abnormally small public export');
  return {events,feed};
}
