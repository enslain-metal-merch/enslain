import fs from 'node:fs'; import assert from 'node:assert/strict';
const root=process.argv[2]||'public',read=p=>fs.readFileSync(root+'/'+p,'utf8');
const errors=[],check=(b,m)=>{if(!b)errors.push(m)};
const list=dir=>fs.readdirSync(root+'/'+dir,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name);
const artists=list('artists'),festivals=list('festivals'),tours=list('touring-history');
check(artists.length===15,'artist registry count '+artists.length);
check(festivals.length===9,'festival registry count '+festivals.length);
check(tours.length>=3,'tour detail pages missing');
const events=read('events/index.html'),ids=[...events.matchAll(/data-event-id="(EV-[0-9]{4}-[0-9]{4})"/g)].map(m=>m[1]);
check(ids.length>=800,'public event count collapse: '+ids.length);
check(ids.length===new Set(ids).size,'duplicate public Event IDs');
check(!events.includes('EV-2026-0146'),'deleted Battle Beast gig leaked');
check(events.includes('id="events-band"')&&events.includes('id="events-timing"')&&events.includes('id="events-country"'),'Events filters missing');
check(events.includes('option value="all" selected')&&!events.includes('option value="upcoming" selected'),'All Events is not default');
check(read('assets/events.js').includes('timing.value="all"'),'Clear filters does not restore All Events');
for(const p of ['events/index.html',...artists.map(n=>'artists/'+n+'/index.html')]){
 const html=read(p);check(html.includes('/assets/event-rollover.js'),p+': Helsinki rollover missing');
 check(!html.includes('EV-2026-0146'),p+': deleted gig leaked');
}
for(const n of tours){
 const html=read('touring-history/'+n+'/index.html');
 check((html.match(/<h2>Tour dates<\/h2>/g)||[]).length===1,n+': chronological tour table missing');
 check(!/<h2>(Upcoming gigs|Past events)<\/h2>/.test(html),n+': old split tour layout');
 check(html.includes('/assets/event-rollover.js'),n+': ticket expiry missing');
}
if(process.env.ROADBOOK_REQUIRE_KEMPELE==='1'){
 const b=read('touring-history/2026-brymir/index.html');
 check(b.includes('Kempele')&&b.includes('ZRock Christmas Special'),'Brymir 6 Nov 2026 Kempele tour membership missing');
}
for(const n of festivals){const html=read('festivals/'+n+'/index.html');check(!html.includes('/assets/event-rollover.js'),n+': daily festival JS forbidden');}
const pages=['index.html','events/index.html','clients/index.html','artists/index.html','festivals/index.html','touring-history/index.html',...artists.map(n=>'artists/'+n+'/index.html'),...festivals.map(n=>'festivals/'+n+'/index.html'),...tours.map(n=>'touring-history/'+n+'/index.html')];
for(const p of pages){const html=read(p);check(html.includes('Enslain Metal Merch</title>'),p+': branded title missing');check(html.includes('rel="canonical"'),p+': canonical missing');check(html.includes('/assets/script-min.js'),p+': shared analytics/theme script missing');}
check(read('sitemap.xml').includes('https://www.enslain.net/events/'),'sitemap Events missing');
check(read('robots.txt').includes('sitemap.xml'),'robots sitemap missing');
console.log('Release gate checked '+ids.length+' events, '+artists.length+' artists, '+festivals.length+' festivals, '+tours.length+' tours.');
if(errors.length){for(const e of errors)console.error('FAIL '+e);process.exitCode=1;}else console.log('PASS static invariants. Source privacy requires separate live Roadbook validation.');
