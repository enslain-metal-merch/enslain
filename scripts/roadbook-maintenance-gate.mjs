import {pathToFileURL} from 'node:url';
const helsinkiDay=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Helsinki',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export function validateMaintenance(rows,now=new Date()){
 if(rows?.[0]?.[0]!=='Watcher')throw Error('Agent State headers absent');
 const state=new Map(rows.slice(1).filter(x=>x?.[0]).map(x=>[x[0],x]));
 const essential=['book_maintenance_run','roadbook_daily_base','event_change_gate','cross_system_qa'];
 const current=helsinkiDay(now);
 const dayOfWeek=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Helsinki',weekday:'short'}).format(now);
 // Monday is an allowed fallback only for Tuesday's one scheduled publication.
 const yesterday=helsinkiDay(new Date(now.getTime()-24*60*60*1000));
 const results=[];
 for(const key of essential){
  const row=state.get(key);if(!row)throw Error('Missing checkpoint '+key);
  const date=new Date(row[1]);
  if(!Number.isFinite(date.getTime())||date>now)throw Error('Invalid checkpoint '+key);
  results.push({key,row,day:helsinkiDay(date)});
 }
 const full=/FULL OK/i.test(state.get('book_maintenance_run')[4]||'');
 if(!full)throw Error('No verified healthy maintenance checkpoint');
 if(results.every(x=>x.day===current))return 'today';
 if(dayOfWeek==='Tue'&&results.every(x=>x.day===yesterday))return 'monday-fallback';
 throw Error('Maintenance checkpoints stale or inconsistent');
}
export async function checkLiveMaintenance(token,id,now=new Date()){
 if(!token||!id)throw Error('Missing Google credentials');
 const url='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'/values/'+encodeURIComponent("'Agent State'!A1:E100");
 const result=await fetch(url,{headers:{Authorization:'Bearer '+token}});
 if(!result.ok)throw Error('Agent State API status '+result.status);
 const mode=validateMaintenance((await result.json()).values,now);
 console.log('PASS: verified Roadbook maintenance checkpoint ('+mode+'). Fresh live public-data validation still required.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 checkLiveMaintenance(process.env.GOOGLE_OAUTH_ACCESS_TOKEN,process.env.ROADBOOK_SHEET_ID).catch(e=>{console.error(e.message);process.exitCode=1;});
}
