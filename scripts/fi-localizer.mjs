// Finnish preview localizer: transforms ONLY approved public English pages, never private Roadbook cells.
// Source of truth remains public/<route>/index.html. User reviews all Finnish copy before production.
export const roots=["services","volunteers","events","clients","about","contact","artists","festivals","touring-history"];
export const routes=[
...roots,
...["battle-beast","brymir","charon","crimson-sun","kalmah","kauan","kaunis-kuolematon","mors-subita","mygrain","pat-metheny","shade-empire","tarja-turunen","the-man-eating-tree","tyrantti","vorna"].map(s=>"artists/"+s),
...["ankea-festival","dark-river-festival","hatefeast","hellsinki-metal-cruise","kaaos-festival","kuolio-fest","lisaa-loylya","saarihelvetti","steelfest"].map(s=>"festivals/"+s),
...["2026-brymir","2026-kaunis-kuolematon","2026-pat-metheny"].map(s=>"touring-history/"+s)
];
export function localLinks(s){
 return s.replace(/href="\/(?!\/)([^"#?]*)([^"]*)"/g,(full,path,tail)=>{
   if(path.startsWith("assets/")||path.startsWith("fi/")||path.startsWith(".well-known/"))return full;
   const key=path.replace(/\/index\.html$/,"/").replace(/\/$/,"");
   return key===""||routes.includes(key)?'href="/fi/'+(key?key+"/":"")+tail+'"':full;
 });
}
const titles={
services:["Merchandise-myynti keikoille ja festivaaleille","Tarvitsetko myyjiä keikalle tai festivaalille? Enslain hoitaa oheistuotemyynnin, henkilöstön ja kiertueiden myyntijärjestelyt."],
volunteers:["Talkoolaiseksi keikoille ja festivaaleille","Lähde mukaan Enslainin porukkaan keikoille ja festivaaleille. Katso talkoolaismahdollisuudet ja ota yhteyttä."],
events:["Keikat ja keikkahistoria","Enslainin tulevat keikat ja tapahtumahistoria Suomessa ja ulkomailla. Selaa keikkoja, bändejä ja tapahtumia."],
clients:["Artistit ja festivaaliyhteistyöt","Tutustu Enslainin yhteistyöartisteihin ja festivaaleihin, keikkahistoriaan, kiertueisiin ja verkkokauppoihin."],
about:["Enslainin tarina ja porukka","Tutustu Enslain Metal Merchin tarinaan ja tiimiin. Henkilökohtaiset esittelyt säilyvät englanniksi."],
contact:["Ota yhteyttä – merchandise-myynti","Kysy oheistuotemyynnistä keikoille, festivaaleille ja kiertueille. Enslainin yhteystiedot ja laskutustiedot."],
artists:["Yhteistyöartistit ja keikkahistoria","Tutustu Enslainin yhteistyöartisteihin, keikkahistoriaan ja tuleviin tapahtumiin."],
festivals:["Festivaaliyhteistyöt ja tapahtumahistoria","Tutustu festivaaleihin, joiden kanssa Enslain työskentelee, ja niiden tapahtumiin ja esiintyjiin."],
"touring-history":["Kiertuehistoria","Enslain Metal Merchin kiertuehistoria: artisteja, keikkoja ja kiertueita Suomessa ja ulkomailla."]
};
const ui=[
["<h1>What we do</h1>","<h1>Mitä teemme</h1>"],
["<h1>Come sling merch with us!</h1>","<h1>Tule mukaan merkkumyyntiin!</h1>"],
["<h1>Get in touch!</h1>","<h1>Ota yhteyttä!</h1>"],
["<h1>Our story, our crew</h1>","<h1>Meidän tarinamme ja porukkamme</h1>"],
["<h1>Clients</h1>","<h1>Yhteistyöt</h1>"],
["<h1>Artists</h1>","<h1>Artistit</h1>"],
["<h1>Festival partners</h1>","<h1>Festivaalit</h1>"],
["<h1>Touring history</h1>","<h1>Kiertuehistoria</h1>"],
["<h1>Gigs, tours &amp; events</h1>","<h1>Keikat, kiertueet ja tapahtumat</h1>"],
["<h2>For bands</h2>","<h2>Bändeille</h2>"],
["<h2>For promoters</h2>","<h2>Tapahtumajärjestäjille</h2>"],
["<h2>Crew perks</h2>","<h2>Mitä talkoolaiset saavat?</h2>"],
["<h2>Now recruiting</h2>","<h2>Haemme uusia tekijöitä</h2>"],
["<h2>Sound good?</h2>","<h2>Kiinnostuitko?</h2>"],
["<h2>Meet the Enslain crew</h2>","<h2>Tutustu Enslainin porukkaan</h2>"],
["<h2>The Enslain Legion</h2>","<h2>Enslainin legioona</h2>"],
["<h2>Invoicing info</h2>","<h2>Laskutustiedot</h2>"],
["<h2>Upcoming gigs</h2>","<h2>Tulevat keikat</h2>"],
["<h2>Past events</h2>","<h2>Menneet tapahtumat</h2>"],
["<h2>Tour dates</h2>","<h2>Kiertueen keikat</h2>"],
["<h2>Events</h2>","<h2>Keikat</h2>"],
["<h2>Artists</h2>","<h2>Artistit</h2>"],
["<h2>Festivals</h2>","<h2>Festivaalit</h2>"],
["<h2>Touring history</h2>","<h2>Kiertuehistoria</h2>"],
["<h2>Artists we work with</h2>","<h2>Yhteistyöartistit</h2>"],
["<h2>Festival partners</h2>","<h2>Festivaaliyhteistyöt</h2>"],
["<h2>Official webshops</h2>","<h2>Viralliset verkkokaupat</h2>"],
["<span>Search</span>","<span>Haku</span>"],
["<span>Timing</span>","<span>Ajankohta</span>"],
["<span>Band</span>","<span>Bändi</span>"],
["<span>Country</span>","<span>Maa</span>"],
[">All events</option>",">Kaikki tapahtumat</option>"],
[">Upcoming</option>",">Tulevat</option>"],
[">Past</option>",">Menneet</option>"],
[">All bands</option>",">Kaikki bändit</option>"],
[">All countries</option>",">Kaikki maat</option>"],
["placeholder=\"Bands, event, venue, city...\"","placeholder=\"Bändi, tapahtuma, paikka, kaupunki...\""],
["aria-label=\"Filter events\"","aria-label=\"Suodata tapahtumia\""],
["<th scope=\"col\">Date</th>","<th scope=\"col\">Päivä</th>"],
["<th scope=\"col\">Event</th>","<th scope=\"col\">Tapahtuma</th>"],
["<th scope=\"col\">Details</th>","<th scope=\"col\">Lisätiedot</th>"],
["<th scope=\"col\">Venue</th>","<th scope=\"col\">Paikka</th>"],
["<th scope=\"col\">City</th>","<th scope=\"col\">Kaupunki</th>"],
["<th scope=\"col\">Country</th>","<th scope=\"col\">Maa</th>"],
["<th scope=\"col\">Tickets</th>","<th scope=\"col\">Liput</th>"],
["data-label=\"Date\"","data-label=\"Päivä\""],
["data-label=\"Event\"","data-label=\"Tapahtuma\""],
["data-label=\"Details\"","data-label=\"Lisätiedot\""],
["data-label=\"Venue\"","data-label=\"Paikka\""],
["data-label=\"City\"","data-label=\"Kaupunki\""],
["data-label=\"Country\"","data-label=\"Maa\""],
["data-label=\"Tickets\"","data-label=\"Liput\""],
[">Tickets ↗</a>",">Liput ↗</a>"],
["← Explore all Events","← Kaikki keikat"],
["← Festival partners","← Festivaalit"],
["<a href=\"/\">Home</a>","<a href=\"/\">Etusivu</a>"],
["<a href=\"/events/\">Events</a>","<a href=\"/events/\">Keikat</a>"],
["<a href=\"/clients/\">Clients</a>","<a href=\"/clients/\">Yhteistyöt</a>"],
["<a href=\"/festivals/\">Festival partners</a>","<a href=\"/festivals/\">Festivaalit</a>"],
[" / Artists"," / Artistit"],
[" / Touring history"," / Kiertuehistoria"],
[" / Clients"," / Yhteistyöt"],
[" / Festival partners"," / Festivaalit"],
["<p>Upcoming gigs and our full concert archive.</p>","<p>Tulevat keikat ja koko keikkahistoriamme.</p>"],
["<p>Artists and projects we work with, plus their gig histories.</p>","<p>Yhteistyöartistit ja heidän keikkahistoriansa.</p>"],
["<p>Festival partnerships and their history.</p>","<p>Festivaalit, joiden kanssa olemme tehneet yhteistyötä, sekä niiden historia.</p>"],
["<p>Selected tours and multi-date runs.</p>","<p>Valittuja kiertueita ja useamman keikan kokonaisuuksia.</p>"],
["<p class=\"roadbook-lead\">Selected tour history.</p>","<p class=\"roadbook-lead\">Poimintoja kiertuehistoriastamme.</p>"],
["Browse all 22 selected tours","Tutustu 22 valittuun kiertueeseen"],
["Shop merch →","Osta merchandisea →"],
["Location: ","Paikkakunta: "],
["<p>Get to know more about us!</p>","<p>Tutustu Enslainin tarinaan ja porukkaan!</p>"],
["Photo taken by ","Kuva: "],
["(Phone/WhatsApp)","(Puhelin/WhatsApp)"],
["Via Messenger Cat","Messenger-kissan kautta"],
["y-tunnus: ","Y-tunnus: "],
["VAT #: ","ALV-tunniste: "],
["<a href=\"/contact/\" class=\"button\">Contact us</a>","<a href=\"/contact/\" class=\"button\">Ota yhteyttä</a>"],
["<a href=\"/contact/\" class=\"button\">Join us!</a>","<a href=\"/contact/\" class=\"button\">Tule mukaan!</a>"],
[">Read more</a>",">Lue lisää</a>"],
["Here's what we have coming up, plus an abundant (dare I say prolific!) history of where we've been.","Katso tulevat keikkamme ja selaa pitkää (kehtaamme sanoa: suorastaan mittavaa!) keikkahistoriaamme."],
["Enslain Metal Merch is the official festival and artist merchandise sales partner of Steelfest. Here you’ll find the festival editions we’ve worked, their lineups, and tickets for upcoming events.","Enslain Metal Merch on Steelfestin virallinen festivaali- ja artistimerchandisen myyntikumppani. Täältä löydät tapahtumavuodet, esiintyjät ja tulevien tapahtumien liput."]
];
const pageCopy={
services:[
["We love selling merch, and we’re damn good at it. With Enslain Metal Merch behind the merchandise table, you can leave the displaying, counting, accounting, and selling to us, while you do what you do. We bring order to the disorder.","Rakastamme oheistuotteiden myyntiä – ja osaamme hommamme pirun hyvin. Kun Enslain ottaa myyntipöydän hoitaakseen, voit keskittyä omaan tekemiseesi. Me huolehdimme esillepanosta, laskennasta, tilityksistä ja myynnistä. Laitamme kaaoksen järjestykseen."],
["We do what we do with professionalism and experience. But above all, we’re also fans of live music, and you’ll see this from our passion and dedication to doing quality work for the artists, and providing friendly, relatable service to the fans. Because we also ARE the fans!","Teemme työmme ammattitaidolla ja kokemuksella, mutta olemme myös itse livemusiikin faneja. Se näkyy siinä, miten pidämme huolta artisteista ja palvelemme yleisöä. Tiedämme, millaista palvelua fanit arvostavat – koska olemme itsekin faneja!"],
["We work with bands of all sizes, in cities across Finland, to help take away the burden of self-vending, and make sure to create an organized and attention-catching display for the fans to browse. When possible, we try to provide a local seller for gigs, to avoid travel and accommodation costs, but we’re also willing to travel if you’re looking for a dedicated merch seller to join your crew!","Työskentelemme erikokoisten bändien kanssa ympäri Suomen. Otamme oheistuotemyynnin hoitaaksemme, jotta bändin ei tarvitse myydä tuotteita itse. Huolehdimme myös selkeästä ja houkuttelevasta myyntipisteestä. Pyrimme järjestämään keikoille paikallisen myyjän matkustus- ja majoituskulujen säästämiseksi, mutta lähdemme mielellämme myös kiertueelle osaksi miehistöä."],
["When it comes to tours, we like to work with the artists from the very beginning, helping with planning the item selection and ordering the goods, selling and re-stocking the merchandise, and coordinating inventory and accounting. Some of us also have the required visas/passports to work in North America.","Kiertueilla voimme olla mukana jo suunnitteluvaiheessa: autamme tuotevalikoiman suunnittelussa ja tilaamisessa sekä hoidamme myynnin, täydennystilaukset, varaston seurannan ja tilitykset. Osalla tiimistämme on myös Pohjois-Amerikassa työskentelyyn tarvittavat luvat ja matkustusasiakirjat."],
["A few of the bands we regularly work with: ","Bändejä, joiden kanssa työskentelemme säännöllisesti: "],
["Ready to enjoy your gig days without having to think about merch? That’s our thing, let us do the heavy lifting!","Haluatko keskittyä keikkapäivänä olennaiseen ja jättää oheistuotemyynnin meille? Hoidamme homman puolestasi!"],
["We’ve been selling festival merch since 2017, and we handle the merchandise management, coordination, staffing, sales, card processing, inventory, and accounting. Most of our crew speaks both Finnish and English, and we have our own POS system and card readers as well as supplies for display and accounting. We’re also flexible, and ready to adapt to your event. Note that although we are specialized in heavy metal events, we are also available for others.","Olemme myyneet festivaalien oheistuotteita vuodesta 2017. Huolehdimme myynnin suunnittelusta ja koordinoinnista, myyntihenkilöstöstä, korttimaksuista, varastosta sekä myynnin seurannasta ja tilityksistä. Suurin osa porukastamme palvelee sekä suomeksi että englanniksi. Käytössämme on omat kassajärjestelmät, maksupäätteet ja myyntipisteen tarvikkeet. Sopeudumme erilaisten tapahtumien tarpeisiin. Erikoisalaamme ovat metallikeikat, mutta työskentelemme myös muiden musiikkityylien parissa."],
["Some of the event and festival clients we’ve worked with: ","Esimerkkejä tapahtumista ja yhteistyökumppaneista: "],
["Looking for an affordable and adaptable crew to take care of your festival’s merch tent? Want to improve your event’s merch experience with a crew that loves what they do, and does it well? Let us send you an offer with more details!","Tarvitsetko festivaalin oheistuotemyyntiin luotettavan ja joustavan tiimin? Kerro tapahtumastasi, niin laadimme sinulle tarjouksen!"]
],
volunteers:[
["At Enslain, our crew is our life blood.","Enslainin tärkein voimavara on meidän porukkamme."],
["We’re always looking to build our team with like-minded folks who are passionate about being part of the live music scene! We’re a fun-loving crew who don’t take ourselves too seriously, except when it comes to getting the job done.","Etsimme jatkuvasti mukaan samanhenkisiä ihmisiä, jotka rakastavat livemusiikkia. Meillä pidetään hauskaa eikä turhaan jäykistellä – mutta hommat hoidetaan kunnolla."],
["All our crew members get to decide which gigs they’re interested in participating in: do you only want to work at gigs in your city? Do you love volunteering at festivals and want to be on the crew that has the most fun? Does touring the world sound like an adventure you need in your life? Let’s make it happen!","Jokainen saa itse päättää, mille keikoille haluaa lähteä. Kiinnostavatko vain oman kaupungin keikat? Haluatko talkoilla festareilla hyvässä seurassa? Tai lähtisitkö mieluiten mukaan kiertueelle maailmalle? Meiltä löytyy monenlaisia mahdollisuuksia."],
["Get free entry to gigs/fests","Vapaa pääsy keikoille ja festareille"],
["Hang with cool people (at least we think we’re pretty cool)","Hyvää seuraa (ainakin omasta mielestämme)"],
["Get breaks to watch bands","Mahdollisuus katsoa bändejä tauoilla"],
["Laugh at drunks and naked people","Mahdollisuus ihmetellä humalaisia ja vähäpukeisia festarikävijöitä"],
["Meet bands","Tapaat bändejä"],
["Free meals, and sometimes also beers","Ruokaa ja joskus myös olutta"],
["Get occasional free swag","Välillä ilmaisia fanituotteita"],
["Here are some places and events we’re especially looking to recruit fresh blood:","Kaipaamme tällä hetkellä erityisesti uusia tekijöitä seuraavilta alueilta:"],
["More sellers from Oulu, Helsinki and Seinäjoki","Lisää myyjiä Oulusta, Helsingistä ja Seinäjoelta"],
["Everything and anything else!","Ja kaikenlaista muutakin!"],
["Hells yeah it does. Send us a message and let us know how you’d like to be involved!","Mahtavaa! Laita meille viestiä ja kerro, millaisiin hommiin haluaisit mukaan."]
]};
export function localize(source,route){
 let s=source;
 const uiSwap=(a,b)=>{if(s.includes(a))s=s.replaceAll(a,b)};
 const display=s.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.replaceAll("&amp;","&")||route.split("/").pop();
 const top=route.split("/")[0];
 const seo=titles[route]||[display+" – "+(top==="artists"?"keikat":top==="festivals"?"festivaalihistoria":"kiertueen keikat"),"Tutustu Enslainin "+(top==="artists"?"artistiyhteistyöhön ja keikkahistoriaan":top==="festivals"?"festivaaliyhteistyöhön ja tapahtumiin":"kiertuehistoriaan")+": "+display+"."];
 const escHtml=x=>x.replaceAll("&","&amp;").replaceAll('"',"&quot;");
 s=uiSwapRet(s,'<html lang="en-US">','<html lang="fi">');
 s=s.replace(/<title>[\s\S]*?<\/title>/,'<title>'+escHtml(seo[0])+' | Enslain Metal Merch</title>')
 .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+escHtml(seo[1])+'">')
 .replace(/<meta property="og:title" content="[^"]*">/,'<meta property="og:title" content="'+escHtml(seo[0])+' | Enslain Metal Merch">')
 .replace(/<meta property="og:description" content="[^"]*">/,'<meta property="og:description" content="'+escHtml(seo[1])+'">');
 const en="https://www.enslain.net/"+route+"/",fi="https://www.enslain.net/fi/"+route+"/";
 s=s.replace(/<link rel="canonical" href="[^"]*">/,'<link rel="canonical" href="'+fi+'">')
 .replace(/<meta property="og:url" content="[^"]*">/,'<meta property="og:url" content="'+fi+'">');
 uiSwap('<link rel="stylesheet" href="/assets/style.css">','<link rel="stylesheet" href="/assets/style.css">\n  <link rel="stylesheet" href="/assets/locale.css">');
 if(!s.includes('hreflang="fi"'))s=s.replace(/<link rel="canonical"[^>]*>/,v=>v+'\n  <link rel="alternate" hreflang="en" href="'+en+'">\n  <link rel="alternate" hreflang="fi" href="'+fi+'">');
 // Avoid search-engine duplicate pages for unchanged English biographies and Roadbook listings.
 if(route==="events"||route==="about"||(["artists","festivals","touring-history"].includes(top)&&route.includes("/")))s=s.replace("</head>",'  <meta name="robots" content="noindex,follow">\n</head>');
 const a=s.indexOf('<nav class="header__primary-nav'),b=s.indexOf("</nav>",a);
 if(a<0||b<0)throw new Error("Missing shared navigation in "+route);
 let nav=s.slice(a,b+6);
 for(const [enLabel,fiLabel] of [["Home","Etusivu"],["Services","Palvelut"],["Volunteers","Talkoolaiset"],["Events","Keikat"],["Clients","Yhteistyöt"],["Webshop","Verkkokauppa"],["About","Meistä"],["Contact","Yhteystiedot"]])nav=nav.replaceAll(">"+enLabel+"</a>",">"+fiLabel+"</a>");
 nav=localLinks(nav);
 const language='<nav class="locale-switch" aria-label="Language"><span class="locale-switch__label">Language</span><a href="/'+route+'/" lang="en">EN</a><span aria-hidden="true">·</span><a href="/fi/'+route+'/" lang="fi" aria-current="page">FI</a></nav>';
 s=s.slice(0,a)+nav+'\n      '+language+s.slice(b+6);
 for(const [x,y] of ui)uiSwap(x,y);
 for(const [x,y] of pageCopy[route]||[])if(!s.includes(x))throw new Error("Translation source not found in "+route+": "+x.slice(0,70));else uiSwap(x,y);
 if(top==="artists"){
  s=s.replace(/(\d+) past events?\b/g,(_m,n)=>n+" "+(n==="1"?"mennyt keikka":"mennyttä keikkaa"));
  s=s.replace(/(\d+) upcoming\b/g,(_m,n)=>n+" "+(n==="1"?"tuleva keikka":"tulevaa keikkaa"));
 }
 if(top==="festivals"){
  s=s.replace(/(\d+) past events?\b/g,(_m,n)=>n+" "+(n==="1"?"aiempi tapahtuma":"aiempaa tapahtumaa"));
  s=s.replace(/Next (?=\d)/g,"Seuraava ");
 }
 if(top==="touring-history"){
  s=s.replace(/(\d+) gigs\b/g,(_m,n)=>n+" "+(n==="1"?"keikka":"keikkaa"));
 }
 if(route==="about"){
  // Chrissy's and crew members' original biographies intentionally remain in English.
  s=s.replace(/(<h3>Chrissy Hujanen \(Lady Enslain\)<\/h3>[\s\S]*?<div class="text-container")>/,'$1 lang="en">');
  s=s.replace(/<li class="card card--crew">/g,'<li class="card card--crew" lang="en">');
 }
 if(route==="contact")uiSwap('href="mailto:merch@enslain.net "','href="mailto:merch@enslain.net"');
 if(route==="events"){
  for(const [x,y] of [["Clear filters","Tyhjennä suodattimet"],["Load more","Näytä lisää"],["Upcoming events","Tulevat tapahtumat"],["Past events","Menneet tapahtumat"],["No events found","Tapahtumia ei löytynyt"]])
    s=s.replaceAll(">"+x+"</button>",">"+y+"</button>").replaceAll(">"+x+"</h2>",">"+y+"</h2>").replaceAll(">"+x+"</span>",">"+y+"</span>");
 }
 for(const [x,y] of [["Choose a color theme","Valitse väriteema"],["Toggle Chrissy Mode","Chrissy Mode"],["Follow or contact us!","Seuraa meitä tai ota yhteyttä!"]])uiSwap(">"+x+"<",">"+y+"<");
 for(const [x,y] of [["Dark","Tumma teema"],["Light","Vaalea teema"],["Off","Pois"],["On","Päällä"]])uiSwap(">"+x+"</label>",">"+y+"</label>");
 uiSwap('aria-label="scroll to top"','aria-label="Siirry sivun alkuun"');
 uiSwap('aria-label="Link to home page"','aria-label="Etusivulle"');
 uiSwap('aria-label="Open site navigation"','aria-label="Avaa valikko"');
 s=localLinks(s);
 return s;
}
function uiSwapRet(s,a,b){return s.replaceAll(a,b)}
