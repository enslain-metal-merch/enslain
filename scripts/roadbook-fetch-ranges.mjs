// Read only the event columns needed for permission checks and public-page relationships.
// Deliberately skip Events J:L (seller data), O:P (internal warnings/notes),
// and S (source year). The service account's spreadsheet Viewer permission
// remains wider than these API requests.
export const EVENT_SEGMENTS = [
  {range: 'Events!A1:I2000', headers: ['Event ID', 'Status', 'Date', 'Event Name', 'Venue', 'City', 'Country', 'Tour / Series', 'Client Summary']},
  {range: 'Events!M1:N2000', headers: ['Public Lineup / Context', 'Public?']},
  {range: 'Events!Q1:R2000', headers: ['Start Date', 'End Date']},
  {range: 'Events!T1:T2000', headers: ['Ticket URL']}
];
export const ROADBOOK_RANGES = [...EVENT_SEGMENTS.map(x => x.range), "'Website Feed'!A1:M2000"];
const check = (condition, message) => {if (!condition) throw Error('Roadbook import blocked: ' + message)};

export function assembleRoadbookInput(valueRanges) {
  check(Array.isArray(valueRanges) && valueRanges.length === ROADBOOK_RANGES.length, 'unexpected sheet range count');
  const fragments = EVENT_SEGMENTS.map((segment,i) => {
    const values = valueRanges[i]?.values;
    check(Array.isArray(values) && values.length >= 2, 'missing Events range ' + segment.range);
    check(segment.headers.every((header,j) => values[0]?.[j] === header), 'changed Events headers in ' + segment.range);
    return values;
  });
  const rows = fragments[0].length;
  for (let i = 1; i < fragments.length; i++) {
    check(fragments[i].slice(rows).every(row => !row?.some(cell => String(cell ?? '').trim())), 'Events fragments extend beyond event IDs');
  }
  const events = Array.from({length: rows}, (_, rowIndex) =>
    EVENT_SEGMENTS.flatMap((segment, i) =>
      Array.from({length: segment.headers.length}, (_, columnIndex) => fragments[i][rowIndex]?.[columnIndex] ?? '')
    )
  );
  const feed = valueRanges[EVENT_SEGMENTS.length]?.values;
  check(Array.isArray(feed) && feed.length >= 2, 'missing Website Feed range');
  return {events, feed};
}
