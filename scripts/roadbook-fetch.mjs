/**
 * GitHub OIDC keyless, read-only import of the SEPARATE public website sheet.
 * This script must never request or access the private Roadbook spreadsheet.
 * The owner's Roadbook formula prefilters events before IMPORTRANGE mirrors them.
 */
import {writeFile} from 'node:fs/promises';
import {ROADBOOK_RANGES,assembleRoadbookInput} from './roadbook-fetch-ranges.mjs';
const need=(v,msg)=>{if(!v)throw Error('Website feed fetch blocked: '+msg)};
const token=process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
// This public-only spreadsheet ID is not a secret; it requires Viewer sharing.
const sheetId=process.env.WEBSITE_FEED_SHEET_ID || '1LKglCQg-cUiNPYTQQD7b32knAFXekyjlt29I6lm0tNM';
need(token,'missing keyless Google OAuth token');
const url=new URL('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(sheetId)+'/values:batchGet');
for(const range of ROADBOOK_RANGES)url.searchParams.append('ranges',range);
url.searchParams.set('valueRenderOption','FORMATTED_VALUE');
const response=await fetch(url,{headers:{Authorization:'Bearer '+token}});
need(response.ok,'read-only Google Sheets API read failed');
const input=assembleRoadbookInput((await response.json()).valueRanges);
const path=process.env.ROADBOOK_INPUT_FILE||'/tmp/enslain-public-website-feed.json';
await writeFile(path,JSON.stringify(input),{mode:0o600,flag:'w'});
console.log('Isolated public website feed read OK:',input.feed.length-1,'approved events');
