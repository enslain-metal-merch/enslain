// Regenerate the Finnish homepage after updating the compiled English homepage.
// Usage: node scripts/build-fi-homepage.mjs
// English stays the shared layout and featured-event source; no private Roadbook records are accessed.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const enSwitch="      <nav class=\"locale-switch\" aria-label=\"Language\"><span class=\"locale-switch__label\">Language</span><a href=\"/\" lang=\"en\" aria-current=\"page\">EN</a><span aria-hidden=\"true\">·</span><a href=\"/fi/\" lang=\"fi\">FI</a></nav>";
const fiSwitch="      <nav class=\"locale-switch\" aria-label=\"Language\"><span class=\"locale-switch__label\">Language</span><a href=\"/\" lang=\"en\">EN</a><span aria-hidden=\"true\">·</span><a href=\"/fi/\" lang=\"fi\" aria-current=\"page\">FI</a></nav>";
function generateFI(source){
  const replace=(old,neu)=>{const n=source.split(old).length-1;if(n!==1)throw new Error("FI copy missing or duplicate "+n+": "+old.slice(0,100));source=source.replace(old,neu);};
  replace('<html lang="en-US">','<html lang="fi">');
  const enTitle='Merch Management in Finland &amp; Europe | Enslain Metal Merch',fiTitle='Merchandise-myynti keikoille ja festivaaleille | Enslain Metal Merch';
  replace(`<title>${enTitle}</title>`,`<title>${fiTitle}</title>`);
  const enDesc='Hire experienced concert, festival and tour merchandise management and crew. Based in Finland, supporting bands and tours across Europe and the U.S.';
  const fiDesc='Enslain työskentelee artistien, tapahtumajärjestäjien ja festivaalien kanssa Suomessa ja ulkomailla. Oheistuotemyynti, myyjät, kiertueet ja logistiikka.';
  replace(`<meta name="description" content="${enDesc}">`,`<meta name="description" content="${fiDesc}">`);
  replace('<link rel="canonical" href="https://www.enslain.net/">','<link rel="canonical" href="https://www.enslain.net/fi/">');
  replace(`<meta property="og:title" content="${enTitle}">`,`<meta property="og:title" content="${fiTitle}">`);
  replace(`<meta property="og:description" content="${enDesc}">`,`<meta property="og:description" content="${fiDesc}">`);
  replace('<meta property="og:url" content="https://www.enslain.net/">','<meta property="og:url" content="https://www.enslain.net/fi/">');
  replace(enSwitch,fiSwitch);
  replace('<li class="header__primary-menu-item"><a href="/" aria-current="page">Home</a></li>','<li class="header__primary-menu-item"><a href="/fi/" aria-current="page">Etusivu</a></li>');
  for(const [a,b] of [["Services","Palvelut"],["Volunteers","Talkoolaiset"],["Events","Keikat"],["Clients","Yhteistyöt"],["Webshop","Verkkokauppa"],["About","Meistä"],["Contact","Yhteystiedot"]])replace(`>${a}</a></li>`,`>${b}</a></li>`);
  replace('<a class="header__logo" href="/" aria-label="Link to home page">','<a class="header__logo" href="/fi/" aria-label="Etusivulle">');
  replace('aria-label="Open site navigation"','aria-label="Avaa valikko"');
  replace("If you go to metal gigs in Finland, you've almost certainly bought a T-shirt from us. Unless you don't like wearing clothes.","Jos käyt metallikeikoilla Suomessa, olet melko varmasti ostanut meiltä bändipaidan. Paitsi jos et tykkää käyttää vaatteita.");
  replace("Merchandise sales, staffing, management, production, and webshop sales for bands, concerts, and festivals. Over 20 years, hundreds of events, and still loving it.","Enslain työskentelee artistien, tapahtumajärjestäjien ja festivaalien kanssa Suomessa ja ulkomailla. Hoidamme oheistuotemyyntiä, järjestämme myyjät paikalle ja huolehdimme kiertueiden myyntijärjestelyistä, logistiikasta, tuotteiden tuotannosta sekä verkkokauppamyynnistä.</p>\n          <p>Homma innostaa edelleen, vaikka meillä on takana satoja tapahtumia ja yli 20 vuoden kokemus!");
  replace('aria-label="Explore Enslain"','aria-label="Tutustu Enslainiin"');
  for(const [a,b] of [["Work with us","Tutustu palveluihin"],["See our gigs","Katso keikkamme"],["Let’s sell some merch!","Merkku myyntiin!"],["Interested in hiring us, or working with us?","Tarvitsetko meitä keikkahommiin vai haluaisitko itse mukaan porukkaan?"],["For bands","Bändeille"],["For promoters","Tapahtumajärjestäjille"],["For volunteers","Talkoolaisille"],["Join us!","Tule mukaan!"],["What we're up to","Mitä meillä on meneillään?"],["All upcoming events","Kaikki tulevat keikat"],["Follow on Instagram","Seuraa Instagramissa"],["Follow on Facebook","Seuraa Facebookissa"]])replace(`>${a}<`,`>${b}<`);
  const texts=[
    ["Looking for local sellers for your gigs, or someone to join your crew on tour? That’s what we do!","Etsitkö keikallesi paikallista merchandise-myyjää tai kiertueelle mukaan lähtevää myyntivastaavaa? Voit lopettaa etsimisen tähän."],
    ["Need an experienced and affordable crew to manage your event’s merchandise sales? We love festivals!","Tarvitsetko keikalle tai festivaalille kokeneen ja luotettavan porukan hoitamaan oheistuotemyyntiä? Meiltä löytyy tekijät niin pienille keikoille kuin suurille festivaaleillekin."],
    ["Have you always wanted to be part of a crew dedicated to music, or do you love the idea of working at events?","Haluatko kurkistaa musiikkitapahtumien kulissien taakse ja päästä mukaan pyörittämään keikkojen ja festivaalien merkkumyyntiä?"],
    ["Metal is our natural habitat, but we also venture into other genres whenever our merch expertise is summoned.","Parhaiten meille maistuu metallimusiikki, mutta muutkaan musiikkityylit eivät ole vieraita. Olemme tehneet sujuvaa yhteistyötä myös rock-, jazz-, pop- ja rap-artistien kanssa."],
    ["Merch Management &amp; Logistics","Myynnin koordinointi ja logistiikka"],
    ["Merch Management &amp; Staffing","Myynnin koordinointi ja myyntihenkilöstö"],
    ["Merch Management","Oheistuotemyynnin koordinointi"],
    ["Merch Sales &amp; Staffing","Merchandise-myynti ja myyntihenkilöstö"],
    ["Choose a color theme","Valitse väriteema"],["Toggle Chrissy Mode","Chrissy Mode"],
    ["Follow or contact us!","Seuraa meitä tai ota yhteyttä!"],
    ["Latest Instagram posts from Enslain Metal Merch","Enslain Metal Merchin uusimmat Instagram-julkaisut"],
    ["Link to home page","Etusivulle"],["scroll to top","Siirry sivun alkuun"],
    ["Link to Enslain Metal Merch Facebook page","Enslain Metal Merchin Facebook-sivu"],
    ["Link to Enslain Metal Merch Instagram page","Enslain Metal Merchin Instagram-sivu"],
    ["Email Enslain Metal Merch","Lähetä sähköpostia Enslain Metal Merchille"],
    ["Kalmah's, Mors Subita's, and Suotana's t-shirts, hats, patches, CDs and vinyls neatly displayed on a table.","Kalmahin, Mors Subitan ja Suotanan paitoja, päähineitä, kangasmerkkejä, CD-levyjä ja vinyylejä esillä myyntipöydällä."],
    ["Chrissy, Miikka, Amy and Janetta enthusiastically flashing the horns in a large merchandise tent at Metal Capital festival.","Chrissy, Miikka, Amy ja Janetta näyttävät metallitervehdystä Metal Capital -festivaalin myyntiteltassa."],
    ["Chrissy, Nadya, Katri, Milla, Serena, Janetta and Aaro are huddled together and smiling, standing in front of and top of the merchandise table at Steelfest 2023.","Chrissy, Nadya, Katri, Milla, Serena, Janetta ja Aaro poseeraavat Steelfest 2023 -festivaalin merchandise-pisteellä."]
  ];
  for(const [a,b] of texts)replace(a,b);
  if(source.split(">Read more</a>").length!==3)throw new Error("Expected two Read more buttons");
  source=source.replaceAll(">Read more</a>",">Lue lisää</a>");
  for(const [a,b] of [["Dark","Tumma teema"],["Light","Vaalea teema"],["Off","Pois"],["On","Päällä"]]){
    const re=new RegExp(`>${a}</label>`,"g");let count=0;source=source.replace(re,()=>{count++;return `>${b}</label>`});if(count!==1)throw new Error("Footer label "+a+" count "+count);
  }
  replace('<a href="/" class="footer__logo" aria-label="Etusivulle">','<a href="/fi/" class="footer__logo" aria-label="Etusivulle">');
  source=source.replaceAll('src="assets/','src="/assets/');
  source=source.replaceAll('href="assets/','href="/assets/');
  return source;
}
const source=readFileSync(resolve(root,'public/index.html'),'utf8');
const output=generateFI(source);
mkdirSync(resolve(root,'public/fi'),{recursive:true});
writeFileSync(resolve(root,'public/fi/index.html'),output);
