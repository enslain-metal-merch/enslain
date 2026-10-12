import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const norm=v=>String(v??'').trim().toLocaleLowerCase('en-US');
const clean=v=>String(v??'').trim();
const requireOk=(b,m)=>{if(!b)throw Error('Roadbook build blocked: '+m)};
const ROOT=process.cwd(),SITE='https://www.enslain.net';
export function helsinkiDay(d=new Date()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Helsinki',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).map(v=>[v.type,v.value]));
 return p.year+'-'+p.month+'-'+p.day;
}
function columns(header,names){return Object.fromEntries(names.map(n=>{const i=header.indexOf(n);requireOk(i>=0,'missing column '+n);return [n,i]}))}
export function curate(evs,feeds,day=helsinkiDay()){
 requireOk(evs?.length>1&&feeds?.length>1,'missing source data');
 const E=columns(evs[0],['Event ID','Status','Public?','Event Name','Venue','City','Country','Public Lineup / Context','Client Summary','Tour / Series','Start Date','End Date','Ticket URL']);
 const F=columns(feeds[0],['Event ID','Publish','Date','Event','Venue','City','Country','Public Lineup / Context','Start Date','End Date','Ticket URL','Search Bands']);
 const em=new Map,seen=new Set,publicEvents=[],relations=new Map;
 for(const r of evs.slice(1)){const id=clean(r[E['Event ID']]);if(!id)continue;requireOk(/^EV-\d{4}-\d{4}$/.test(id)&&!em.has(id),'bad or duplicate Events ID');em.set(id,r)}
 for(const f of feeds.slice(1)){
  const id=clean(f[F['Event ID']]);if(!id)continue;requireOk(!seen.has(id),'duplicate Feed ID');seen.add(id);
  const e=em.get(id);
  if(!e||clean(e[E['Status']])!=='Confirmed'||clean(e[E['Public?']])!=='Yes'||clean(f[F['Publish']])!=='Yes')continue;
  const pairs=[['Event','Event Name'],['Venue','Venue'],['City','City'],['Country','Country'],['Public Lineup / Context','Public Lineup / Context'],['Start Date','Start Date'],['End Date','End Date'],['Ticket URL','Ticket URL']];
  for(const [a,b] of pairs)requireOk(clean(f[F[a]])===clean(e[E[b]]),'public data mismatch');
  const start=clean(f[F['Start Date']]),end=clean(f[F['End Date']]);
  requireOk(/^\d{4}-\d{2}-\d{2}$/.test(start)&&/^\d{4}-\d{2}-\d{2}$/.test(end)&&start<=end,'bad dates');
  requireOk(['Date','Event','Venue','City','Country'].every(k=>clean(f[F[k]])),'missing public field');
  const upcoming=end>=day;
  const item={id,start,end,upcoming,date:clean(f[F['Date']]),name:clean(f[F['Event']]),venue:clean(f[F['Venue']]),city:clean(f[F['City']]),country:clean(f[F['Country']]),details:clean(f[F['Public Lineup / Context']]),bands:[...new Set(clean(f[F['Search Bands']]).split('|').map(clean).filter(Boolean))],ticket:upcoming&&/^https:\/\/[^\s"'<>]+$/.test(clean(f[F['Ticket URL']]))?clean(f[F['Ticket URL']]):''};
  publicEvents.push(item);
  relations.set(id,{clients:clean(e[E['Client Summary']]).split(/[,;|]/).map(norm),internalTour:clean(e[E['Tour / Series']])});
 }
 requireOk(publicEvents.length>0,'empty public output');
 const upcoming=publicEvents.filter(x=>x.upcoming).sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
 const past=publicEvents.filter(x=>!x.upcoming).sort((a,b)=>b.end.localeCompare(a.end)||b.id.localeCompare(a.id));
 return {publicEvents,upcoming,past,relations};
}


function publicDetails(x){
 // Contextual links must be rare, specifically public and explicitly verified.
 if(x.id==='EV-2026-0063'&&x.details==='feat. Charon')
  return 'feat. <a class="roadbook-context-link" href="/artists/charon/">Charon</a>';
 return esc(x.details);
}
function row(x,allowContextLink=false){
 const search=norm([x.date,x.name,x.venue,x.city,x.country,x.details,...x.bands].join(' '));
 const c=(label,v)=>'<td data-label="'+label+'">'+esc(v)+'</td>';
 const ticket=x.upcoming?'<td class="events-v2__tickets" data-label="Tickets">'+(x.ticket?'<a class="events-v2__ticket" href="'+esc(x.ticket)+'" target="_blank" rel="noopener noreferrer">Tickets ↗</a>':'')+'</td>':'';
 return '<tr class="events-v2__row" data-event-id="'+esc(x.id)+'" data-kind="'+(x.upcoming?'upcoming':'past')+'" data-bands="'+esc(x.bands.map(norm).join('|'))+'" data-country="'+esc(norm(x.country))+'" data-search="'+esc(search)+'">'+
 '<td class="events-v2__date" data-label="Date"><time datetime="'+esc(x.start)+'">'+esc(x.date)+'</time></td>'+
 '<td class="events-v2__name" data-label="Event"><strong>'+esc(x.name)+'</strong></td>'+
 '<td class="events-v2__context-cell" data-label="Details">'+(x.details?'<span class="events-v2__context">'+(allowContextLink?publicDetails(x):esc(x.details))+'</span>':'')+'</td>'+
 c('Venue',x.venue)+c('City',x.city)+c('Country',x.country)+ticket+'</tr>';
}
export function renderEvents(html,data){
 for(const kind of ['upcoming','past']){
  const rec=data[kind],marker=new RegExp('(<section class="events-v2__group" id="'+kind+'-events"[\\s\\S]*?<tbody>)[\\s\\S]*?(</tbody>[\\s\\S]*?</section>)'),m=html.match(marker);
  requireOk(m,'missing '+kind+' section');
  const section=m[0].replace(/<tbody>[\s\S]*?<\/tbody>/,'<tbody>'+rec.map(x=>row(x,true)).join('\n')+'</tbody>').replace(/(<div class="events-v2__group-heading">[\s\S]*?<span>)\d+ events(<\/span>)/,'$1'+rec.length+' events$2');
  html=html.replace(m[0],section);
 }
 const bands=[...new Set(data.publicEvents.flatMap(x=>x.bands))].sort((a,b)=>a.localeCompare(b,'en'));
 const countries=[...new Set(data.publicEvents.map(x=>x.country))].sort((a,b)=>a.localeCompare(b,'en'));
 requireOk(html.includes('<select id="events-band">')&&html.includes('<select id="events-country">'),'filters missing');
 html=html.replace(/<select id="events-band">[\s\S]*?<\/select>/,'<select id="events-band"><option value="">All bands</option>'+bands.map(b=>'<option value="'+esc(b)+'">'+esc(b)+'</option>').join('')+'</select>');
 html=html.replace(/<select id="events-country">[\s\S]*?<\/select>/,'<select id="events-country"><option value="">All countries</option>'+countries.map(c=>'<option value="'+esc(norm(c))+'">'+esc(c)+'</option>').join('')+'</select>');
 html=html.replace(/<p id="events-summary"[^>]*>[^<]*<\/p>/,'<p id="events-summary" aria-live="polite">'+data.publicEvents.length+' events found</p>');
 requireOk((html.match(/data-event-id=/g)||[]).length===data.publicEvents.length,'rendered event count mismatch');
 return html;
}
function wrap(shell,title,description,path,body){
 const start=shell.indexOf('<main class="main events-v2"'),end=shell.indexOf('</main>',start);
 requireOk(start>=0&&end>start,'site shell unavailable');
 let h=shell.slice(0,start)+body+shell.slice(end+7);
 h=h.replace(/<title>[^<]*<\/title>/,'<title>'+esc(title)+' | Enslain Metal Merch</title>').replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+esc(description)+'">');
 h=h.replace('</head>','<link rel="canonical" href="'+SITE+path+'"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><link rel="stylesheet" href="/assets/roadbook-pages.css"></head>');
 return h.replace('<script src="/assets/events.js" defer></script>','').replace(/(<a href="\/events\/") aria-current="page"/,'$1').replace(/(<a href="\/clients\/")>(Clients)<\/a>/,'$1 aria-current="page">$2</a>');
}
function content(title,intro,items,trail){
 return '<main class="main events-v2 roadbook-page"><div class="wrapper roadbook-page__body"><nav class="roadbook-breadcrumbs" aria-label="Breadcrumb"><a href="/events/">Events</a> / '+trail.map(esc).join(' / ')+'</nav><h1>'+esc(title)+'</h1>'+(intro?'<p class="roadbook-lead">'+esc(intro)+'</p>':'')+items+'<p class="roadbook-back"><a href="/events/">← All events</a></p></div></main>';
}
function table(items){
 const upcoming=items.filter(x=>x.upcoming).sort((a,b)=>a.start.localeCompare(b.start)),past=items.filter(x=>!x.upcoming).sort((a,b)=>b.end.localeCompare(a.end));
 const block=(xs,isUpcoming)=>{if(!xs.length)return '';const fields=['Date','Event','Details','Venue','City','Country'];if(isUpcoming)fields.push('Tickets');return '<h2>'+(isUpcoming?'Upcoming gigs':'Past events')+'</h2><div class="events-v2__table-wrap"><table class="events-v2__table"><thead><tr>'+fields.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+xs.map(row).join('\n')+'</tbody></table></div>';};
 return block(upcoming,true)+block(past,false);
}

function slug(value){return norm(value).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
const artistNames=['Kalmah','Crimson Sun','Tyrantti','Shade Empire','Brymir','Kaunis Kuolematon','Battle Beast','KAUAN','Tarja Turunen','The Man-Eating Tree','Charon','Vorna','Pat Metheny','Mors Subita','MyGrain'];
const festivalNames=['Ankea Festival','Dark River Festival','Hatefeast','Hellsinki Metal Cruise','Kaaos Festival','Kuolio Fest','Lisää Löylyä','Saarihelvetti','Steelfest'];
const tourSummary=[["2000 - In Flames + Nevermore","24 gigs · 22 Nov 2000 – 20 Dec 2000"],["2005 - Vader + Decapitated + Dew-Scented","23 gigs · 7 Nov 2005 – 30 Nov 2005"],["2006 - Hypocrisy + Decapitated","28 gigs · 12 Jan 2006 – 12 Feb 2006"],["2007 - To/Die/For + Virgin Black + Urn","8 gigs · 3 Jan 2007 – 12 Jan 2007"],["2015 - Steelwing + Noctum","13 gigs · 31 Aug 2015 – 12 Sep 2015"],["2016 - Possessed + Belphegor + Absu","16 gigs · 3 Dec 2016 – 20 Dec 2016"],["2017 - Amberian Dawn + Diabulus in Musica + Crimson Sun","10 gigs · 10 Feb 2017 – 19 Feb 2017"],["2017 - The Vision Bleak + Nocte Obducta + Saille","10 gigs · 29 Sep 2017 – 8 Oct 2017"],["2017 - Kalmah + Nothgard + Heretoir + Lost in Grey","10 gigs · 1 Dec 2017 – 10 Dec 2017"],["2018 - Kalmah + Vreid + Slegest","11 gigs · 5 Dec 2018 – 15 Dec 2018"],["2019 - Kalmah + Vreid","14 gigs · 17 Apr 2019 – 1 May 2019"],["2019 - Kalmah + Abigail Williams","22 gigs · 14 Nov 2019 – 8 Dec 2019"],["2023 - Kalmah + Mors Subita + Suotana","8 gigs · 30 Mar 2023 – 15 Apr 2023"],["2023 - Marko Hietala","11 gigs · 15 Apr 2023 – 30 Apr 2023"],["2024 - Battle Beast","22 gigs · 9 May 2024 – 15 Jun 2024"],["2024 - Mors Subita + Brymir","9 gigs · 10 Oct 2024 – 30 Nov 2024"],["2025 - Tarja Turunen + Marko Hietala","22 gigs · 23 Feb 2025 – 23 Jul 2025"],["2025 - Marko Hietala","10 gigs · 30 Aug 2025 – 27 Sep 2025"],["2025 - Tarja Turunen - The Spirit of Christmas","13 gigs · 6 Dec 2025 – 22 Dec 2025"],["2026 - Pat Metheny","41 gigs · 5 Jun 2026 – 27 Jul 2026"],["2026 - Brymir","12 gigs · 18 Sep 2026 – 31 Oct 2026"],["2026 - Kaunis Kuolematon — Tour with Insomnium","9 gigs · 16 Oct 2026 – 7 Nov 2026"]];
function festivalMatches(event,name){
 const n=norm(event.name),target=norm(name);
 if(name==='Steelfest')return /steelfest|steelchaos|steelhordes/i.test(n);
 if(name==='Saarihelvetti')return /saarihelvetti|talvihelvetti|merihelvetti/i.test(n);
 return n===target||n.startsWith(target+' ');
}
function sorted(items){return [...items].sort((a,b)=>a.localeCompare(b,'en'))}
function dateLabel(iso){
 if(!iso)return '';
 const [y,m,d]=iso.split('-').map(Number);
 return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)));
}
function historyStats(items,day){
 const rec=[...items].sort((a,b)=>a.start.localeCompare(b.start));
 const past=rec.filter(x=>x.end<day),upcoming=rec.filter(x=>x.end>=day);
 const first=rec[0]?.start?.slice(0,4)||'';
 const next=[...upcoming].sort((a,b)=>a.start.localeCompare(b.start))[0]?.start||'';
 return {first,past:past.length,upcoming:upcoming.length,next,total:rec.length};
}
function fragments(meta){
 return [meta.first?meta.first+' →':'',meta.past?meta.past+' past '+(meta.past===1?'event':'events'):'',meta.upcoming?meta.upcoming+' upcoming':''].filter(Boolean);
}


function clientsHub(){
 const shops=[
  ['Charon','/artists/charon/','https://shop.enslain.net/category/charon'],
  ['The Man-Eating Tree','/artists/the-man-eating-tree/','https://shop.enslain.net/category/the-man-eating-tree'],
  ['Crimson Sun','/artists/crimson-sun/','https://shop.enslain.net/category/crimson-sun'],
  ['Shade Empire','/artists/shade-empire/','https://shop.enslain.net/category/shade-empire'],
  ['MyGrain','/artists/mygrain/','https://shop.enslain.net/category/mygrain'],
  ['Sinamore','','https://shop.enslain.net/category/sinamore'],
  ['Dark River Festival','/festivals/dark-river-festival/','https://shop.enslain.net/category/dark-river-festival']
 ];
 const cards=[
  ['Events','/events/','Upcoming gigs, dates and the complete gig archive.'],
  ['Artists','/artists/','Artists and projects we work with, with upcoming dates and history.'],
  ['Festivals','/festivals/','Our festival partnerships and their histories.'],
  ['Touring history','/touring-history/','Selected tours and multi-date runs.']
 ].map(([name,link,desc])=>'<a class="roadbook-client-panel" href="'+link+'"><h2>'+name+'</h2><p>'+esc(desc)+'</p></a>').join('');
 const cloud=(names,pre)=>'<div class="roadbook-client-links">'+sorted(names).map(name=>'<a href="'+pre+slug(name)+'/">'+esc(name)+'</a>').join('')+'</div>';
 return '<div class="roadbook-client-panels">'+cards+'</div>'+
 '<section class="roadbook-client-section"><h2>Artists we work with</h2>'+cloud(artistNames,'/artists/')+'</section>'+
 '<section class="roadbook-client-section"><h2>Festival partners</h2>'+cloud(festivalNames,'/festivals/')+'</section>'+
 '<section class="roadbook-client-section"><h2>Touring history</h2><p><a href="/touring-history/">Browse all 22 selected tours →</a></p></section>'+
 '<section class="roadbook-client-section"><h2>Official webshops</h2><div class="roadbook-shop-grid">'+shops.map(([name,artist,shop])=>'<div class="roadbook-shop-card"><h3>'+(artist?'<a href="'+artist+'">'+esc(name)+'</a>':esc(name))+'</h3><a href="'+shop+'" target="_blank" rel="noopener noreferrer">Shop merch →</a></div>').join('')+'</div></section>';
}

function edition(x){
 const artists=x.bands.filter(b=>norm(b)!==norm(x.name));
 const major=artists.slice(0,5),others=artists.slice(5);
 const fallback=!artists.length?x.details:'';
 const ticket=x.upcoming&&x.ticket?'<a class="events-v2__ticket" href="'+esc(x.ticket)+'" target="_blank" rel="noopener noreferrer">Tickets ↗</a>':'';
 return '<article class="roadbook-edition"><p class="roadbook-edition__date"><time datetime="'+esc(x.start)+'">'+esc(x.date)+'</time></p>'+
  '<h3>'+esc(x.name)+'</h3><p class="roadbook-edition__place">'+esc(x.venue)+' · '+esc(x.city)+'</p>'+
  (major.length?'<p class="roadbook-edition__featured">'+major.map(esc).join(' · ')+'</p>':'')+
  (others.length?'<p class="roadbook-edition__bands">'+others.map(esc).join(' · ')+'</p>':'')+
  (fallback?'<p class="roadbook-edition__bands">'+esc(fallback)+'</p>':'')+ticket+'</article>';
}
function festivalHistory(gigs,name){
 const sort=xs=>[...xs].sort((a,b)=>b.start.localeCompare(a.start));
 if(name!=='Steelfest' && name!=='Saarihelvetti')return '<div class="roadbook-editions">'+sort(gigs).map(edition).join('')+'</div>';
 const families=name==='Steelfest'?
   [['Steelfest','steelfest',x=>!/(steelchaos|steelhordes)/i.test(x.name)],['SteelChaos','steelchaos',x=>/steelchaos/i.test(x.name)],['SteelHordes','steelhordes',x=>/steelhordes/i.test(x.name)]]:
   [['Saarihelvetti','saarihelvetti',x=>!/talvihelvetti|merihelvetti/i.test(x.name)],['Talvihelvetti','talvihelvetti',x=>/talvihelvetti/i.test(x.name)],['Merihelvetti','merihelvetti',x=>/merihelvetti/i.test(x.name)]];
 const nav='<nav class="roadbook-family-nav" aria-label="'+esc(name)+' festival family">'+families.map(([label,id])=>'<a href="#'+id+'">'+label+'</a>').join('')+'</nav>';
 const body=families.map(([label,id,check])=>{
  const xs=sort(gigs.filter(check));if(!xs.length)return '';
  return '<section class="roadbook-family-section" aria-labelledby="'+id+'"><h2 id="'+id+'">'+label+'</h2>'+xs.map(edition).join('')+'</section>';
 }).join('');
 return nav+body;
}
function renderDirectory(items){
 return '<ul class="roadbook-directory roadbook-directory--rich">'+items.map(x=>
  '<li class="roadbook-directory__item"><div class="roadbook-directory__heading">'+
  (x.link?'<a class="roadbook-directory__link" href="'+esc(x.link)+'">'+esc(x.name)+'</a>':'<span class="roadbook-directory__name">'+esc(x.name)+'</span>')+
  '</div>'+(x.meta?'<p class="roadbook-directory__meta">'+esc(x.meta)+'</p>':'')+
  (x.blurb?'<p class="roadbook-directory__blurb">'+esc(x.blurb)+'</p>':'')+'</li>').join('')+'</ul>';
}
function tourIndex(items){
 return '<div class="roadbook-tour-list">'+items.map(x=>
 '<div class="roadbook-tour-entry">'+(x.link?'<a href="'+esc(x.link)+'">'+esc(x.name)+'</a>':'<strong>'+esc(x.name)+'</strong>')+
 '<span>'+esc(x.meta)+'</span></div>').join('')+'</div>';
}
async function write(path,html){const dir=join('public',path);await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),html)}
async function profiles(){
 try{const raw=JSON.parse(await readFile('content/website-profiles.json','utf8'));return raw}
 catch(e){if(e.code==='ENOENT')return {artists:{},festivals:{}};throw e}
}
export async function generate(input,day=helsinkiDay()){
 const data=curate(input.events,input.feed,day),shell=await readFile(join('public','events','index.html'),'utf8'),profile=await profiles();
 const partnerData=sorted(artistNames).map(name=>{
  const gigs=data.publicEvents.filter(x=>data.relations.get(x.id)?.clients.includes(norm(name)));
  requireOk(gigs.length>0,'no verified public records for approved artist '+name);
  const stats=historyStats(gigs,day);
  return {name,gigs,stats,link:'/artists/'+slug(name)+'/',blurb:profile.artists?.[name]||''};
 });
 const festivalData=sorted(festivalNames).map(name=>{
  const gigs=data.publicEvents.filter(x=>festivalMatches(x,name));
  requireOk(gigs.length>0,'no verified public records for approved festival '+name);
  const stats=historyStats(gigs,day);
  return {name,gigs,stats,link:'/festivals/'+slug(name)+'/',blurb:profile.festivals?.[name]||''};
 });
 const tourGigs=data.publicEvents.filter(x=>data.relations.get(x.id)?.internalTour==='Kaunis Kuolematon — Autumn 2026'&&/\bwith\s+Insomnium\b/i.test(x.details));
 requireOk(tourGigs.length>=8,'Kaunis Kuolematon with Insomnium tour below qualifying threshold');
 const liveGroups={'2026 - Kaunis Kuolematon — Tour with Insomnium':'Kaunis Kuolematon — Autumn 2026','2026 - Brymir':'Brymir — Autumn 2026','2026 - Pat Metheny':'Pat Metheny — European Tour'};
 const touring=tourSummary.map(([name,oldMeta])=>{
  const group=liveGroups[name],gigs=group?(name==='2026 - Kaunis Kuolematon — Tour with Insomnium'?tourGigs:data.publicEvents.filter(x=>data.relations.get(x.id)?.internalTour===group)):[];
  const stats=gigs.length?historyStats(gigs,day):null;
  const meta=stats?stats.total+' gigs · '+dateLabel([...gigs].sort((a,b)=>a.start.localeCompare(b.start))[0].start)+' – '+dateLabel([...gigs].sort((a,b)=>b.end.localeCompare(a.end))[0].end):oldMeta;
  return {name,meta,link:({ '2026 - Kaunis Kuolematon — Tour with Insomnium':'/touring-history/2026-kaunis-kuolematon/','2026 - Brymir':'/touring-history/2026-brymir/','2026 - Pat Metheny':'/touring-history/2026-pat-metheny/' })[name]||''};
 });
 let eventsHtml=renderEvents(shell,data);

 const nav='<nav class="roadbook-page-nav" aria-label="Browse Clients and Events"><a href="/clients/">Clients</a><a href="/artists/">Artists</a><a href="/festivals/">Festivals</a><a href="/touring-history/">Touring history</a></nav>';
 eventsHtml=eventsHtml.replace(/<nav class="roadbook-explore"[\s\S]*?<\/nav>/,'').replace(/<nav class="roadbook-portals"[\s\S]*?<\/nav>/,'').replace(/<nav class="roadbook-quicklinks"[\s\S]*?<\/nav>/,'').replace(/<nav class="roadbook-page-nav"[\s\S]*?<\/nav>/,'').replace('<div class="events-v2__controls" role="search"',nav+'<div class="events-v2__controls" role="search"');
 eventsHtml=eventsHtml.replace(/<link rel="stylesheet" href="\/assets\/roadbook-pages.css">/g,'').replace('</head>','<link rel="stylesheet" href="/assets/roadbook-pages.css"></head>');

 await write('clients',wrap(shell,'Clients','Enslain Metal Merch artists, festival partnerships, tour history and official webshops.','/clients/',
  content('Clients','',clientsHub(),['Clients']).replace('<main class="main events-v2 roadbook-page">','<main class="main events-v2 roadbook-page roadbook-page--clients">').replace('<a href="/events/">Events</a> / Clients','<a href="/">Home</a> / Clients')));
 await write('artists',wrap(shell,'Artists','Explore Enslain Metal Merch artist partners, event history and upcoming shows.','/artists/',
   content('Artists','',renderDirectory(partnerData.map(x=>({...x,meta:fragments(x.stats).join(' · ')}))),['Artists'])));
 await write('festivals',wrap(shell,'Festival partners','Explore festivals and events with merchandise handled by Enslain Metal Merch.','/festivals/',
   content('Festival partners','',renderDirectory(festivalData.map(x=>({...x,meta:[x.stats.first?x.stats.first+' →':'',x.stats.past?x.stats.past+' past '+(x.stats.past===1?'event':'events'):'',x.stats.next?'Next '+dateLabel(x.stats.next):''].filter(Boolean).join(' · ')}))),['Festival partners'])));
 for(const x of partnerData){
  const copy=x.blurb?'<p class="roadbook-writeup">'+esc(x.blurb)+'</p>':'';
  await write('artists/'+slug(x.name),wrap(shell,x.name+' — gigs',x.name+' merchandise gig history with Enslain Metal Merch.','/artists/'+slug(x.name)+'/',
   content(x.name,'',copy+table([...x.gigs].sort((a,b)=>b.end.localeCompare(a.end))),['Artists',x.name])));
 }
 for(const x of festivalData){
  const summary=[x.stats.first?x.stats.first+' →':'',x.stats.past?x.stats.past+' past events':'',x.stats.next?'Next '+dateLabel(x.stats.next):''].filter(Boolean).join(' · ');
  const copy=x.blurb?'<p class="roadbook-writeup">'+esc(x.blurb)+'</p>':'';
  const layout=festivalHistory(x.gigs,x.name);
  const intro=x.name==='Steelfest'?'<p class="roadbook-writeup">Enslain Metal Merch is the official festival and artist merchandise sales partner of Steelfest. Here you’ll find the festival editions we’ve worked, their lineups, and tickets for upcoming events.</p>':'';
  await write('festivals/'+slug(x.name),wrap(shell,x.name+' — festival history',x.name+' festival merchandise history with Enslain Metal Merch.','/festivals/'+slug(x.name)+'/',
   content(x.name,'',intro+copy+layout,['Festival partners',x.name])));
 }
 await write('touring-history',wrap(shell,'Touring history','Explore tours and multi-date merchandise runs by Enslain Metal Merch.','/touring-history/',
   content('Touring history','Selected tour history.',tourIndex(touring),['Touring history'])));
 await write('touring-history/2026-kaunis-kuolematon',wrap(shell,'Kaunis Kuolematon — Tour with Insomnium','Dates from the 2026 Kaunis Kuolematon tour with Insomnium.','/touring-history/2026-kaunis-kuolematon/',
   content('2026 - Kaunis Kuolematon — Tour with Insomnium','',table([...tourGigs].sort((a,b)=>a.start.localeCompare(b.start))),['Touring history','2026 - Kaunis Kuolematon — Tour with Insomnium'])));

 for(const [name,group] of [['Brymir','Brymir — Autumn 2026'],['Pat Metheny','Pat Metheny — European Tour']]){
  const gigs=data.publicEvents.filter(x=>data.relations.get(x.id)?.internalTour===group);
  requireOk(gigs.length>=8,'too few verified public gigs for 2026 '+name);
  const path='touring-history/2026-'+slug(name);
  await write(path,wrap(shell,'2026 - '+name,'Enslain Metal Merch tour dates and venues for '+name+'.','/'+path+'/',
   content('2026 - '+name,'',table(gigs),['Touring history','2026 - '+name])));
 }

 await writeFile(join('public','events','index.html'),eventsHtml);
 return {publicCount:data.publicEvents.length,artists:partnerData.length,festivals:festivalData.length,tours:touring.length};
}
async function getData(){
 if(process.env.ROADBOOK_FIXTURE)return JSON.parse(await readFile(process.env.ROADBOOK_FIXTURE,'utf8'));
 const creds=process.env.GOOGLE_SERVICE_ACCOUNT_JSON,id=process.env.ROADBOOK_SHEET_ID;
 requireOk(creds&&id,'missing read-only Sheets credentials');
 const {JWT}=await import('google-auth-library');
 const c=JSON.parse(creds),jwt=new JWT({email:c.client_email,key:c.private_key,scopes:['https://www.googleapis.com/auth/spreadsheets.readonly']});
 const token=await jwt.getAccessToken();requireOk(token.token,'Sheets authentication failed');
 const url=new URL('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'/values:batchGet');
 for(const range of ['Events!A1:T',"'Website Feed'!A1:M"])url.searchParams.append('ranges',range);
 const response=await fetch(url,{headers:{Authorization:'Bearer '+token.token}});
 requireOk(response.ok,'Sheets API response rejected');
 const j=await response.json();requireOk(j.valueRanges?.length===2,'missing Sheets ranges');
 return {events:j.valueRanges[0].values,feed:j.valueRanges[1].values};
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replaceAll('\\','/'))){
 try{const result=await generate(await getData());console.log('Roadbook build succeeded:',result)}
 catch(e){console.error('Roadbook build failed:',e.message);process.exitCode=1}
}
