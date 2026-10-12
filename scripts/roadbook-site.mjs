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
function row(x){
 const search=norm([x.date,x.name,x.venue,x.city,x.country,x.details,...x.bands].join(' '));
 const c=(label,v)=>'<td data-label="'+label+'">'+esc(v)+'</td>';
 const tickets=x.upcoming?'<td class="events-v2__tickets" data-label="Tickets">'+(x.ticket?'<a class="events-v2__ticket" href="'+esc(x.ticket)+'" target="_blank" rel="noopener noreferrer">Tickets ↗</a>':'')+'</td>':'';
 return '<tr class="events-v2__row" data-event-id="'+esc(x.id)+'" data-kind="'+(x.upcoming?'upcoming':'past')+'" data-bands="'+esc(x.bands.map(norm).join('|'))+'" data-country="'+esc(norm(x.country))+'" data-search="'+esc(search)+'">'+
 '<td class="events-v2__date" data-label="Date"><time datetime="'+esc(x.start)+'">'+esc(x.date)+'</time></td>'+
 '<td class="events-v2__name" data-label="Event"><strong>'+esc(x.name)+'</strong></td><td class="events-v2__context-cell" data-label="Details">'+(x.details?'<span class="events-v2__context">'+esc(x.details)+'</span>':'')+'</td>'+
 c('Venue',x.venue)+c('City',x.city)+c('Country',x.country)+tickets+'</tr>';
}
export function renderEvents(html,data){
 for(const kind of ['upcoming','past']){
  const rec=data[kind],marker=new RegExp('(<section class="events-v2__group" id="'+kind+'-events"[\\s\\S]*?<tbody>)[\\s\\S]*?(</tbody>[\\s\\S]*?</section>)'),m=html.match(marker);
  requireOk(m,'missing '+kind+' section');
  const section=m[0].replace(/<tbody>[\s\S]*?<\/tbody>/,'<tbody>'+rec.map(row).join('\n')+'</tbody>').replace(/(<div class="events-v2__group-heading">[\s\S]*?<span>)\d+ events(<\/span>)/,'$1'+rec.length+' events$2');
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
 return h.replace('<script src="/assets/events.js" defer></script>','').replace(/(<a href="\/events\/") aria-current="page"/,'$1');
}
function content(title,intro,items,trail){
 return '<main class="main events-v2 roadbook-page"><div class="wrapper roadbook-page__body"><nav class="roadbook-breadcrumbs" aria-label="Breadcrumb"><a href="/events/">Events</a> / '+trail.map(esc).join(' / ')+'</nav><h1>'+esc(title)+'</h1><p class="roadbook-lead">'+esc(intro)+'</p>'+items+'<p class="roadbook-back"><a href="/events/">← All events</a></p></div></main>';
}
function table(items){
 const upcoming=items.filter(x=>x.upcoming),past=items.filter(x=>!x.upcoming);
 const block=(xs,isUpcoming)=>{if(!xs.length)return '';const fields=['Date','Event','Details','Venue','City','Country'];if(isUpcoming)fields.push('Tickets');return '<h2>'+(isUpcoming?'Upcoming gigs':'Past events')+'</h2><div class="events-v2__table-wrap"><table class="events-v2__table"><thead><tr>'+fields.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+xs.map(row).join('\n')+'</tbody></table></div>';};
 return block(upcoming,true)+block(past,false);
}
function directory(items){
 return '<div class="roadbook-grid">'+items.map(x=>'<div class="roadbook-tile">'+(x.link?'<a href="'+esc(x.link)+'">'+esc(x.name)+'</a>':esc(x.name))+'</div>').join('')+'</div>';
}
async function write(path,html){const dir=join('public',path);await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),html)}
export async function generate(input,day=helsinkiDay()){
 const data=curate(input.events,input.feed,day),shell=await readFile(join('public','events','index.html'),'utf8');
 let eventsHtml=renderEvents(shell,data);
 const explore='<nav class="roadbook-explore" aria-label="Browse gig history"><a href="/artists/">Artists</a><a href="/festivals/">Festival partners</a><a href="/touring-history/">Touring history</a></nav>';
 eventsHtml=eventsHtml.replace(/<nav class="roadbook-explore"[\s\S]*?<\/nav>/,'').replace('<div class="events-v2__controls" role="search"',explore+'<div class="events-v2__controls" role="search"');
 eventsHtml=eventsHtml.replace('</head>','<link rel="stylesheet" href="/assets/roadbook-pages.css"></head>');
 const artistNames=['Kalmah','Crimson Sun','Tyrantti','Shade Empire','Brymir','Kaunis Kuolematon','Battle Beast','KAUAN','Tarja Turunen','The Man-Eating Tree','Charon','Vorna','Pat Metheny','Mors Subita','MyGrain'];
 const festivalNames=['Ankea Festival','Dark River Festival','Hatefeast','Hellsinki Metal Cruise','Kaaos Festival','Kuolio Fest','Lisää Löylyä','Saarihelvetti','Steelfest'];
 await write('artists',wrap(shell,'Artists','Artists represented in Enslain Metal Merch gig history.','/artists/',content('Artists','Approved artist partners and our documented gigs.',directory(artistNames.map(name=>({name,link:name==='Kaunis Kuolematon'?'/artists/kaunis-kuolematon/':null}))),['Artists'])));
 await write('festivals',wrap(shell,'Festival partners','Festivals and historical family events handled by Enslain Metal Merch.','/festivals/',content('Festival partners','Festival merchandise partnerships and past events.',directory(festivalNames.map(name=>({name,link:name==='Steelfest'?'/festivals/steelfest/':null}))),['Festival partners'])));
 const artist=data.publicEvents.filter(x=>data.relations.get(x.id)?.clients.includes('kaunis kuolematon')).sort((a,b)=>b.end.localeCompare(a.end));
 requireOk(artist.length>0,'artist participation is unverified');
 await write('artists/kaunis-kuolematon',wrap(shell,'Kaunis Kuolematon','Enslain Metal Merch gig history with Kaunis Kuolematon.','/artists/kaunis-kuolematon/',content('Kaunis Kuolematon','Our documented merchandise work with Kaunis Kuolematon.',table(artist),['Artists','Kaunis Kuolematon'])));
 const steel=data.publicEvents.filter(x=>/steelfest|steelchaos|steelhordes/i.test(x.name)).sort((a,b)=>b.end.localeCompare(a.end));
 requireOk(steel.length>0,'festival records missing');
 await write('festivals/steelfest',wrap(shell,'Steelfest history','Steelfest, SteelChaos and SteelHordes events handled by Enslain Metal Merch.','/festivals/steelfest/',content('Steelfest','Including SteelChaos and SteelHordes festival history.',table(steel),['Festival partners','Steelfest'])));
 const tour=data.publicEvents.filter(x=>data.relations.get(x.id)?.internalTour==='Kaunis Kuolematon — Autumn 2026').sort((a,b)=>a.start.localeCompare(b.start));
 requireOk(tour.length>=8,'tour below 8 actual gigs');
 await write('touring-history/2026-kaunis-kuolematon',wrap(shell,'2026 - Kaunis Kuolematon','Verified dates from our 2026 Kaunis Kuolematon tour.','/touring-history/2026-kaunis-kuolematon/',content('2026 - Kaunis Kuolematon','Documented 2026 tour dates.',table(tour),['Touring history','2026 - Kaunis Kuolematon'])));
 await write('touring-history',wrap(shell,'Touring history','Browse Enslain Metal Merch touring history and dates.','/touring-history/',content('Touring history','A first page from our archive; older tour mappings are being verified.',directory([{name:'2026 - Kaunis Kuolematon',link:'/touring-history/2026-kaunis-kuolematon/'}]),['Touring history'])));
 await writeFile(join('public','events','index.html'),eventsHtml);
 return {published:data.publicEvents.length,upcoming:data.upcoming.length,past:data.past.length,kaunis:artist.length,steelfest:steel.length,tour:tour.length};
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
