// Regenerate Finnish pages from their approved public English counterparts.
// Run after Roadbook website generation, before publishing. No private sheet records are read.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {routes,localize} from "./fi-localizer.mjs";
import "./build-fi-homepage.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
for(const route of routes){
 const input=resolve(root,"public",route,"index.html");
 const output=resolve(root,"public","fi",route,"index.html");
 mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,localize(readFileSync(input,"utf8"),route));
}
console.log("Finnish pages regenerated from "+routes.length+" public English page sources.");
