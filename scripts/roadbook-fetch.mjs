/**
 * Read-only Google Sheets fetch for Roadbook Tuesday pipeline.
 * Uses a service account with Viewer access to Roadbook, but deliberately
 * downloads only necessary Events columns plus the Website Feed. Its Google
 * file permission remains broader than these limited API requests.
 * Never uploads or logs raw Roadbook data.
 */
import {writeFile} from 'node:fs/promises';
import {ROADBOOK_RANGES, assembleRoadbookInput} from './roadbook-fetch-ranges.mjs';
const needed=(v,msg)=>{if(!v)throw new Error('Roadbook fetch blocked: '+msg)};
const token=process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
const sheetId=process.env.ROADBOOK_SHEET_ID;
// Short-lived Sheets readonly OAuth token is minted by GitHub OIDC + Google WIF.
// Never accept, parse, generate or store downloadable service-account key JSON.
needed(token&&sheetId,'missing keyless Google OAuth access token or Roadbook sheet ID');
const url=new URL('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(sheetId)+'/values:batchGet');
for(const name of ROADBOOK_RANGES)url.searchParams.append('ranges',name);
url.searchParams.set('valueRenderOption','FORMATTED_VALUE');
const response=await fetch(url,{headers:{Authorization:'Bearer '+token}});
needed(response.ok,'Google Sheets returned a read error');
const json=await response.json();
const input=assembleRoadbookInput(json.valueRanges);
needed(input.events?.length>600&&input.feed?.length>600,'abnormal sheet rows');
const path=process.env.ROADBOOK_INPUT_FILE||'/tmp/enslain-roadbook-private.json';
await writeFile(path,JSON.stringify(input),{mode:0o600,flag:'w'});
// Log counts only: never expose raw Roadbook rows in GitHub Action logs.
console.log('Read-only Roadbook import OK:',input.events.length-1,'Events rows,',input.feed.length-1,'Website Feed rows');
