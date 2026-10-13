/* Netlify scheduled function: 03:00 Helsinki in winter AND summer.
   Runs at 00/01 UTC, but only one of them is 03:00 local. Inactive without hook secret. */
export default async () => {
  const hour = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Helsinki',hour:'2-digit',hourCycle:'h23'}).format(new Date());
  if (hour !== '03') { console.log('Not 03:00 Helsinki; skip scheduled rebuild.'); return; }
  const hook = process.env.NETLIFY_ROADBOOK_BUILD_HOOK;
  if (!hook) { console.log('Roadbook automation not configured; skip.'); return; }
  if (!hook.startsWith('https://api.netlify.com/build_hooks/')) throw Error('Invalid Netlify build hook.');
  const response=await fetch(hook,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  if(!response.ok)throw Error('Netlify build hook rejected the rebuild: HTTP '+response.status);
  console.log('Requested private Roadbook rebuild at 03 Helsinki.');
};
export const config = {schedule:'0 0,1 * * *'};
