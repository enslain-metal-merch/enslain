/**
 * Read-only Google Sheets fetch for Roadbook Tuesday pipeline.
 * Uses a service account with Viewer access to Roadbook, but deliberately
 * downloads only necessary Events columns plus the Website Feed. Its Google
 * file permission remains broader than these limited API requests.
 * Never uploads or logs raw Roadbook data.
 */
import {createSign} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {ROADBOOK_RANGES, assembleRoadbookInput} from './roadbook-fetch-ranges.mjs';
const needed=(v,msg)=>{if(!v)throw new Error('Roadbook fetch blocked: '+msg)};
const key=process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const sheetId=process.env.ROADBOOK_SHEET_ID;
needed(key&&sheetId,'provide GOOGLE_SERVICE_ACCOUNT_JSON and ROADBOOK_SHEET_ID');
let user;
try{user=JSON.parse(key)}catch{throw Error('Roadbook fetch blocked: invalid account JSON')};
needed(user.client_email&&user.private_key,'service account needs client_email and private_key');
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const now=Math.floor(Date.now()/1000);
const unsigned=b64({alg:'RS256',typ:'JWT'})+'.'+b64({
 iss:user.client_email,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',
 aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3300
});
const sign=createSign('RSA-SHA256');sign.update(unsigned);sign.end();
const assertion=unsigned+'.'+sign.sign(user.private_key).toString('base64url');
const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
 method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})
});
needed(tokenResponse.ok,'Google authentication rejected (check spreadsheet Viewer share)');
const token=await tokenResponse.json();needed(token.access_token,'no Google access token');
const url=new URL('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(sheetId)+'/values:batchGet');
for(const name of ROADBOOK_RANGES)url.searchParams.append('ranges',name);
url.searchParams.set('valueRenderOption','FORMATTED_VALUE');
const response=await fetch(url,{headers:{Authorization:'Bearer '+token.access_token}});
needed(response.ok,'Google Sheets returned a read error');
const json=await response.json();
const input=assembleRoadbookInput(json.valueRanges);
needed(input.events?.length>600&&input.feed?.length>600,'abnormal sheet rows');
const path=process.env.ROADBOOK_INPUT_FILE||'/tmp/enslain-roadbook-private.json';
await writeFile(path,JSON.stringify(input),{mode:0o600,flag:'w'});
// Log counts only: never expose raw Roadbook rows in GitHub Action logs.
console.log('Read-only Roadbook import OK:',input.events.length-1,'Events rows,',input.feed.length-1,'Website Feed rows');
