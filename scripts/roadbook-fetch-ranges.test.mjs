import test from 'node:test';
import assert from 'node:assert/strict';
import {ROADBOOK_RANGES,assembleRoadbookInput,PUBLIC_HEADERS} from './roadbook-fetch-ranges.mjs';
const sample=()=>[{values:[
 [...PUBLIC_HEADERS],
 ['EV-2026-0001','2026-01-01','2026-01-01','1 Jan 2026','Brymir','Venue A','Helsinki','Finland','Brymir — Autumn 2026','with Band B','Brymir|Band B','Yes','https://example.com','Brymir']
]}];
test('only the isolated public spreadsheet tab is read',()=>{
 assert.deepEqual(ROADBOOK_RANGES,["'Public Events'!A1:N2000"]);
});
test('published rows preserve page relationships without private Roadbook data',()=>{
 const v=sample();
 // Populate enough safe sample rows to test the converter without weakening
 // its full-feed floor; each synthetic ID represents a distinct public event.
 for(let i=2;i<=600;i++)v[0].values.push([ 'EV-2026-'+String(i).padStart(4,'0'),...v[0].values[1].slice(1)]);
 const {events,feed}=assembleRoadbookInput(v);
 assert.equal(events.length,601);
 assert.equal(feed.length,601);
 assert.deepEqual(events[0],[
 'Event ID','Status','Date','Event Name','Venue','City','Country','Tour / Series',
 'Client Summary','Public Lineup / Context','Public?','Start Date','End Date','Ticket URL']);
 assert.equal(events[1][1],'Confirmed');
 assert.equal(events[1][8],'Brymir');
 assert.equal(events[1][10],'Yes');
 assert.equal(feed[1][10],'Brymir|Band B');
 assert.ok(!events[0].includes('Seller Notes'));
});
test('invalid headers and missing permissions block publication',()=>{
 const x=sample();
 x[0].values[0][0]='Seller';
 assert.throws(()=>assembleRoadbookInput(x),/header order/);
 const y=sample();
 y[0].values[1][11]='No';
 assert.throws(()=>assembleRoadbookInput(y),/non-approved publish marker/);
});
test('duplicate IDs and sheet formula errors block publication',()=>{
 const x=sample();for(let i=2;i<=600;i++)x[0].values.push([...x[0].values[1]]);
 assert.throws(()=>assembleRoadbookInput(x),/duplicated event ID/);
 const y=sample();y[0].values[1][4]='#REF!';
 assert.throws(()=>assembleRoadbookInput(y),/formula error/);
});
