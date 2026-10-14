import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPublicFeed, serializePublicFeed, writeFeedIfChanged } from './roadbook-public-feed.mjs';

const E = ['Event ID','Status','Date','Event Name','Venue','City','Country','Tour / Series',
 'Client Summary','Seller','Assignment Status','Seller Notes','Public Lineup / Context',
 'Public?','Needs Attention','Internal Notes','Start Date','End Date','Source Year','Ticket URL',
 'Min Sellers','Max Sellers','Capacity','Exclude from Finnish Metal Gigs?'];
const F = ['Event ID','Start Date','End Date','Date','Event','Venue','City','Country',
 'Tour / Series','Public Lineup / Context','Search Bands','Publish','Ticket URL'];
function event(id,status='Confirmed',pub='Yes') {
  return [id,status,'15 Nov 2026','Battle Beast','Venue','Helsinki','Finland',
    'SECRET_INTERNAL_TOUR','PRIVATE_CLIENT','PRIVATE_SELLER','Confirmed','PRIVATE_NOTE',
    'with Crimson Sun',pub,'','PRIVATE_INTERNAL_NOTE','2026-11-15','2026-11-15',2026,
    'https://tickets.example/show','','','','No'];
}
function web(id,pub='Yes') {
  return [id,'2026-11-15','2026-11-15','15 Nov 2026','Battle Beast','Venue',
    'Helsinki','Finland','SECRET_INTERNAL_TOUR','with Crimson Sun',
    'Battle Beast | Crimson Sun',pub,'https://tickets.example/show'];
}
function sample() {
  return {events:[E,event('EV-2026-0145'),event('EV-2026-0146','Delete','No'),
   event('EV-2026-0147','Unannounced','No'),event('EV-2026-0148','Cancelled','No')],
   feed:[F,web('EV-2026-0145'),web('EV-2026-0146'),web('EV-2026-0147'),web('EV-2026-0148')]};
}
test('deleted, cancelled and unannounced are never serialized even if Feed says Yes', () => {
 const result = buildPublicFeed(sample(),'2026-10-14');
 assert.deepEqual(result.events.map(e=>e.id),['EV-2026-0145']);
 const json=serializePublicFeed(result);
 for(const privateText of ['EV-2026-0146','EV-2026-0147','EV-2026-0148',
 'SECRET_INTERNAL_TOUR','PRIVATE_CLIENT','PRIVATE_SELLER','PRIVATE_NOTE','PRIVATE_INTERNAL_NOTE'])
   assert.equal(json.includes(privateText),false);
});
test('all three publication permissions are mandatory', () => {
 for(const property of ['status','public','feed']) {
  const data=sample();
  if(property==='status')data.events[1][1]='Unconfirmed';
  if(property==='public')data.events[1][13]='No';
  if(property==='feed')data.feed[1][11]='No';
  assert.throws(()=>buildPublicFeed(data,'2026-10-14'),/Empty public output/);
 }
});
test('past ticket links do not leak, though source values remain untouched', () => {
 const data=sample();
 assert.equal(buildPublicFeed(data,'2026-11-16').events[0].ticket,'');
 assert.equal(data.feed[1][12],'https://tickets.example/show');
 assert.equal(buildPublicFeed(data,'2026-11-15').events[0].ticket,'https://tickets.example/show');
});
test('a changed seller or internal classification does not change public JSON', () => {
 const data=sample(), prior=serializePublicFeed(buildPublicFeed(data,'2026-10-14'));
 data.events[1][9]='Changed seller';data.events[1][7]='Other internal tour';
 assert.equal(serializePublicFeed(buildPublicFeed(data,'2026-10-14')),prior);
});
test('stale/mismatched public source aborts rather than publishing a partial feed', () => {
 const data=sample();data.feed[1][5]='Tampere';
 assert.throws(()=>buildPublicFeed(data,'2026-10-14'),/Published data mismatch/);
});
test('duplicate IDs and missing source columns abort', () => {
 const data=sample();data.feed.push(web('EV-2026-0145'));
 assert.throws(()=>buildPublicFeed(data,'2026-10-14'),/Duplicate Website Feed/);
 const other=sample();other.events[0]=other.events[0].filter(x=>x!=='Status');
 assert.throws(()=>buildPublicFeed(other,'2026-10-14'),/missing required column Status/);
});
test('the writer makes no disk change when content is identical', async () => {
 const folder=await mkdtemp(join(tmpdir(),'enslain-feed-'));
 try {
  const filename=join(folder,'feed.json'),data=buildPublicFeed(sample(),'2026-10-14');
  assert.equal(await writeFeedIfChanged(filename,data),true);
  const first=await readFile(filename,'utf8');
  assert.equal(await writeFeedIfChanged(filename,data),false);
  assert.equal(await readFile(filename,'utf8'),first);
 } finally { await rm(folder,{recursive:true,force:true}); }
});
