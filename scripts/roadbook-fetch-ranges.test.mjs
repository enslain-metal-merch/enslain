import test from 'node:test';
import assert from 'node:assert/strict';
import {ROADBOOK_RANGES, assembleRoadbookInput} from './roadbook-fetch-ranges.mjs';

const fragments = () => [
  {values: [
    ['Event ID','Status','Date','Event Name','Venue','City','Country','Tour / Series','Client Summary'],
    ['EV-2026-0001','Confirmed','1 Jan 2026','Brymir','Venue A','Helsinki','Finland','Brymir — Autumn 2026','Brymir'],
    ['EV-2026-0002','Unannounced','2 Jan 2026','Private show','Venue B','Espoo','Finland','','']
  ]},
  {values: [
    ['Public Lineup / Context','Public?'],
    ['with Band B','Yes'],
    ['', 'No']
  ]},
  {values: [
    ['Start Date','End Date'],
    ['2026-01-01','2026-01-01'],
    ['2026-01-02','2026-01-02']
  ]},
  {values: [
    ['Ticket URL'],
    ['https://example.com']
    // Second event has no ticket, so Google omits the trailing row.
  ]},
  {values: [
    ['Event ID','Start Date','End Date','Date','Event','Venue','City','Country','Tour / Series','Public Lineup / Context','Search Bands','Publish','Ticket URL'],
    ['EV-2026-0001','2026-01-01','2026-01-01','1 Jan 2026','Brymir','Venue A','Helsinki','Finland','Brymir — Autumn 2026','with Band B','Brymir|Band B','Yes','https://example.com']
  ]}
];

test('fetch excludes seller and internal note columns instead of downloading full Events rows', () => {
  assert.deepEqual(ROADBOOK_RANGES, ['Events!A1:I2000','Events!M1:N2000','Events!Q1:R2000','Events!T1:T2000',"'Website Feed'!A1:M2000"]);
});
test('sparse columns are joined in row order with original column headers', () => {
  const {events,feed} = assembleRoadbookInput(fragments());
  assert.equal(events[0].length, 14);
  assert.equal(events[1][8], 'Brymir');
  assert.equal(events[1][9], 'with Band B');
  assert.equal(events[1][10], 'Yes');
  assert.equal(events[1][13], 'https://example.com');
  assert.equal(events[2][13], '');
  assert.equal(feed.length, 2);
});
test('unexpected/missing header blocks import instead of publishing misaligned data', () => {
  const v = fragments(); v[1].values[0][0] = 'Seller Notes';
  assert.throws(() => assembleRoadbookInput(v), /changed Events headers/);
  assert.throws(() => assembleRoadbookInput(v.slice(1)), /unexpected sheet range count/);
});
test('trailing fragmented data without an event identity blocks import', () => {
  const v = fragments(); v[2].values.push(['2026-01-03','2026-01-03']);
  assert.throws(() => assembleRoadbookInput(v), /extend beyond event IDs/);
});
