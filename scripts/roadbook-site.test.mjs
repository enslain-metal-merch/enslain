import test from 'node:test';
import assert from 'node:assert/strict';
import {curate,helsinkiDay,renderEvents} from './roadbook-site.mjs';
const E=['Event ID','Status','Date','Event Name','Venue','City','Country','Tour / Series','Client Summary','Seller','Assignment Status','Seller Notes','Public Lineup / Context','Public?','Needs Attention','Internal Notes','Start Date','End Date','Source Year','Ticket URL'];
const F=['Event ID','Start Date','End Date','Date','Event','Venue','City','Country','Tour / Series','Public Lineup / Context','Search Bands','Publish','Ticket URL'];
function event(id,status,pub,details='',date='2026-10-16'){return [id,status,'16 Oct 2026','Kaunis Kuolematon','House of Rock','Kouvola','Finland','CONFIDENTIAL_GROUP','Kaunis Kuolematon','PRIVATE_SELLER','Confirmed','PRIVATE_NOTES',details,pub,'','PRIVATE_INTERNAL',date,date,2026,'https://example.com/tickets']}
function feed(id,details='',date='2026-10-16'){return [id,date,date,'16 Oct 2026','Kaunis Kuolematon','House of Rock','Kouvola','Finland','CONFIDENTIAL_GROUP',details,'Kaunis Kuolematon | Insomnium','Yes','https://example.com/tickets']}
const rows={events:[E,event('EV-2026-0001','Confirmed','Yes','with Insomnium'),event('EV-2026-0002','Unconfirmed','Yes'),event('EV-2026-0003','Unannounced','No')],feed:[F,feed('EV-2026-0001','with Insomnium'),feed('EV-2026-0002'),feed('EV-2026-0003')]};
test('unconfirmed and unannounced never appear, even if Feed Publish=Yes',()=>{const x=curate(rows.events,rows.feed,'2026-10-12');assert.equal(x.publicEvents.length,1);const dump=JSON.stringify(x.publicEvents);for(const token of ['EV-2026-0002','EV-2026-0003','PRIVATE_SELLER','PRIVATE_INTERNAL','CONFIDENTIAL_GROUP'])assert.equal(dump.includes(token),false)});
test('confirmed + Public? Yes + Feed Yes are all required',()=>{const v=JSON.parse(JSON.stringify(rows));v.events[1][13]='No';assert.throws(()=>curate(v.events,v.feed,'2026-10-12'),/empty public output/)});
test('tickets disappear automatically after the gig date',()=>{const f=curate(rows.events,rows.feed,'2026-10-12');const p=curate(rows.events,rows.feed,'2026-10-17');assert.equal(f.upcoming.length,1);assert.ok(f.upcoming[0].ticket);assert.equal(p.past.length,1);assert.equal(p.past[0].ticket,'')});
test('incorrect or stale Feed content aborts build',()=>{const v=JSON.parse(JSON.stringify(rows));v.feed[1][9]='not same as Events';assert.throws(()=>curate(v.events,v.feed,'2026-10-12'),/mismatch/)});
test('duplicate Event IDs abort build',()=>{const v=JSON.parse(JSON.stringify(rows));v.feed.push(v.feed[1]);assert.throws(()=>curate(v.events,v.feed,'2026-10-12'),/duplicate/)});
test('Helsinki date handles DST',()=>{assert.equal(helsinkiDay(new Date('2026-10-25T01:30:00Z')),'2026-10-25');assert.equal(helsinkiDay(new Date('2026-10-25T22:30:00Z')),'2026-10-26')});

test('rebuild removes previously published rows when they become private',()=>{
 const data=curate(rows.events,rows.feed,'2026-10-12');
 const page='<p id="events-summary" aria-live="polite">old events</p><select id="events-band"></select><select id="events-country"></select>'+
 '<section class="events-v2__group" id="upcoming-events"><div class="events-v2__group-heading"><span>2 events</span></div><table><tbody><tr data-event-id="EV-2026-0002">old private event</tr></tbody></table></section>'+
 '<section class="events-v2__group" id="past-events"><div class="events-v2__group-heading"><span>0 events</span></div><table><tbody></tbody></table></section>';
 const html=renderEvents(page,data);
 assert.equal(html.includes('EV-2026-0002'),false);
 assert.equal(html.includes('EV-2026-0003'),false);
 assert.equal(html.includes('SECRET_INTERNAL_TOUR'),false);
 assert.equal((html.match(/data-event-id=/g)||[]).length,1);
});
