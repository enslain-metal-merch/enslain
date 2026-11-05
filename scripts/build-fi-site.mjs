// Regenerate Finnish pages from their approved public English counterparts.
// Run after Roadbook website generation, before publishing. No private sheet records are read.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {routes,localize} from "./fi-localizer.mjs";
import {addReciprocalAlternates} from "./seo-hreflang.mjs";
import "./build-fi-homepage.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
for(const route of routes){
 const input=resolve(root,"public",route,"index.html");
 const output=resolve(root,"public","fi",route,"index.html");
 mkdirSync(dirname(output),{recursive:true});
 const originalEnglish=readFileSync(input,"utf8");
 const updatedEnglish=addReciprocalAlternates(originalEnglish,route);
 if(updatedEnglish!==originalEnglish)writeFileSync(input,updatedEnglish);
 let page=localize(updatedEnglish,route);
 if(route==="services"){
   const authored=readFileSync(resolve(root,"src","fi","services-main.html"),"utf8").trim();
   if(!/<main class="main">[\s\S]*<\/main>/.test(authored))throw new Error("Finnish Services source is not a full main section");
   const before=page;
   page=page.replace(/<main class="main">[\s\S]*?<\/main>/,authored);
   if(page===before)throw new Error("Could not insert independently authored Finnish Services copy");
 }
 writeFileSync(output,addReciprocalAlternates(page,route));
}
console.log("Finnish pages regenerated from "+routes.length+" public English page sources.");
