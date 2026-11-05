// Reconcile HTML language alternates in the public EN/FI pages after page generation.
// Google's hreflang annotations must be reciprocal, absolute, and present on both variations.
export function addReciprocalAlternates(html,route){
 const suffix=route?route+"/":"";
 const en="https://www.enslain.net/"+suffix;
 const fi="https://www.enslain.net/fi/"+suffix;
 const canon=html.match(/<link rel="canonical" href="([^"]+)">/);
 if(!canon || (canon[1]!==en&&canon[1]!==fi))throw new Error("Unexpected or missing canonical at "+route+": "+(canon?.[1]||"missing"));
 const found=[...html.matchAll(/<link rel="alternate" hreflang="(en|fi)" href="([^"]+)">/g)];
 if(found.length){
  if(found.length!==2 || !found.some(x=>x[1]==="en"&&x[2]===en) || !found.some(x=>x[1]==="fi"&&x[2]===fi))
   throw new Error("Broken reciprocal hreflang tags at "+route);
  return html;
 }
 const tags='<link rel="alternate" hreflang="en" href="'+en+'">\n  <link rel="alternate" hreflang="fi" href="'+fi+'">';
 return html.replace(canon[0],canon[0]+"\n  "+tags);
}
