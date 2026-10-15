import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generate} from './roadbook-tuesday.mjs';
import {buildPublicFeed} from './roadbook-public-feed.mjs';
const snapshot=JSON.parse(await readFile('automation/last-published-public.json','utf8'));
const artists=['Battle Beast','Brymir','Charon','Crimson Sun','Kalmah','KAUAN','Kaunis Kuolematon','Mors Subita','MyGrain','Pat Metheny','Shade Empire','Tarja Turunen','The Man-Eating Tree','Tyrantti','Vorna'];
const E=['Event ID','Status','Date','Event Name','Venue','City','Country','Tour / Series','Client Summary','Public Lineup / Context','Public?','Start Date','End Date','Ticket URL'];
const F=['Event ID','Start Date','End Date','Date','Event','Venue','City','Country','Tour / Series','Public Lineup / Context','Search Bands','Publish','Ticket URL'];
// Full public snapshot plus synthetic routing derived from public names/bands.
// Real internal Roadbook relationship cells are NEVER included in test fixtures.
function synthetic(){
 const events=[E],feed=[F];
 for(const x of snapshot.events){
  const clients=artists.filter(a=>x.bands.some(b=>b.toLowerCase()===a.toLowerCase())||x.name.toLowerCase().includes(a.toLowerCase())).join(', ');
  let series='';
  if(x.start.startsWith('2026-')&&x.name==='Brymir'&&x.start>='2026-09-18'&&x.start<='2026-10-31')series='Brymir — Autumn 2026';
  if(x.start>='2026-10-16'&&x.start<='2026-11-07'&&x.name==='Kaunis Kuolematon'&&/\bwith\s+Insomnium\b/i.test(x.details))series='Kaunis Kuolematon — Autumn 2026';
  if(x.start.startsWith('2026-')&&x.name==='Pat Metheny')series='Pat Metheny — European Tour';
  events.push([x.id,'Confirmed',x.date,x.name,x.venue,x.city,x.country,series,clients,x.details,'Yes',x.start,x.end,x.ticket]);
  feed.push([x.id,x.start,x.end,x.date,x.name,x.venue,x.city,x.country,series,x.details,x.bands.join('|'),'Yes',x.ticket]);
 }
 return {events,feed};
}
const approved=synthetic(),read=filename=>readFile(filename,'utf8'),day='2026-10-14';
test('approved public feed is stable and deleted/private gigs absent',()=>{
 assert.deepEqual(buildPublicFeed(approved,day),{schemaVersion:snapshot.schemaVersion,events:snapshot.events});
 assert.equal(snapshot.events.length,878);
 assert.equal(JSON.stringify(snapshot).includes('EV-2026-0146'),false);
});
test('full preview covers 878 gigs, artists, tours, and preserves original page shells',async()=>{
 const out=await generate(approved,{day,prior:snapshot,read});
 assert.equal(out.totals.publicEvents,878);
 assert.equal(out.totals.artistPages,15);
 assert.equal(out.totals.tourPages,3);
 assert.deepEqual(out.totals.festivalPagesUpdated,[]);
 assert.equal([...out.changed.keys()].some(x=>x.includes('/festivals/')),false);
 const events=out.changed.get('public/events/index.html');assert.ok(events);
 assert.equal((events.match(/class="events-v2__row" data-event-id=/g)||[]).length,878);
 assert.match(events,/Website built by <a href=/);
 assert.match(events,/src="\/assets\/event-rollover\.js"/);
 assert.equal(events.includes('EV-2026-0146'),false);
 const brymir=out.changed.get('public/touring-history/2026-brymir/index.html');assert.ok(brymir);
 assert.match(brymir,/data-event-id="EV-2026-0138"/);
 assert.match(brymir,/Kempele/);
 assert.equal((brymir.match(/class="events-v2__row" data-event-id=/g)||[]).length,13);
});
test('second identical generation has no changes or unnecessary deployment',async()=>{
 const first=await generate(approved,{day,prior:snapshot,read});
 const second=await generate(approved,{day,prior:snapshot,read:p=>first.changed.has(p)?first.changed.get(p):read(p)});
 assert.deepEqual([...second.changed.keys()],[]);
});
test('cancelled gig disappears from public HTML',async()=>{
 const input=synthetic(),i=input.events.findIndex(x=>x[0]==='EV-2026-0122');assert.ok(i>0);
 input.events[i][1]='Cancelled';input.events[i][10]='No';
 const out=await generate(input,{day,prior:snapshot,read});
 assert.equal(out.changed.get('public/events/index.html').includes('data-event-id="EV-2026-0122"'),false);
});
test('festival lineup changes only update affected festival family page',async()=>{
 const input=synthetic();
 const f=input.feed.find(x=>x[4]==='Steelfest'&&x[1].startsWith('2027-'));assert.ok(f);
 const e=input.events.find(x=>x[0]===f[0]);assert.ok(e);
 f[9]+=' New Confirmed Band';e[9]+=' New Confirmed Band';
 const out=await generate(input,{day,prior:snapshot,read});
 assert.ok(out.changed.has('public/festivals/steelfest/index.html'));
 assert.equal(out.changed.has('public/festivals/ankea-festival/index.html'),false);
});
test('stale public location mismatch blocks all publishing',async()=>{
 const input=synthetic();input.feed[1][5]='Incorrect City';
 await assert.rejects(()=>generate(input,{day,prior:snapshot,read}),/Published data mismatch/);
});


test('Withdrawn Kempele event is omitted from tour and does not halt safe publication',async()=>{
 const input=synthetic();
 const i=input.events.findIndex(x=>x[0]==='EV-2026-0138');
 assert.ok(i>0);
 input.events[i][1]='Cancelled';input.events[i][10]='No';
 const out=await generate(input,{day,prior:snapshot,read});
 const tour=out.changed.get('public/touring-history/2026-brymir/index.html');
 assert.ok(tour);
 assert.equal(tour.includes('data-event-id="EV-2026-0138"'),false);
 assert.equal((tour.match(/class="events-v2__row" data-event-id=/g)||[]).length,12);
});
test('Festival ending triggers a dedicated page update even without a ticket URL',async()=>{
 const input=synthetic();
 // Kuolio Fest 2026 concluded September 19; prior snapshot before it ended
 // is simulated to isolate annual edition rollover.
 const before={...snapshot,lastSnapshotDay:'2026-09-18'};
 const out=await generate(input,{day,prior:before,read});
 assert.ok(out.totals.festivalPagesUpdated.includes('Kuolio Fest'));
});
