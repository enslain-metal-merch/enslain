/* Enslain Events: progressively reveal PRE-APPROVED public HTML rows. All filtering uses the complete set. */
(()=>{"use strict";
const root=document.querySelector(".events-v2");if(!root)return;
const rows=Array.from(root.querySelectorAll("tr[data-event-id]"));
const search=root.querySelector("#events-search"),timing=root.querySelector("#events-timing"),band=root.querySelector("#events-band"),country=root.querySelector("#events-country"),clear=root.querySelector("#events-clear"),summary=root.querySelector("#events-summary"),empty=root.querySelector("#events-empty");
const limit={upcoming:45,past:55},step=55;
const byKind={upcoming:[],past:[]};
const normalize=s=>(s||"").toLocaleLowerCase().trim();
const urlTiming=new URLSearchParams(location.search).get("timing");
if(urlTiming==="past"||urlTiming==="upcoming")timing.value=urlTiming;
function reindexRows(){
 byKind.upcoming.length=0;byKind.past.length=0;
 rows.forEach(r=>{const k=r.dataset.kind;if(byKind[k])byKind[k].push(r)});
}
reindexRows();
let matched={upcoming:[],past:[]};
function render(reset=false){
 if(reset){limit.upcoming=45;limit.past=55;}
 const q=normalize(search.value),b=normalize(band.value),c=country.value,when=timing.value;
 matched={upcoming:[],past:[]};
 for(const row of rows){
  const matchesTime=when==="all"||row.dataset.kind===when;
  const matches=matchesTime&&(!q||(row.dataset.search||"").includes(q))&&(!b||(row.dataset.bands||"").split("|").includes(b))&&(!c||row.dataset.country===c);
  row.classList.toggle("is-filtered-out",!matches);
  if(matches)matched[row.dataset.kind].push(row);
 }
 for(const kind of ["upcoming","past"]){
  const group=root.querySelector('[data-group="'+kind+'"]'),button=root.querySelector('[data-load="'+kind+'"]'),set=new Set(matched[kind].slice(0,limit[kind]));
  group.hidden=matched[kind].length===0;
  for(const row of byKind[kind])row.classList.toggle("is-paged-out",!set.has(row));
  // Filtered rows are always paged out, even when they were in a previously visible batch.
  button.hidden=matched[kind].length<=limit[kind];
  group.querySelector(".events-v2__group-heading span").textContent=matched[kind].length+" events";
 }
 const total=matched.upcoming.length+matched.past.length;
 summary.textContent=total+" "+(total===1?"event":"events")+" found";
 empty.hidden=total!==0;
}
root.classList.add("events-v2--ready");
search.addEventListener("input",()=>render(true));
band.addEventListener("change",()=>render(true));
[country,timing].forEach(el=>el.addEventListener("change",()=>{
 if(el===timing){const u=new URL(location.href);if(timing.value==="all")u.searchParams.delete("timing");else u.searchParams.set("timing",timing.value);history.replaceState(null,"",u);}
 render(true);
}));
clear.addEventListener("click",()=>{search.value="";band.value="";country.value="";timing.value="upcoming";const u=new URL(location.href);u.searchParams.delete("timing");history.replaceState(null,"",u);render(true)});
root.querySelectorAll("[data-load]").forEach(button=>button.addEventListener("click",()=>{limit[button.dataset.load]+=step;render()}));
if("IntersectionObserver" in window){
 const observer=new IntersectionObserver(entries=>{for(const ent of entries){if(!ent.isIntersecting)continue;const kind=ent.target.dataset.sentinel;if(matched[kind]?.length>limit[kind]){limit[kind]+=step;render();}}},{rootMargin:"300px"});
 root.querySelectorAll("[data-sentinel]").forEach(el=>observer.observe(el));
}
root.addEventListener("enslain:event-rollover",()=>{reindexRows();render(true)});
render();
})();