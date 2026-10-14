import {readFile,writeFile} from 'node:fs/promises';
import {buildPublicFeed,helsinkiDay} from './roadbook-public-feed.mjs';
// Content-only weekly updater. Preserve full existing site HTML shell and CSS.
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const norm=x=>String(x??'').trim().toLocaleLowerCase('en-US');
const ok=(v,m)=>{if(!v)throw Error('Tuesday build blocked: '+m)};
const artists=[['Battle Beast','battle-beast'],['Brymir','brymir'],['Charon','charon'],['Crimson Sun','crimson-sun'],['Kalmah','kalmah'],['KAUAN','kauan'],['Kaunis Kuolematon','kaunis-kuolematon'],['Mors Subita','mors-subita'],['MyGrain','mygrain'],['Pat Metheny','pat-metheny'],['Shade Empire','shade-empire'],['Tarja Turunen','tarja-turunen'],['The Man-Eating Tree','the-man-eating-tree'],['Tyrantti','tyrantti'],['Vorna','vorna']];
const festivals=[['Ankea Festival','ankea-festival'],['Dark River Festival','dark-river-festival'],['Hatefeast','hatefeast'],['Hellsinki Metal Cruise','hellsinki-metal-cruise'],['Kaaos Festival','kaaos-festival'],['Kuolio Fest','kuolio-fest'],['Lisää Löylyä','lisaa-loylya'],['Saarihelvetti','saarihelvetti'],['Steelfest','steelfest']];
const tours=[{slug:'2026-brymir',name:'2026 - Brymir',series:'Brymir — Autumn 2026',extra:'EV-2026-0138'},{slug:'2026-kaunis-kuolematon',name:'2026 - Kaunis Kuolematon — Tour with Insomnium',series:'Kaunis Kuolematon — Autumn 2026',insomnium:true},{slug:'2026-pat-metheny',name:'2026 - Pat Metheny',series:'Pat Metheny — European Tour'}];
const families={Steelfest:['Steelfest','SteelChaos','SteelHordes'],Saarihelvetti:['Saarihelvetti','Talvihelvetti','Merihelvetti']};
const asc=(a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id);
const desc=(a,b)=>b.end.localeCompare(a.end)||a.id.localeCompare(b.id);
const future=(x,day)=>x.end>=day;
function label(iso){const [y,m,d]=iso.split('-').map(Number);return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)))}
function sourceRelations(input,pub){
 const h=input.events[0],id=h.indexOf('Event ID'),client=h.indexOf('Client Summary'),tour=h.indexOf('Tour / Series');
 ok(id>=0&&client>=0&&tour>=0,'missing Events relationship headers');
 const source=new Map(input.events.slice(1).filter(r=>r[id]).map(r=>[r[id],r]));
 return new Map(pub.map(x=>{const r=source.get(x.id);ok(r,'source ID missing '+x.id);return [x.id,{clients:String(r[client]||'').split(/[,;|]/).map(norm),tour:String(r[tour]||'').trim()}]}));
}
function counts(xs,day){const up=xs.filter(x=>future(x,day)),first=[...xs].sort(asc)[0]?.start?.slice(0,4)||'',next=up.sort(asc)[0]?.start||'';return {up:up.length,past:xs.length-up.length,first,next}}
function artMeta(xs,day){const s=counts(xs,day);return [s.first?s.first+' →':'',s.past?s.past+' past '+(s.past===1?'event':'events'):'',s.up?s.up+' upcoming':''].filter(Boolean).join(' · ')}
const ticket=x=>x.ticket?'<a class="events-v2__ticket" href="'+esc(x.ticket)+'" target="_blank" rel="noopener noreferrer">Tickets ↗</a>':'';
function row(x,day,index=false,ticketCol=false){
 const up=future(x,day),search=norm([x.date,x.name,x.venue,x.city,x.country,x.details,...x.bands].join(' '));
 const meta=index?' data-kind="'+(up?'upcoming':'past')+'" data-bands="'+esc(x.bands.map(norm).join('|'))+'" data-country="'+esc(norm(x.country))+'" data-search="'+esc(search)+'"':'';
 const dt='<time datetime="'+esc(x.start)+'"'+(x.start!==x.end?' data-end-date="'+esc(x.end)+'"':'')+'>'+esc(x.date)+'</time>';
 const td=(k,v)=>'<td data-label="'+k+'">'+esc(v)+'</td>';
 return '<tr class="events-v2__row" data-event-id="'+esc(x.id)+'"'+meta+'><td class="events-v2__date" data-label="Date">'+dt+'</td><td class="events-v2__name" data-label="Event"><strong>'+esc(x.name)+'</strong></td><td class="events-v2__context-cell" data-label="Details">'+(x.details?'<span class="events-v2__context">'+esc(x.details)+'</span>':'')+'</td>'+td('Venue',x.venue)+td('City',x.city)+td('Country',x.country)+(up||ticketCol?'<td class="events-v2__tickets" data-label="Tickets">'+(up?ticket(x):'')+'</td>':'')+'</tr>';
}
function table(xs,day,tickets){
 return '<div class="events-v2__table-wrap"><table class="events-v2__table"><thead><tr>'+['Date','Event','Details','Venue','City','Country',...(tickets?['Tickets']:[])].map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+xs.map(x=>row(x,day,false,tickets)).join('\n')+'</tbody></table></div>';
}
function replace(html,re,newValue,what){ok(re.test(html),'missing '+what+' markup');re.lastIndex=0;return html.replace(re,newValue)}
export function renderEvents(html,events,day){
 for(const kind of ['upcoming','past']){
  const xs=events.filter(x=>future(x,day)===(kind==='upcoming')).sort(kind==='upcoming'?asc:desc);
  const re=new RegExp('(<section class="events-v2__group" id="'+kind+'-events"[\\s\\S]*?<tbody>)[\\s\\S]*?(</tbody>[\\s\\S]*?</section>)');
  const m=html.match(re);ok(m,'missing '+kind+' group');
  html=html.replace(m[0],m[1]+'\n'+xs.map(x=>row(x,day,true)).join('\n')+'\n'+m[2]);
  const count=new RegExp('(<section class="events-v2__group" id="'+kind+'-events"[\\s\\S]*?<div class="events-v2__group-heading"[\\s\\S]*?<span>)[^<]*(</span>)');
  html=replace(html,count,(_,a,b)=>a+xs.length+' events'+b,kind+' count');
 }
 const bs=[...new Set(events.flatMap(x=>x.bands))].sort((a,b)=>a.localeCompare(b,'en'));
 const cs=[...new Set(events.map(x=>x.country))].sort((a,b)=>a.localeCompare(b,'en'));
 html=replace(html,/<select id="events-band">[\s\S]*?<\/select>/,'<select id="events-band"><option value="">All bands</option>'+bs.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('')+'</select>','band selector');
 html=replace(html,/<select id="events-country">[\s\S]*?<\/select>/,'<select id="events-country"><option value="">All countries</option>'+cs.map(x=>'<option value="'+esc(norm(x))+'">'+esc(x)+'</option>').join('')+'</select>','country selector');
 html=replace(html,/<p id="events-summary"[^>]*>[^<]*<\/p>/,'<p id="events-summary" aria-live="polite">'+events.length+' confirmed public events</p>','event count');
 ok((html.match(/<tr class="events-v2__row" data-event-id=/g)||[]).length===events.length,'wrong public row count');
 return html;
}
export function renderArtist(html,events,day){
 const re=/<h2>(Upcoming gigs|Past events)<\/h2><div class="events-v2__table-wrap">[\s\S]*?<\/table><\/div>/g;
 const matches=[...html.matchAll(re)];ok(matches.length>=1&&matches.length<=2,'artist tables');
 const a=matches[0].index,z=matches[matches.length-1],b=z.index+z[0].length;
 const upcoming=events.filter(x=>future(x,day)).sort(asc),past=events.filter(x=>!future(x,day)).sort(desc);
 const inner=(upcoming.length?'<h2>Upcoming gigs</h2>'+table(upcoming,day,true):'')+(past.length?'<h2>Past events</h2>'+table(past,day,false):'');
 html=html.slice(0,a)+inner+html.slice(b);
 const lead=html.match(/<p class="roadbook-lead">([^<]*)<\/p>/);
 if(lead&&/past events?|upcoming/.test(lead[1]))html=html.replace(lead[0],'<p class="roadbook-lead">'+esc(artMeta(events,day))+'</p>');
 ok((html.match(/class="events-v2__row" data-event-id=/g)||[]).length===events.length,'artist data count');
 return html;
}
function updateDirectory(html,slug,category,newMeta){
 const route='/'+category+'/'+slug+'/';
 const re=new RegExp('(<li class="roadbook-directory__item">[\\s\\S]*?<a class="roadbook-directory__link" href="'+route+'">[\\s\\S]*?<p class="roadbook-directory__meta">)[\\s\\S]*?(</p>)');
 return replace(html,re,(_,a,b)=>a+esc(newMeta)+b,'directory '+route);
}
function festivalMatch(x,name){const value=norm(x.name),target=norm(name);if(name==='Steelfest')return /steelfest|steelchaos|steelhordes/.test(value);if(name==='Saarihelvetti')return /saarihelvetti|talvihelvetti|merihelvetti/.test(value);return value===target||value.startsWith(target+' ')}
function edition(x,day){const xs=x.bands.filter(b=>norm(b)!==norm(x.name));return '<article class="roadbook-edition" data-event-id="'+esc(x.id)+'"><p class="roadbook-edition__date">'+esc(x.date)+'</p><h3>'+esc(x.name)+'</h3><p class="roadbook-edition__place">'+esc(x.venue)+' · '+esc(x.city)+'</p>'+(xs.length?'<p class="roadbook-edition__featured">'+xs.slice(0,5).map(esc).join(' · ')+'</p>':'')+(xs.length>5?'<p class="roadbook-edition__bands">'+xs.slice(5).map(esc).join(' · ')+'</p>':'')+(future(x,day)?ticket(x):'')+'</article>'}
export function renderFestival(html,name,events,day){
 events=[...events].sort((a,b)=>b.start.localeCompare(a.start));
 if(!families[name])return replace(html,/<div class="roadbook-editions">[\s\S]*?<\/div>/,'<div class="roadbook-editions">'+events.map(x=>edition(x,day)).join('\n')+'</div>','festival '+name);
 const children=families[name],key=x=>norm(x).replace(/[^a-z0-9]/g,'');
 const nav='<nav class="roadbook-family-nav" aria-label="'+esc(name)+' family">'+children.map(x=>'<a href="#'+key(x)+'">'+esc(x)+'</a>').join('')+'</nav>';
 const sections=children.map((child,i)=>{const xs=events.filter(x=>i===0?!children.slice(1).some(c=>norm(x.name).includes(norm(c))):norm(x.name).includes(norm(child)));return xs.length?'<section class="roadbook-family-section"><h2 id="'+key(child)+'">'+esc(child)+'</h2>'+xs.map(x=>edition(x,day)).join('\n')+'</section>':''}).join('');
 return replace(html,/<nav class="roadbook-family-nav"[\s\S]*?<\/nav>(?:<section class="roadbook-family-section"[\s\S]*?<\/section>)+/,nav+sections,'festival family '+name);
}
export function renderTour(html,events,day){
 ok(html.includes('data-tour-dates'),'not a one-table tour');
 const t=events.some(x=>future(x,day));
 html=replace(html,/(<main[^>]*data-tour-dates[^>]*>[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>)/,(_,a,b)=>a+events.map(x=>row(x,day,false,t)).join('\n')+b,'tour body');
 const head='<tr>'+['Date','Event','Details','Venue','City','Country',...(t?['Tickets']:[])].map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr>';
 html=replace(html,/(<main[^>]*data-tour-dates[^>]*>[\s\S]*?<thead>)[\s\S]*?(<\/thead>)/,(_,a,b)=>a+head+b,'tour table header');
 ok((html.match(/class="events-v2__row" data-event-id=/g)||[]).length===events.length,'tour row count');
 return html;
}
function festivalChanged(prior,current,day){
 if(!prior)return festivals.map(x=>x[0]);
 ok(/^\d{4}-\d{2}-\d{2}$/.test(prior.lastSnapshotDay||''),'missing baseline day for edition transitions');
 const a=new Map(prior.events.map(x=>[x.id,x])),b=new Map(current.events.map(x=>[x.id,x])),found=new Set();
 for(const id of new Set([...a.keys(),...b.keys()])){
  const x=a.get(id),y=b.get(id);if(JSON.stringify(x)===JSON.stringify(y))continue;
  for(const [name] of festivals)if((x&&festivalMatch(x,name))||(y&&festivalMatch(y,name)))found.add(name);
 }
 for(const [name] of festivals){
  if(current.events.some(x=>festivalMatch(x,name)&&x.end>=prior.lastSnapshotDay&&x.end<day))found.add(name);
 }
 return [...found];
}
export async function generate(input,{day=helsinkiDay(),prior,read}={}){
 ok(read,'read callback required');
 const next=buildPublicFeed(input,day),pub=next.events;ok(pub.length>=600,'abnormally small approved publication');
 const rel=sourceRelations(input,pub);
 const arts=new Map(artists.map(([name])=>[name,pub.filter(x=>rel.get(x.id)?.clients.includes(norm(name)))]));
 const fests=new Map(festivals.map(([name])=>[name,pub.filter(x=>festivalMatch(x,name))]));
 for(const [name,xs] of [...arts,...fests])ok(xs.length>0,'missing approved content for '+name);
 const ts=new Map(tours.map(t=>{
  const xs=pub.filter(x=>rel.get(x.id)?.tour===t.series&&(!t.insomnium||/\bwith\s+Insomnium\b/i.test(x.details)));
  if(t.extra){const e=pub.find(x=>x.id===t.extra);if(e&&!xs.some(x=>x.id===e.id))xs.push(e);}
  xs.sort(asc);ok(xs.length>=8,'less than 8 tour events '+t.name);return [t.slug,xs];
 }));
 const changed=new Map(),path=x=>'public/'+x+'/index.html';
 async function propose(name,fn){const original=await read(name);ok(original.includes('Website built by <a href='),'missing approved page shell '+name);const rendered=fn(original);ok(rendered.includes('Website built by <a href='),'footer removed '+name);if(rendered!==original)changed.set(name,rendered);}
 await propose(path('events'),h=>renderEvents(h,pub,day));
 for(const [name,slug] of artists)await propose(path('artists/'+slug),h=>renderArtist(h,arts.get(name),day));
 await propose(path('artists'),h=>{for(const [name,slug] of artists)h=updateDirectory(h,slug,'artists',artMeta(arts.get(name),day));return h});
 for(const t of tours)await propose(path('touring-history/'+t.slug),h=>renderTour(h,ts.get(t.slug),day));
 await propose(path('touring-history'),h=>{for(const t of tours){const xs=ts.get(t.slug);const summary=xs.length+' gigs · '+label(xs[0].start)+' – '+label([...xs].sort((a,b)=>b.end.localeCompare(a.end))[0].end);const marker='<a href="/touring-history/'+t.slug+'/">'+t.name+'</a><span>';ok(h.includes(marker),'tour index '+t.slug);const start=h.indexOf(marker)+marker.length,end=h.indexOf('</span>',start);h=h.slice(0,start)+esc(summary)+h.slice(end);}return h});
 const changedFestivals=festivalChanged(prior,next,day);
 for(const [name,slug] of festivals)if(changedFestivals.includes(name))await propose(path('festivals/'+slug),h=>renderFestival(h,name,fests.get(name),day));
 if(changedFestivals.length)await propose(path('festivals'),h=>{for(const [name,slug] of festivals){const s=counts(fests.get(name),day);const m=[s.first?s.first+' →':'',s.past?s.past+' past '+(s.past===1?'event':'events'):'',s.next?'Next '+label(s.next):''].filter(Boolean).join(' · ');h=updateDirectory(h,slug,'festivals',m)}return h});
 return {changed,next,totals:{publicEvents:pub.length,artistPages:artists.length,festivalPagesUpdated:changedFestivals,tourPages:tours.length}};
}
export async function command({inputFile,day=helsinkiDay(),write=false}={}){
 const input=JSON.parse(await readFile(inputFile,'utf8'));
 const prior=JSON.parse(await readFile('automation/last-published-public.json','utf8'));
 const output=await generate(input,{day,prior,read:p=>readFile(p,'utf8')});
 const publicChanged=JSON.stringify(output.next.events)!==JSON.stringify(prior.events);
 output.next.lastSnapshotDay=(output.changed.size||publicChanged)?day:prior.lastSnapshotDay;
 const current=JSON.stringify(output.next,null,2)+'\n',old=JSON.stringify(prior,null,2)+'\n';
 if(current!==old)output.changed.set('automation/last-published-public.json',current);
 if(write)for(const [filename,content] of output.changed)await writeFile(filename,content,'utf8');
 return {totals:output.totals,changedFiles:[...output.changed.keys()]};
}
if(process.argv[1]?.endsWith('roadbook-tuesday.mjs')){
 const mode=process.argv[2];ok(mode==='--dry-run'||mode==='--write','use --dry-run or --write');
 command({inputFile:process.env.ROADBOOK_INPUT_FILE||'',day:process.env.ROADBOOK_TEST_DAY||helsinkiDay(),write:mode==='--write'})
 .then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e.message);process.exitCode=1});
}
