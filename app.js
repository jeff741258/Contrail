(function(){
"use strict";
// ---------- reference data ----------
const AP_RAW = "SAN 32.73 -117.19 US San Diego;LAX 33.94 -118.41 US Los Angeles;SFO 37.62 -122.38 US San Francisco;OAK 37.72 -122.22 US Oakland;SJC 37.36 -121.93 US San Jose;SMF 38.70 -121.59 US Sacramento;BUR 34.20 -118.36 US Burbank;LGB 33.82 -118.15 US Long Beach;SNA 33.68 -117.87 US Orange County;ONT 34.06 -117.60 US Ontario CA;PSP 33.83 -116.51 US Palm Springs;SBA 34.43 -119.84 US Santa Barbara;FAT 36.78 -119.72 US Fresno;MRY 36.59 -121.84 US Monterey;SBP 35.24 -120.64 US San Luis Obispo;SEA 47.45 -122.31 US Seattle;PDX 45.59 -122.60 US Portland;GEG 47.62 -117.53 US Spokane;BOI 43.56 -116.22 US Boise;RNO 39.50 -119.77 US Reno;LAS 36.08 -115.15 US Las Vegas;PHX 33.43 -112.01 US Phoenix;TUS 32.12 -110.94 US Tucson;SLC 40.79 -111.98 US Salt Lake City;DEN 39.86 -104.67 US Denver;ABQ 35.04 -106.61 US Albuquerque;ELP 31.81 -106.38 US El Paso;BZN 45.78 -111.15 US Bozeman;JAC 43.61 -110.74 US Jackson Hole;ASE 39.22 -106.87 US Aspen;EGE 39.64 -106.92 US Vail;ANC 61.17 -149.99 US Anchorage;HNL 21.32 -157.92 US Honolulu;OGG 20.90 -156.43 US Maui;KOA 19.74 -156.05 US Kona;LIH 21.98 -159.34 US Lihue;DFW 32.90 -97.04 US Dallas;DAL 32.85 -96.85 US Dallas Love;IAH 29.98 -95.34 US Houston;HOU 29.65 -95.28 US Houston Hobby;AUS 30.19 -97.67 US Austin;SAT 29.53 -98.47 US San Antonio;OKC 35.39 -97.60 US Oklahoma City;TUL 36.20 -95.89 US Tulsa;MSY 29.99 -90.26 US New Orleans;MEM 35.04 -89.98 US Memphis;ORD 41.98 -87.90 US Chicago;MDW 41.79 -87.75 US Chicago Midway;MSP 44.88 -93.22 US Minneapolis;STL 38.75 -90.37 US St. Louis;MCI 39.30 -94.71 US Kansas City;OMA 41.30 -95.89 US Omaha;DTW 42.21 -83.35 US Detroit;CLE 41.41 -81.85 US Cleveland;CMH 40.00 -82.89 US Columbus;IND 39.72 -86.29 US Indianapolis;MKE 42.95 -87.90 US Milwaukee;CVG 39.05 -84.67 US Cincinnati;SDF 38.17 -85.74 US Louisville;PIT 40.49 -80.23 US Pittsburgh;ATL 33.64 -84.43 US Atlanta;CLT 35.21 -80.94 US Charlotte;RDU 35.88 -78.79 US Raleigh-Durham;BNA 36.12 -86.68 US Nashville;MCO 28.43 -81.31 US Orlando;MIA 25.80 -80.29 US Miami;FLL 26.07 -80.15 US Fort Lauderdale;TPA 27.98 -82.53 US Tampa;RSW 26.54 -81.76 US Fort Myers;JAX 30.49 -81.69 US Jacksonville;SAV 32.13 -81.20 US Savannah;CHS 32.90 -80.04 US Charleston;RIC 37.51 -77.32 US Richmond;ORF 36.89 -76.20 US Norfolk;JFK 40.64 -73.78 US New York JFK;LGA 40.78 -73.87 US New York LaGuardia;EWR 40.69 -74.17 US Newark;BOS 42.36 -71.01 US Boston;PHL 39.87 -75.24 US Philadelphia;IAD 38.95 -77.46 US Washington Dulles;DCA 38.85 -77.04 US Washington National;BWI 39.18 -76.67 US Baltimore;BDL 41.94 -72.68 US Hartford;PVD 41.73 -71.42 US Providence;BUF 42.94 -78.73 US Buffalo;ALB 42.75 -73.80 US Albany;PWM 43.65 -70.31 US Portland ME;BTV 44.47 -73.15 US Burlington;SJU 18.44 -66.00 PR San Juan;YVR 49.19 -123.18 CA Vancouver;YYJ 48.65 -123.43 CA Victoria;YXX 49.03 -122.36 CA Abbotsford;YLW 49.96 -119.38 CA Kelowna;YYC 51.13 -114.01 CA Calgary;YEG 53.31 -113.58 CA Edmonton;YXE 52.17 -106.70 CA Saskatoon;YWG 49.91 -97.24 CA Winnipeg;YYZ 43.68 -79.63 CA Toronto;YTZ 43.63 -79.40 CA Toronto Island;YOW 45.32 -75.67 CA Ottawa;YUL 45.47 -73.74 CA Montreal;YQB 46.79 -71.39 CA Quebec City;YHZ 44.88 -63.51 CA Halifax;YYT 47.62 -52.75 CA St. John's;MEX 19.44 -99.07 MX Mexico City;CUN 21.04 -86.87 MX Cancún;GDL 20.52 -103.31 MX Guadalajara;SJD 23.15 -109.72 MX Los Cabos;PVR 20.68 -105.25 MX Puerto Vallarta;TIJ 32.54 -116.97 MX Tijuana;MTY 25.78 -100.11 MX Monterrey;NAS 25.04 -77.47 BS Nassau;MBJ 18.50 -77.91 JM Montego Bay;PUJ 18.57 -68.36 DO Punta Cana;AUA 12.50 -70.02 AW Aruba;SJO 9.99 -84.21 CR San José;LIR 10.59 -85.54 CR Liberia;PTY 9.07 -79.38 PA Panama City;BOG 4.70 -74.15 CO Bogotá;MDE 6.16 -75.42 CO Medellín;CTG 10.44 -75.51 CO Cartagena;LIM -12.02 -77.11 PE Lima;CUZ -13.54 -71.94 PE Cusco;UIO -0.13 -78.36 EC Quito;SCL -33.39 -70.79 CL Santiago;EZE -34.82 -58.54 AR Buenos Aires;GRU -23.43 -46.47 BR São Paulo;GIG -22.81 -43.25 BR Rio de Janeiro;LHR 51.47 -0.45 GB London Heathrow;LGW 51.15 -0.19 GB London Gatwick;STN 51.89 0.24 GB London Stansted;LCY 51.50 0.05 GB London City;MAN 53.36 -2.27 GB Manchester;EDI 55.95 -3.37 GB Edinburgh;GLA 55.87 -4.43 GB Glasgow;DUB 53.42 -6.27 IE Dublin;SNN 52.70 -8.92 IE Shannon;CDG 49.01 2.55 FR Paris CDG;ORY 48.72 2.38 FR Paris Orly;NCE 43.66 7.22 FR Nice;LYS 45.73 5.08 FR Lyon;AMS 52.31 4.76 NL Amsterdam;BRU 50.90 4.48 BE Brussels;FRA 50.03 8.56 DE Frankfurt;MUC 48.35 11.79 DE Munich;BER 52.37 13.50 DE Berlin;DUS 51.29 6.77 DE Düsseldorf;HAM 53.63 9.99 DE Hamburg;ZRH 47.46 8.55 CH Zurich;GVA 46.24 6.11 CH Geneva;VIE 48.11 16.57 AT Vienna;PRG 50.10 14.26 CZ Prague;BUD 47.44 19.26 HU Budapest;WAW 52.17 20.97 PL Warsaw;KRK 50.08 19.78 PL Kraków;CPH 55.62 12.66 DK Copenhagen;ARN 59.65 17.92 SE Stockholm;OSL 60.19 11.10 NO Oslo;HEL 60.32 24.96 FI Helsinki;KEF 63.99 -22.61 IS Reykjavík;MAD 40.47 -3.56 ES Madrid;BCN 41.30 2.08 ES Barcelona;PMI 39.55 2.74 ES Palma;AGP 36.67 -4.50 ES Málaga;LIS 38.77 -9.13 PT Lisbon;OPO 41.24 -8.68 PT Porto;FCO 41.80 12.25 IT Rome;MXP 45.63 8.72 IT Milan;LIN 45.45 9.28 IT Milan Linate;VCE 45.51 12.35 IT Venice;NAP 40.88 14.29 IT Naples;FLR 43.81 11.20 IT Florence;ATH 37.94 23.94 GR Athens;JTR 36.40 25.48 GR Santorini;IST 41.26 28.74 TR Istanbul;DXB 25.25 55.36 AE Dubai;AUH 24.43 54.65 AE Abu Dhabi;DOH 25.27 51.61 QA Doha;TLV 32.01 34.89 IL Tel Aviv;AMM 31.72 35.99 JO Amman;RUH 24.96 46.70 SA Riyadh;CAI 30.12 31.41 EG Cairo;CMN 33.37 -7.59 MA Casablanca;RAK 31.61 -8.04 MA Marrakesh;JNB -26.14 28.25 ZA Johannesburg;CPT -33.96 18.60 ZA Cape Town;NBO -1.32 36.93 KE Nairobi;ADD 8.98 38.80 ET Addis Ababa;LOS 6.58 3.32 NG Lagos;DEL 28.56 77.10 IN Delhi;BOM 19.09 72.87 IN Mumbai;BLR 13.20 77.71 IN Bengaluru;MAA 12.99 80.17 IN Chennai;HYD 17.24 78.43 IN Hyderabad;SIN 1.36 103.99 SG Singapore;KUL 2.75 101.71 MY Kuala Lumpur;BKK 13.69 100.75 TH Bangkok;HKT 8.11 98.32 TH Phuket;HKG 22.31 113.91 HK Hong Kong;TPE 25.08 121.23 TW Taipei;ICN 37.46 126.44 KR Seoul Incheon;GMP 37.56 126.79 KR Seoul Gimpo;NRT 35.77 140.39 JP Tokyo Narita;HND 35.55 139.78 JP Tokyo Haneda;KIX 34.43 135.24 JP Osaka Kansai;ITM 34.79 135.44 JP Osaka Itami;FUK 33.59 130.45 JP Fukuoka;CTS 42.78 141.69 JP Sapporo;OKA 26.20 127.65 JP Okinawa;PEK 40.08 116.58 CN Beijing;PKX 39.51 116.41 CN Beijing Daxing;PVG 31.14 121.81 CN Shanghai Pudong;SHA 31.20 121.34 CN Shanghai Hongqiao;CAN 23.39 113.30 CN Guangzhou;SZX 22.64 113.81 CN Shenzhen;CTU 30.58 103.95 CN Chengdu;MNL 14.51 121.02 PH Manila;CGK -6.13 106.66 ID Jakarta;DPS -8.75 115.17 ID Bali;SGN 10.82 106.65 VN Ho Chi Minh City;HAN 21.22 105.81 VN Hanoi;SYD -33.95 151.18 AU Sydney;MEL -37.67 144.84 AU Melbourne;BNE -27.38 153.12 AU Brisbane;PER -31.94 115.97 AU Perth;ADL -34.95 138.53 AU Adelaide;OOL -28.16 153.50 AU Gold Coast;AKL -37.01 174.79 NZ Auckland;WLG -41.33 174.81 NZ Wellington;CHC -43.49 172.53 NZ Christchurch;ZQN -45.02 168.74 NZ Queenstown;NAN -17.76 177.44 FJ Nadi;PPT -17.55 -149.61 PF Tahiti";
const AP = {};
AP_RAW.split(";").forEach(s=>{const p=s.split(" ");AP[p[0]]={lat:+p[1],lon:+p[2],cc:p[3],city:p.slice(4).join(" ")};});

const AL = {AS:"Alaska",AA:"American",UA:"United",DL:"Delta",WN:"Southwest",B6:"JetBlue",NK:"Spirit",F9:"Frontier",HA:"Hawaiian",G4:"Allegiant",SY:"Sun Country",MX:"Breeze",AC:"Air Canada",WS:"WestJet",PD:"Porter",F8:"Flair",TS:"Air Transat",AM:"Aeroméxico",Y4:"Volaris",VB:"Viva Aerobus",CM:"Copa",AV:"Avianca",LA:"LATAM",AR:"Aerolíneas Argentinas",G3:"GOL",AD:"Azul",BA:"British Airways",VS:"Virgin Atlantic",AF:"Air France",KL:"KLM",LH:"Lufthansa",LX:"SWISS",OS:"Austrian",SN:"Brussels Airlines",IB:"Iberia",VY:"Vueling",UX:"Air Europa",TP:"TAP Air Portugal",AZ:"ITA Airways",EI:"Aer Lingus",SK:"SAS",AY:"Finnair",FI:"Icelandair",DY:"Norwegian",LO:"LOT",TK:"Turkish",U2:"easyJet",FR:"Ryanair",W6:"Wizz Air",EK:"Emirates",QR:"Qatar Airways",EY:"Etihad",LY:"El Al",RJ:"Royal Jordanian",SV:"Saudia",MS:"EgyptAir",AT:"Royal Air Maroc",ET:"Ethiopian",KQ:"Kenya Airways",SA:"South African",CX:"Cathay Pacific",SQ:"Singapore Airlines",TR:"Scoot",NH:"ANA",JL:"JAL",MM:"Peach",KE:"Korean Air",OZ:"Asiana",BR:"EVA Air",CI:"China Airlines",CA:"Air China",MU:"China Eastern",CZ:"China Southern",HX:"Hong Kong Airlines",TG:"Thai",MH:"Malaysia Airlines",AK:"AirAsia",GA:"Garuda",PR:"Philippine Airlines",VN:"Vietnam Airlines",VJ:"VietJet",AI:"Air India","6E":"IndiGo",QF:"Qantas",JQ:"Jetstar",VA:"Virgin Australia",NZ:"Air New Zealand",FJ:"Fiji Airways",TN:"Air Tahiti Nui"};
const TRUSTED_AL = new Set(Object.keys(AL)); // these may be written with a space ("AC 8767")
const AL_NAMES = {"Alaska":"AS","United":"UA","Delta":"DL","American":"AA","Southwest":"WN","JetBlue":"B6","Air Canada":"AC","WestJet":"WS","Spirit":"NK","Frontier":"F9","Hawaiian":"HA","Allegiant":"G4","Porter":"PD","Lufthansa":"LH","British Airways":"BA","Air France":"AF","KLM":"KL","Emirates":"EK","Qantas":"QF"};
// Airport codes that are also common English words: only accept them with route-like punctuation around them.
// The ~230 airports above are "trusted": their codes count wherever they appear. The thousands added
// from airports.js only count with route punctuation around them, e.g. "(KOJ)" or "KOJ →".
const CURATED = new Set(Object.keys(AP));
const AP_NAMES = {}; // lower-case city or airport name -> [{code, size, kind}]
if(typeof AIRPORT_DATA==="string"){
  AIRPORT_DATA.split(";").forEach(s=>{const [c,lat,lon,cc,city,name,size,kw]=s.split("|");
    if(!AP[c])AP[c]={lat:+lat,lon:+lon,cc,city:city||name};
    AP[c].size=+size||1;AP[c].name=name;AP[c].muni=city;AP[c].kw=kw?kw.split(","):[];});
}
if(typeof AIRLINE_DATA==="string")AIRLINE_DATA.split(";").forEach(s=>{const i=s.indexOf("|"),c=s.slice(0,i);if(!AL[c])AL[c]=s.slice(i+1);});
const ICAO_AL = typeof AIRLINE_ICAO==="object"?AIRLINE_ICAO:{};
// 3-letter words that look like codes but usually aren't (currencies, days, months, email words)
const NOT_CODES = new Set("USD CAD EUR GBP JPY AUD NZD CHF CNY HKD SGD KRW INR MXN BRL THB TWD SEK NOK DKK PLN AED ZAR PHP IDR MYR VND MON TUE WED THU FRI SAT SUN JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC THE AND FOR YOU ALL NEW ARE NOT TAX FEE BAG PNR ETA ETD UTC GMT PST PDT EST EDT CST CDT MST MDT JST KST CET VIP FAQ PDF APP WEB VAT NET PER ONE TWO OUT OFF YES".split(" "));
function addName(key,code,kind){key=key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
  if(key.length<4)return;(AP_NAMES[key]=AP_NAMES[key]||[]).push({code,size:AP[code].size||2,kind});}
Object.keys(AP).forEach(c=>{const a=AP[c];
  if(a.muni)addName(a.muni,c,"city"); else addName(a.city,c,"city");
  if(a.name&&a.name!==a.muni)addName(a.name,c,"name");
  if(CURATED.has(c)&&a.city!==a.muni)addName(a.city,c,"name"); // e.g. "Tokyo Haneda"
  (a.kw||[]).forEach(k=>addName(k,c,"name"));
});
// Words that are also place names but in an email are almost always something else.
const NOT_PLACES = new Set(["fare","fares","route","routes","boeing","airbus","embraer","bombardier","total","base","basic","main","standard","saver","flex","comfort","select","plus","value","light","lite","classic","premier","elite","gold","silver","platinum","star","alliance","window","aisle","carry","bags","baggage","meal","status","miles","points","reward","refund","change","cancel","policy","terms","conditions","notice","important","information","contact","customer","service","support","manage","view","check","online","email","phone","welcome","thank","thanks","hello","summary","trip","travel","traveler","name","time","times","local","duration","stop","stops","nonstop","direct","connection","layover","class","economy","premium","business","first","seat","seats","number","sector","flight","flights","from","date","total","gate","terminal","mobile","nice","split","male","page","price","reading","orange","bath","victoria","eagle","independence","liberal","hope","marathon","friendly","grand","union","central","national","regional","north","south","east","west","new","port","saint","fort","lake","island","islands","city","valley","beach","bay","river","mount","general","airport","international","passenger","reservation","details","payment","adult","child","arrival","departure","depart","arrive","operated","boarding","confirmation","booking","receipt","itinerary","dear"]);
const AMBIG = new Set(["CAN","PER","ADD","MAN","SEA","DEN","BOS","MIA","LAS","ANC","BER","OPO","LOS","SHA","FAT","NAN","JAC","HOU","OKA","AUS","PVD","LIN","BUD","CUN","RIC","SAT"]);
const COUNTRY_NAMES = {};

// ---------- state ----------
const KEY="contrail.flights.v1", RKEY="contrail.removed.v1", PKEY="contrail.photos.v1", UKEY="contrail.unit";
// photos: which photo belongs to which flight, {id, k: flight key, added}. The images are in photos.js.
let flights=[], removed=[], photos=[], unit="mi", candidates=[];
// Every flight records when it was added and every deletion when it happened,
// so logs edited on different devices merge cleanly (see sync.js).
function load(){
  try{const s=localStorage.getItem(KEY); if(s){flights=JSON.parse(s)||[];}}catch(e){}
  try{const r=localStorage.getItem(RKEY); if(r){removed=JSON.parse(r)||[];}}catch(e){}
  try{const p=localStorage.getItem(PKEY); if(p){photos=JSON.parse(p)||[];}}catch(e){}
  try{const u=localStorage.getItem(UKEY); if(u==="km"||u==="mi")unit=u;}catch(e){}
  flights.forEach(f=>{if(!f.id)f.id=uid();if(typeof f.added!=="number")f.added=0;});
  if(!flights.length) flights=EXAMPLES.map(f=>Object.assign({},f,{id:uid(),example:true}));
  if(dedupeTrips())saveLocal();
}
// ---------- one trip per route per day ----------
// Codeshares (one plane sold as e.g. NH 116 and UA 32) and repeat emails produce the same trip under
// different flight numbers. Flights with the same route on the same day are merged into one. The copy
// kept is the most detailed (aircraft, photos, your edits); its aircraft and photos are carried over.
const tripKey=f=>f.from+"|"+f.to+"|"+f.date;
function richness(f){const k=keyOf(f);return (f.ac?4:0)+(photos.some(p=>p.k===k)?2:0)+(f.edited?1:0)+(f.airline&&f.num?1:0);}
function dedupeTrips(){
  const groups=new Map();
  flights.filter(f=>!f.example).forEach(f=>{const g=groups.get(tripKey(f));g?g.push(f):groups.set(tripKey(f),[f]);});
  let merged=0;const now=Date.now();
  groups.forEach(g=>{
    if(g.length<2)return;
    // deterministic choice so every device keeps the same copy
    g.sort((a,b)=>richness(b)-richness(a)||keyOf(a).localeCompare(keyOf(b)));
    const keep=g[0],kk=keyOf(keep);
    g.slice(1).forEach(d=>{
      const dk=keyOf(d);
      if(!keep.ac&&d.ac){keep.ac=d.ac;keep.edited=Math.max(keep.edited||0,now);}
      photos.forEach(p=>{if(p.k===dk)p.k=kk;});
      removed=removed.filter(r=>r.k!==dk);removed.push({k:dk,at:now});
      flights=flights.filter(f=>f!==d);merged++;
    });
  });
  return merged;
}
function saveLocal(){
  try{localStorage.setItem(KEY,JSON.stringify(flights.filter(f=>!f.example).length?flights:[]));}catch(e){}
  try{localStorage.setItem(RKEY,JSON.stringify(removed));}catch(e){}
  try{localStorage.setItem(PKEY,JSON.stringify(photos));}catch(e){}
}
function save(){saveLocal();if(window.ContrailSync)window.ContrailSync.changed();}
function uid(){return Math.random().toString(36).slice(2,10)}

const EXAMPLES=[
 {airline:"UA",num:"1527",from:"SFO",to:"JFK",date:"2024-03-08"},
 {airline:"B6",num:"915",from:"JFK",to:"SFO",date:"2024-03-12"},
 {airline:"DL",num:"2410",from:"SFO",to:"SEA",date:"2024-09-20"},
 {airline:"DL",num:"2415",from:"SEA",to:"SFO",date:"2024-09-23"},
 {airline:"UA",num:"901",from:"SFO",to:"LHR",date:"2025-05-02"},
 {airline:"BA",num:"548",from:"LHR",to:"FCO",date:"2025-05-06"},
 {airline:"AZ",num:"608",from:"FCO",to:"JFK",date:"2025-05-14"},
 {airline:"AA",num:"177",from:"JFK",to:"SFO",date:"2025-05-14"},
 {airline:"NH",num:"7",from:"SFO",to:"NRT",date:"2026-04-11"},
 {airline:"NH",num:"8",from:"NRT",to:"SFO",date:"2026-04-22"},
 {airline:"AS",num:"1980",from:"SFO",to:"SEA",date:"2026-08-15"},
 {airline:"AS",num:"1981",from:"SEA",to:"SFO",date:"2026-08-18"}
];

// ---------- geometry ----------
const R=6371;
function rad(d){return d*Math.PI/180}
function distKm(a,b){const A=AP[a],B=AP[b]; if(!A||!B)return 0;
  const dLat=rad(B.lat-A.lat),dLon=rad(B.lon-A.lon);
  const h=Math.sin(dLat/2)**2+Math.cos(rad(A.lat))*Math.cos(rad(B.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));}
function fmtDist(km,dec){const v=unit==="mi"?km*0.621371:km; return v.toLocaleString(undefined,{maximumFractionDigits:dec||0});}

// ---------- email parsing ----------
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const MRX="(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?";
function pad(n){return String(n).padStart(2,"0")}
function allDates(s,defYear,off){
  off=off||0;const out=[];
  const pats=[
    [new RegExp("\\b"+MRX+"\\s+(\\d{1,2})(?:st|nd|rd|th)?,?(?:\\s+(20\\d\\d))?","gi"),m=>[m[3]||defYear,MON[m[1].slice(0,3).toLowerCase()],+m[2]]],
    [new RegExp("\\b(\\d{1,2})\\s+"+MRX+",?(?:\\s+(20\\d\\d))?","gi"),m=>[m[3]||defYear,MON[m[2].slice(0,3).toLowerCase()],+m[1]]],
    [/\b(20\d\d)-(\d{2})-(\d{2})\b/g,m=>[m[1],+m[2],+m[3]]],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{2}|20\d\d)\b/g,m=>[m[3].length===2?"20"+m[3]:m[3],+m[1],+m[2]]]
  ];
  for(const [rx,fn] of pats){rx.lastIndex=0;let m;
    while((m=rx.exec(s))){const [y,mo,d]=fn(m); if(mo>=1&&mo<=12&&d>=1&&d<=31&&y)out.push({i:m.index+off,e:m.index+off+m[0].length,v:y+"-"+pad(mo)+"-"+pad(d)});}}
  return out.sort((a,b)=>a.i-b.i);
}
function findDate(s,defYear){const d=allDates(s,defYear);return d.length?d[0].v:null;}
function findCodes(s){
  const out=[];const rx=/\b[A-Z]{3}\b/g;let m;
  while((m=rx.exec(s))){const c=m[0]; if(!AP[c]||NOT_CODES.has(c))continue;
    if(AMBIG.has(c)||!CURATED.has(c)){const before=s.slice(Math.max(0,m.index-3),m.index),after=s.slice(m.index+3,m.index+7);
      const strong=/[(\-–—→>✈]\s*$/.test(before)||/^\s*[)\-–—→>✈]/.test(after)||/^\s*to\s/i.test(after);
      if(!strong)continue;}
    if(!out.length||out[out.length-1]!==c)out.push(c);}
  return out;
}
// Finds airports written as names, in order. A city with several airports is resolved by a more specific
// name right next to it ("Tokyo (Haneda)") or else by the biggest airport. Only capitalized words count.
function findPlaces(s){
  const toks=[];const rx=/[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'.-]*/g;let m;
  while((m=rx.exec(s)))toks.push({w:m[0],i:m.index,e:m.index+m[0].length});
  const norm=w=>w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
  const hits=[];
  for(let t=0;t<toks.length;t++){
    if(!/^[A-ZÀ-Þ]/.test(toks[t].w))continue;
    for(let n=4;n>=1;n--){
      if(t+n>toks.length)continue;
      const words=toks.slice(t,t+n);
      if(n>1&&s.slice(words[0].i,words[n-1].e).includes("\n"))continue;
      const key=words.map(x=>norm(x.w)).join(" ");
      if(n===1&&NOT_PLACES.has(key))continue;
      const c=AP_NAMES[key];
      if(c){hits.push({i:words[0].i,e:words[n-1].e,c,key});t+=n-1;break;}
    }
  }
  // merge "City (Specific)" pairs into the specific airport
  const spans=[];
  for(let k=0;k<hits.length;k++){
    const h=hits[k],nx=hits[k+1];
    let cands=h.c,e=h.e;
    if(nx&&nx.i-h.e<=3){
      const both=h.c.filter(x=>nx.c.some(y=>y.code===x.code));
      if(both.length){cands=both;e=nx.e;k++;}
    }
    // well-known airport first; then the biggest; then the one actually in that city
    const best=cands.slice().sort((a,b)=>(CURATED.has(b.code)-CURATED.has(a.code))||b.size-a.size||(b.kind==="city")-(a.kind==="city"))[0];
    spans.push({i:h.i,e,code:best.code});
  }
  // A name only counts when it's written like part of a route: followed by a time ("Kagoshima 10:00"),
  // in brackets, under a From/To/Depart/Arrive label, or joined to another place by an arrow, dash or "to".
  const LINK=/^\s*\)?\s*(?:→|->|–|—|-|>|✈|to|until|bis|à|a)\s*\(?\s*$/i;
  const ok=spans.map((sp,k)=>{
    const after=s.slice(sp.e,sp.e+18),before=s.slice(Math.max(0,sp.i-40),sp.i);
    if(/^\s*\)?\s*[-–,·|]?\s*\d{1,2}[:.h]\d{2}/.test(after))return true;
    if(/\(\s*$/.test(before)&&/^\s*\)/.test(after))return true;
    if(/(?:^|\n|\b)(?:from|to|depart(?:s|ing|ure)?|arriv(?:e|es|ing|al)|origin|destination|leaving|landing)\b\s*[:\-]?\s*\n?\s*$/i.test(before))return true;
    const prev=spans[k-1],next=spans[k+1];
    if(next&&LINK.test(s.slice(sp.e,next.i)))return true;
    if(prev&&LINK.test(s.slice(prev.e,sp.i)))return true;
    return false;
  });
  const out=[];
  spans.forEach((sp,k)=>{if(ok[k]&&(!out.length||out[out.length-1]!==sp.code))out.push(sp.code);});
  return out;
}
function cleanEmail(t){
  if(/=\r?\n|=[0-9A-F]{2}/.test(t)&&/Content-Transfer-Encoding:\s*quoted-printable/i.test(t)){
    t=t.replace(/=\r?\n/g,"").replace(/=([0-9A-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16)));}
  if(/<(html|body|table|div|td)[\s>]/i.test(t)){
    t=t.replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<br\s*\/?>|<\/(p|div|tr|td|li|h\d)>/gi,"\n").replace(/<[^>]+>/g," ")
      .replace(/&nbsp;/g," ").replace(/&rarr;/g,"→").replace(/&amp;/g,"&").replace(/&#8594;/g,"→");}
  return t;
}
// ---------- aircraft ----------
// Recognizes the aircraft named in booking emails ("Boeing 737 MAX 8", "Airbus A220-300", "E175",
// "B38M") and turns it into one consistent name. Plain numbers like "737" only count after "Boeing".
const AC_CODES={B712:"Boeing 717",B732:"Boeing 737-200",B733:"Boeing 737-300",B734:"Boeing 737-400",B735:"Boeing 737-500",B736:"Boeing 737-600",B737:"Boeing 737-700",B738:"Boeing 737-800",B739:"Boeing 737-900",
  B37M:"Boeing 737 MAX 7",B38M:"Boeing 737 MAX 8",B39M:"Boeing 737 MAX 9",B3XM:"Boeing 737 MAX 10",B752:"Boeing 757-200",B753:"Boeing 757-300",B762:"Boeing 767-200",B763:"Boeing 767-300",B764:"Boeing 767-400",
  B772:"Boeing 777-200",B77L:"Boeing 777-200LR",B773:"Boeing 777-300",B77W:"Boeing 777-300ER",B788:"Boeing 787-8",B789:"Boeing 787-9",B78X:"Boeing 787-10",B744:"Boeing 747-400",B748:"Boeing 747-8",
  A318:"Airbus A318",A319:"Airbus A319",A320:"Airbus A320",A321:"Airbus A321",A19N:"Airbus A319neo",A20N:"Airbus A320neo",A21N:"Airbus A321neo",BCS1:"Airbus A220-100",BCS3:"Airbus A220-300",
  A332:"Airbus A330-200",A333:"Airbus A330-300",A338:"Airbus A330-800neo",A339:"Airbus A330-900neo",A359:"Airbus A350-900",A35K:"Airbus A350-1000",A388:"Airbus A380",
  E170:"Embraer 170",E75L:"Embraer 175",E75S:"Embraer 175",E190:"Embraer 190",E195:"Embraer 195",E290:"Embraer 190-E2",E295:"Embraer 195-E2",
  CRJ2:"Bombardier CRJ200",CRJ7:"Bombardier CRJ700",CRJ9:"Bombardier CRJ900",CRJX:"Bombardier CRJ1000",DH8D:"De Havilland Dash 8-400",DH8C:"De Havilland Dash 8-300",AT72:"ATR 72",AT76:"ATR 72-600",AT75:"ATR 72-500",AT45:"ATR 42"};
const AC_PATTERNS=[
  [/\bBoeing\s*7([0-9])7\s*(?:-|\s)?\s*MAX\s*-?\s*(7|8|9|10)\b/i,m=>`Boeing 7${m[1]}7 MAX ${m[2]}`],
  [/\b7([0-9])7\s*MAX\s*-?\s*(7|8|9|10)\b/i,m=>`Boeing 7${m[1]}7 MAX ${m[2]}`],
  [/\b(?:Boeing\s*|B)?7([0-9])7\s*-\s*(\d00|10|[789])\s*(ER|LR|F)?\b/i,m=>boeingVariant(m[1],m[2],m[3])],
  [/\bBoeing\s*7([0-9])7\s*(\d{3})\s*(ER|LR)?\b/i,m=>`Boeing 7${m[1]}7-${m[2]}${(m[3]||"").toUpperCase()}`],
  [/\bBoeing\s*7([0-9])7\b/i,m=>`Boeing 7${m[1]}7`],
  [/\b(?:Airbus\s*)?A\s?220\s*-?\s*(100|300)\b/i,m=>`Airbus A220-${m[1]}`],
  [/\b(?:Airbus\s*)?A\s?3([1-8])(\d)\s*-?\s*(neo|NEO|XLR|LR)\b/,m=>`Airbus A3${m[1]}${m[2]}${m[3].toLowerCase()==="neo"?"neo":m[3].toUpperCase()}`],
  [/\b(?:Airbus\s*)?A\s?3([3-5])0\s*-\s*(\d{3,4})\b/i,m=>`Airbus A3${m[1]}0-${m[2]}`],
  [/\bAirbus\s*A?\s?3([1-8])(\d)\b/i,m=>`Airbus A3${m[1]}${m[2]}`],
  [/\bA3(18|19|20|21|30|40|50|80)\b/,m=>`Airbus A3${m[1]}`],
  [/\b(?:Embraer\s*(?:ERJ|E)?|E-?Jet\s*|ERJ\s*-?|E)\s*-?\s*(170|175|190|195)\s*(?:-?\s*(E2))?\b/i,m=>`Embraer ${m[1]}${m[2]?"-E2":""}`],
  [/\b(?:Bombardier\s*|Mitsubishi\s*)?CRJ\s*-?\s*(200|550|700|900|1000)\b/i,m=>`Bombardier CRJ${m[1]}`],
  [/\b(?:De\s*Havilland\s*|Bombardier\s*)?(?:Dash|DHC)\s*-?\s*8\s*(?:-|\s)?\s*Q?(100|200|300|400)\b/i,m=>`De Havilland Dash 8-${m[1]}`],
  [/\bQ400\b/,()=>"De Havilland Dash 8-400"],
  [/\bATR\s*-?\s*(42|72)(?:\s*-?\s*(500|600))?\b/i,m=>`ATR ${m[1]}${m[2]?"-"+m[2]:""}`],
  [/\b(B7[1-8][0-9MWLX]|B3[789X]M|A3[1-8][0-9NK]|A[12][90]N|A21N|A35K|BCS[13]|E1[79]0|E19[05]|E75[LS]|E29[05]|CRJ[279X]|DH8[A-D]|AT[47][2-6])\b/,m=>AC_CODES[m[1]]||null]
];
// Boeing names: 787-8/-9/-10 keep one digit; "737-8" is Boeing's name for the 737 MAX 8.
function boeingVariant(series,v,suffix){
  suffix=(suffix||"").toUpperCase();
  if(series==="8")return `Boeing 787-${v.length===3?v[0]:v}`;
  if(series==="3"&&v.length<3)return `Boeing 737 MAX ${v}`;
  return `Boeing 7${series}7-${v.length<3?v+"00":v}${suffix}`;
}
function findAircraft(s){
  if(!s)return "";
  let best=null;
  for(const [rx,fn] of AC_PATTERNS){const m=rx.exec(s);if(m){const name=fn(m);if(name&&(!best||m.index<best.i))best={i:m.index,name};}}
  return best?best.name:"";
}
const AC_LIST=[...new Set(Object.values(AC_CODES))].sort();

// refDate (optional): when the email arrived. Dates written without a year ("Fri, Nov 14") are
// then placed on or after ~2 months before that day, which is how booking emails read.
// opts.requireNumber: only flights with a flight number (inbox imports, where sale emails like
// "Columbus → Philadelphia from $79" would otherwise look like trips).
function parseEmails(raw,refDate,opts){
  const text=cleanEmail(raw);
  const yrM=text.match(/\b(20[2-3]\d)\b/); const defYear=refDate?"1900":yrM?yrM[1]:String(new Date().getFullYear());
  const codes=[...TRUSTED_AL].sort((a,b)=>b.length-a.length);
  const fx=new RegExp("\\b("+codes.join("|")+")\\s?(\\d{1,4})\\b","g");
  const nx=new RegExp("\\b("+Object.keys(AL_NAMES).join("|")+")(?:\\s+Air(?:lines|ways)?)?\\s+(?:Flight|flight|FLIGHT)\\s*(?:#|No\\.?)?\\s*(\\d{1,4})\\b","g");
  const hits=[];let m;
  while((m=fx.exec(text))){
    const pre=text.slice(Math.max(0,m.index-6),m.index);
    if(m[1]==="AM"&&/\d[:.]\d{2}\s*$/.test(pre))continue;            // "10:05 AM 12" is a time, not a flight
    hits.push({i:m.index,end:m.index+m[0].length,airline:m[1],num:m[2]});}
  // "JAL643", "ANA 7", "KAL76": 3-letter airline codes; and less common 2-letter codes written together ("MM502")
  const ix=new RegExp("\\b("+Object.keys(ICAO_AL).filter(c=>!NOT_CODES.has(c)).join("|")+")\\s?(\\d{1,4})\\b","g");
  while((m=ix.exec(text))){const ai=ICAO_AL[m[1]];if(!hits.some(h=>h.i===m.index))hits.push({i:m.index,end:m.index+m[0].length,airline:ai,num:m[2]});}
  const extra=Object.keys(AL).filter(c=>!TRUSTED_AL.has(c)&&/^[A-Z0-9]{2}$/.test(c)&&/[A-Z]/.test(c));
  const ex=new RegExp("\\b("+extra.join("|")+")(\\d{2,4})\\b","g");
  while((m=ex.exec(text))){
    if(hits.some(h=>m.index>=h.i&&m.index<h.end))continue;
    if(findAircraft(text.slice(Math.max(0,m.index-8),m.index+10)))continue; // "A320", "B737" are aircraft, not flights
    hits.push({i:m.index,end:m.index+m[0].length,airline:m[1],num:m[2]});}
  while((m=nx.exec(text))){const ai=AL_NAMES[m[1]]; if(!hits.some(h=>h.airline===ai&&h.num===m[2]))hits.push({i:m.index,end:m.index+m[0].length,airline:ai,num:m[2]});}
  hits.sort((a,b)=>a.i-b.i);
  // collapse repeats of the same flight number mentioned many times
  const found=[];
  hits.forEach((h,k)=>{
    const prevEnd=k?hits[k-1].end:Math.max(0,h.i-300);
    const nextStart=k<hits.length-1?hits[k+1].i:Math.min(text.length,h.end+500);
    const ls=text.lastIndexOf("\n",h.i)+1;let le=text.indexOf("\n",h.end);if(le<0)le=text.length;
    const line=text.slice(ls,le);
    const fwd=text.slice(h.end,Math.min(nextStart,h.end+500));
    const back=text.slice(Math.max(prevEnd,h.i-300),h.i);
    let cs=findCodes(line);
    if(cs.length<2)cs=findCodes(fwd);
    if(cs.length<2)cs=findCodes(back);
    if(cs.length<2)cs=findCodes(back+" "+fwd);
    if(cs.length<2){const ps=findPlaces(line+"\n"+fwd);if(ps.length>=2)cs=ps;}
    if(cs.length<2)return;
    const from=cs[0],to=cs.find(c=>c!==from); if(!to)return;
    // date: same line first, otherwise the nearest date within this leg's stretch of text
    let date=(allDates(line,defYear)[0]||{}).v;
    if(!date){const ws=Math.max(prevEnd,h.i-300),we=Math.min(nextStart,h.end+500);
      const ds=allDates(text.slice(ws,we),defYear,ws);
      let best=null,bd=1e9;ds.forEach(d=>{const dist=d.e<=h.i?h.i-d.e:d.i-h.end;if(dist<bd){bd=dist;best=d;}});
      date=best?best.v:findDate(text,defYear);}
    if(!date)return;
    // aircraft: on this leg's line, then in this leg's stretch of text (stopping at the next flight)
    const ac=findAircraft(line)||findAircraft(fwd)||findAircraft(back.slice(-200));
    found.push({airline:h.airline,num:h.num,from,to,date,ac});
  });
  // route-only fallback: "SFO → JFK" with no flight numbers (pasted emails only; you review them)
  if(!found.length&&!(opts&&opts.requireNumber)){
    const rx=/\b([A-Z]{3})\s*(?:→|->|–|—|-|✈|to)\s*([A-Z]{3})\b/g;
    while((m=rx.exec(text))){if(AP[m[1]]&&AP[m[2]]&&m[1]!==m[2]){
      const date=findDate(text.slice(Math.max(0,m.index-200),m.index+300),defYear)||findDate(text,defYear);
      if(date)found.push({airline:"",num:"",from:m[1],to:m[2],date});}}
  }
  // de-duplicate within this paste
  const seen=new Set();
  if(refDate)found.forEach(f=>{
    if(!f.date.startsWith("1900-"))return;
    const md=f.date.slice(5),floor=new Date(refDate.getTime()-60*864e5);let y=refDate.getFullYear();
    if(new Date(y+"-"+md+"T12:00:00")<floor)y++;
    f.date=y+"-"+md;});
  return found.filter(f=>{const k=keyOf(f);if(seen.has(k))return false;seen.add(k);return true;});
}
function keyOf(f){return (f.airline&&f.num?f.airline+f.num:f.from+f.to)+"|"+f.date}
window.__parse=parseEmails;

// ---------- rendering ----------
const $=id=>document.getElementById(id);
function real(){return flights.filter(f=>!f.example)}
function render(){
  const list=flights.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const isEx=flights.length>0&&flights.every(f=>f.example);
  $("exNote").hidden=!isEx;
  const n=list.length;
  $("tTotal").textContent=n;
  $("tCap").firstChild.nodeValue=n===1?"flight logged":"flights logged";
  if(n){const first=list[list.length-1].date;$("tSince").textContent="since "+fmtDate(first);}else $("tSince").textContent="";
  let km=0;const aps=new Set(),als=new Set(),ccs=new Set();
  list.forEach(f=>{km+=distKm(f.from,f.to);aps.add(f.from);aps.add(f.to);if(f.airline)als.add(f.airline);ccs.add(AP[f.from].cc);ccs.add(AP[f.to].cc);});
  $("sDist").innerHTML=fmtDist(km)+"<em>"+unit+"</em>";
  $("sLaps").innerHTML=(km/40075).toFixed(2)+"<em>×</em>";
  $("sHours").textContent=Math.round(km/800+0.5*n).toLocaleString();
  $("sAirports").textContent=aps.size;$("sAirlines").textContent=als.size;$("sCountries").textContent=ccs.size;
  document.querySelectorAll(".unit button").forEach(b=>b.setAttribute("aria-pressed",String(b.id==="u-"+unit)));
  renderRecords(list,km);renderLog(list);drawMap(list);
}
function fmtDate(iso){const [y,m,d]=iso.split("-");return new Date(+y,+m-1,+d).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}

function renderRecords(list,km){
  const R=$("records"),Y=$("years");
  if(!list.length){R.innerHTML='<div class="rec"><span class="sub">Records appear once you log a flight.</span></div>';Y.innerHTML="";return;}
  const byD=list.map(f=>({f,d:distKm(f.from,f.to)})).sort((a,b)=>b.d-a.d);
  const L=byD[0],S=byD[byD.length-1];
  const routes={},ports={},lines={};
  list.forEach(f=>{const k=[f.from,f.to].sort().join(" ⇄ ");routes[k]=(routes[k]||0)+1;ports[f.from]=(ports[f.from]||0)+1;ports[f.to]=(ports[f.to]||0)+1;if(f.airline)lines[f.airline]=(lines[f.airline]||0)+1;});
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1])[0];
  const tr=top(routes),tp=top(ports),tl=top(lines);
  // Each record opens the Flight log filtered to it (filter = what to show); without one it's plain text.
  const cell=(lab,big,sub,filter)=>filter
    ?`<a class="rec recbtn" href="#log" data-filter='${esc(JSON.stringify(filter)).replace(/'/g,"&#39;")}' aria-label="${lab}: show these flights in the flight log"><span class="label">${lab}</span><span class="big">${big}</span><span class="sub">${sub} <span class="go">›</span></span></a>`
    :`<div class="rec"><span class="label">${lab}</span><span class="big">${big}</span><span class="sub">${sub}</span></div>`;
  const ac={};list.forEach(f=>{if(f.ac)ac[f.ac]=(ac[f.ac]||0)+1;});const ta=top(ac),nAc=Object.keys(ac).length;
  const [r1,r2]=tr[0].split(" ⇄ ");
  R.innerHTML=
    cell("Longest flight",`${L.f.from} → ${L.f.to}`,`${fmtDist(L.d)} ${unit} · ${fmtDate(L.f.date)}`,{route:[L.f.from,L.f.to],from:L.f.date,to:L.f.date,oneway:true})+
    cell("Shortest flight",`${S.f.from} → ${S.f.to}`,`${fmtDist(S.d)} ${unit} · ${fmtDate(S.f.date)}`,{route:[S.f.from,S.f.to],from:S.f.date,to:S.f.date,oneway:true})+
    cell("Most-flown route",tr[0],`${tr[1]} ${tr[1]===1?"time":"times"}`,{route:[r1,r2]})+
    cell("Home base",tp[0],`${esc(AP[tp[0]].city)} · ${tp[1]} visits`,{ap:tp[0]})+
    cell("Top airline",tl?esc(AL[tl[0]]||tl[0]):"—",tl?`${tl[1]} ${tl[1]===1?"flight":"flights"}`:"No flight numbers yet",tl?{al:tl[0]}:null)+
    `<a class="rec recbtn" href="#space" aria-label="To the Moon: see your distance in the solar system"><span class="label">To the Moon</span><span class="big">${km>=384400?(km/384400).toFixed(2)+"×":((km/384400)*100).toFixed(1)+"%"}</span></a>`+
    cell("Top aircraft",ta?esc(ta[0]):"—",ta?`${ta[1]} ${ta[1]===1?"flight":"flights"}`:"Add aircraft in the flight log",ta?{ac:ta[0]}:null)+
    cell("Aircraft types",String(nAc),nAc?`on ${Object.values(ac).reduce((a,b)=>a+b,0)} of ${list.length} flights`:"None recorded yet",nAc?{ac:"*"}:null);
  const yrs={};list.forEach(f=>{const y=f.date.slice(0,4);yrs[y]=(yrs[y]||0)+1;});
  const ys=Object.keys(yrs).sort().reverse(),mx=Math.max(...Object.values(yrs));
  Y.innerHTML='<span class="label">Flights per year</span>'+ys.map(y=>`<a class="yr" href="#log" data-year="${y}" aria-label="${yrs[y]} flights in ${y}: show them in the flight log"><span>${y}</span><span class="bar"><i style="width:${(yrs[y]/mx*100).toFixed(1)}%"></i></span><b>${yrs[y]}</b></a>`).join("");
}
// Flight log: tabs for All time, YTD and each year, 10 flights per page (newest first).
const PAGE=10,TKEY="contrail.logTab";
let logTab="all",logPage=0,logList=[],logOld=false;
try{logTab=localStorage.getItem(TKEY)||"all";logOld=localStorage.getItem("contrail.logSort")==="old";}catch(e){}
// sort button: newest first (default) or oldest first, remembered on this device
function showSort(){const b=$("lsort");b.textContent=logOld?"Oldest first":"Newest first";b.setAttribute("aria-label","Sort: "+b.textContent+". Tap to switch.");$("pgPrev").textContent=logOld?"‹ Older":"‹ Newer";$("pgNext").textContent=logOld?"Newer ›":"Older ›";}
function logPeriods(list){
  const today=new Date().toISOString().slice(0,10),thisYear=today.slice(0,4);
  const years=[...new Set(list.map(f=>f.date.slice(0,4)))].sort().reverse();
  const tabs=[{id:"all",label:"All time",test:()=>true},
    {id:"ytd",label:"YTD",test:f=>f.date.slice(0,4)===thisYear&&f.date<=today}];
  years.forEach(y=>tabs.push({id:y,label:y,test:f=>f.date.slice(0,4)===y}));
  return tabs;
}
// ---------- flight log search and filters ----------
// Search matches every word typed against the airports, their cities, the airline (code and name),
// the flight number and the aircraft. Filters narrow by date range, airport, airline and aircraft.
// route: a pair of airports opened from Records (both directions unless oneway); not shown in the panel.
const lf={q:"",from:"",to:"",ap:"",al:"",ac:"",route:null,oneway:false,dirOut:"",dirIn:""};
let logFocus=null; // a flight to jump to and highlight, set when opened from the route chart
function lfActive(){return !!(lf.q||lf.from||lf.to||lf.ap||lf.al||lf.ac||lf.route||lf.dirOut||lf.dirIn);}
function lfCount(){return ["from","to","ap","al","ac","route","dirOut","dirIn"].filter(k=>lf[k]).length;}
function haystack(f){
  return [f.from,f.to,AP[f.from]&&AP[f.from].city,AP[f.to]&&AP[f.to].city,f.airline,AL[f.airline],
    f.airline&&f.num?f.airline+f.num:"",f.airline&&f.num?f.airline+" "+f.num:"",f.num,f.ac,f.date].filter(Boolean).join(" ").toLowerCase();
}
function lfMatch(f){
  if(lf.from&&f.date<lf.from)return false;
  if(lf.to&&f.date>lf.to)return false;
  if(lf.ap&&f.from!==lf.ap&&f.to!==lf.ap)return false;
  if(lf.dirOut&&f.from!==lf.dirOut)return false;
  if(lf.dirIn&&f.to!==lf.dirIn)return false;
  if(lf.al==="-"?(f.airline&&f.num):(lf.al&&f.airline!==lf.al))return false;
  if(lf.ac==="*"?!f.ac:(lf.ac&&(f.ac||"")!==lf.ac))return false;
  if(lf.route){const [a,b]=lf.route;if(!((f.from===a&&f.to===b)||(!lf.oneway&&f.from===b&&f.to===a)))return false;}
  if(lf.q){const h=haystack(f);if(!lf.q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>h.includes(w)))return false;}
  return true;
}
// Fills the pick-lists with what's actually in the log, keeping the current choice.
function fillFilterLists(list){
  const fill=(id,items,all)=>{const el=$(id),cur=lf[id==="lfAp"?"ap":id==="lfAl"?"al":"ac"];
    el.innerHTML=`<option value="">${all}</option>`+items.map(([v,t])=>`<option value="${esc(v)}"${v===cur?" selected":""}>${esc(t)}</option>`).join("");};
  const aps=[...new Set(list.flatMap(f=>[f.from,f.to]))].map(c=>[c,`${AP[c].city} (${c})`]).sort((a,b)=>a[1].localeCompare(b[1]));
  const als=[...new Set(list.map(f=>f.airline).filter(Boolean))].map(c=>[c,`${AL[c]||c} (${c})`]).sort((a,b)=>a[1].localeCompare(b[1]));
  const acs=[...new Set(list.map(f=>f.ac).filter(Boolean))].sort().map(a=>[a,a]);
  fill("lfAp",aps,"Any airport");fill("lfAl",(list.some(f=>!(f.airline&&f.num))?[["-","No flight number"]]:[]).concat(als),"Any airline");fill("lfAc",[["*","Any recorded aircraft"]].concat(acs),"Any aircraft");
  // a route opened from Records shows as a removable chip
  // a route or direction opened from Records or the route chart shows as a removable chip
  const chip=lf.route?"Route: "+lf.route[0]+(lf.oneway?" → ":" ⇄ ")+lf.route[1]:lf.dirOut?"Departing "+lf.dirOut:lf.dirIn?"Arriving at "+lf.dirIn:"";
  $("lfRoute").hidden=!chip;$("lfRouteText").textContent=chip;
  const n=lfCount();$("lfCount").textContent=n?String(n):"";$("lfCount").hidden=!n;$("lfClear").hidden=!lfActive();
}
function renderLog(list){
  logList=list;
  const L=$("log"),T=$("logTabs"),S=$("logSum"),P=$("logPager");
  fillFilterLists(list);
  if(!list.length){T.innerHTML="";S.textContent="";P.hidden=true;
    L.innerHTML='<div class="empty">No flights yet. Paste a confirmation email above to start your log.</div>';return;}
  const all=list;list=list.filter(lfMatch);
  const tabs=logPeriods(all);
  if(!tabs.some(t=>t.id===logTab))logTab="all";
  const tab=tabs.find(t=>t.id===logTab);
  T.innerHTML=tabs.map(t=>{const n=list.filter(t.test).length;
    return `<button type="button" role="tab" class="ltab" data-tab="${t.id}" aria-selected="${t.id===logTab}">${t.label}<span>${n}</span></button>`;}).join("");
  const shown=list.filter(tab.test);if(logOld)shown.reverse();
  const focusId=logFocus;logFocus=null;
  if(focusId){const i=shown.findIndex(f=>f.id===focusId);if(i>=0)logPage=Math.floor(i/PAGE);}
  const km=shown.reduce((s,f)=>s+distKm(f.from,f.to),0);
  const label=tab.id==="all"?"All time":tab.id==="ytd"?"This year so far":tab.label;
  const of=lfActive()?` of ${all.filter(tab.test).length}`:"";
  S.textContent=`${label}: ${lfActive()?"showing ":""}${shown.length}${of} ${(of?all.filter(tab.test).length:shown.length)===1?"flight":"flights"} · ${fmtDist(km)} ${unit}`+(shown.length?` · ${new Set(shown.flatMap(f=>[f.from,f.to])).size} airports`:"");
  const pages=Math.max(1,Math.ceil(shown.length/PAGE));
  logPage=Math.min(logPage,pages-1);
  const page=shown.slice(logPage*PAGE,logPage*PAGE+PAGE);
  P.hidden=shown.length<=PAGE;
  $("pgInfo").textContent=shown.length?`${logPage*PAGE+1}–${logPage*PAGE+page.length} of ${shown.length}`:"";
  $("pgPrev").disabled=logPage===0;$("pgNext").disabled=logPage>=pages-1;
  if(!shown.length){L.innerHTML=lfActive()?'<div class="empty">No flights match your search. <button type="button" class="btn quiet" id="lfClear2">Clear search and filters</button></div>':'<div class="empty">No flights in this period.</div>';return;}
  const PH=window.ContrailPhotos;
  L.innerHTML=page.map(f=>{
    const a=AP[f.from],b=AP[f.to],k=keyOf(f),ids=photosFor(k),open=PH&&!f.example&&openPh===k;
    const fl=f.airline?`${esc(AL[f.airline]||f.airline)} ${f.airline} ${f.num}`:"Flight";
    const label=`${f.from} to ${f.to} on ${f.date}`;
    const phb=f.example||!PH?'<span></span>':`<button type="button" class="phb${ids.length?" has":""}" data-k="${esc(k)}" aria-expanded="${open}" aria-label="${ids.length?ids.length+(ids.length===1?" photo":" photos"):"Add photos"} for ${label}">`+
      (ids.length?`<img alt="" data-thumb="${ids[0]}"><span class="phn">${ids.length}</span>`:CAMERA)+`</button>`;
    return `<div class="leg${open?" open":""}${f.id===focusId?" flash":""}" data-fid="${f.id}"><span class="d">${f.date}</span><span class="r"><b>${f.from} → ${f.to}${f.example?'<span class="tag">Example</span>':""}</b><span>${fl} · ${esc(a.city)} to ${esc(b.city)}</span>${editAc===f.id?`<form class="acform" data-id="${f.id}"><input class="acin" list="acList" maxlength="40" value="${esc(f.ac||"")}" placeholder="e.g. Boeing 737-800" aria-label="Aircraft for ${label}" autocomplete="off"><button class="btn" type="submit">Save</button><button class="btn quiet acx" type="button">Cancel</button></form>`:f.example?(f.ac?`<span class="acv">${esc(f.ac)}</span>`:""):`<button type="button" class="acb${f.ac?"":" add"}" data-id="${f.id}" aria-label="${f.ac?"Change aircraft, "+esc(f.ac):"Add aircraft"} for ${label}">${f.ac?esc(f.ac):"+ Aircraft"}</button>`}</span><span class="km">${fmtDist(distKm(f.from,f.to))} ${unit}</span>${phb}<button class="x" data-id="${f.id}" aria-label="Remove ${label}">×</button></div>`+
      (open?PH.drawer(esc(k),ids,label):"");}).join("");
  if(PH)PH.hydrate(L);
}
const CAMERA='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.4"/></svg>';
let openPh=null,editAc=null;
function photosFor(k){return photos.filter(p=>p.k===k).sort((a,b)=>a.added-b.added).map(p=>p.id);}

// ---------- route chart ----------
function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function gc(a,b,n){const A=AP[a],B=AP[b];
  const v=p=>[Math.cos(rad(p.lat))*Math.cos(rad(p.lon)),Math.cos(rad(p.lat))*Math.sin(rad(p.lon)),Math.sin(rad(p.lat))];
  const p=v(A),q=v(B);const d=Math.acos(Math.max(-1,Math.min(1,p[0]*q[0]+p[1]*q[1]+p[2]*q[2])));
  const pts=[];for(let i=0;i<=n;i++){const t=i/n;let x,y,z;
    if(d<1e-6){[x,y,z]=p}else{const s1=Math.sin((1-t)*d)/Math.sin(d),s2=Math.sin(t*d)/Math.sin(d);x=s1*p[0]+s2*q[0];y=s1*p[1]+s2*q[1];z=s1*p[2]+s2*q[2];}
    pts.push([Math.atan2(y,x)*180/Math.PI,Math.atan2(z,Math.hypot(x,y))*180/Math.PI]);}
  return pts;}
// ---------- route chart: Mercator world map with pan + zoom ----------
const MAXLAT=82,D=180/Math.PI;
function my(lat){lat=Math.max(-MAXLAT,Math.min(MAXLAT,lat));return Math.log(Math.tan(Math.PI/4+rad(lat)/2))*D;}
function imy(v){return Math.atan(Math.sinh(v/D))*D;}
const MYMAX=my(MAXLAT);
const FREQ=[{min:1,label:"1×"},{min:2,label:"2×"},{min:3,label:"3–4×"},{min:5,label:"5–9×"},{min:10,label:"10+×"}];
function bucket(c){let b=0;FREQ.forEach((f,i)=>{if(c>=f.min)b=i;});return b;}
let model={arcs:[],used:[],dir:{},sig:null},view=null,sel=null,mapPts=[],W0=0,raf=0,paintDpr=0; // paintDpr: a sharper one-off render for the export
function dims(){const W=$("map").parentElement.clientWidth||700;return {W,H:Math.round(Math.min(460,Math.max(260,W*0.58)))};}
function sLim(W,H){return [Math.max(W/360,H/(2*MYMAX)),W/360*48];}
function clampView(W,H){
  const [a,b]=sLim(W,H);view.s=Math.max(a,Math.min(b,view.s));
  const half=H/2/view.s;view.cMy=half>=MYMAX?0:Math.max(-MYMAX+half,Math.min(MYMAX-half,view.cMy));
  view.cLon=((view.cLon+180)%360+360)%360-180;
}
// ---------- smooth zoom ----------
// glide(target): eases the view to a new centre and zoom over ~0.45 s. Zoom changes on a log scale so
// zooming in and out feel even; the centre takes the short way round the date line.
let glideRaf=0,glideTarget=null;
const reduceMotion=()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(_){return false;}};
function stopGlide(){if(glideRaf)cancelAnimationFrame(glideRaf);glideRaf=0;glideTarget=null;}
function glide(t,ms){
  const {W,H}=dims();
  if(!view||reduceMotion()){view={...t};clampView(W,H);stopGlide();schedule();return;}
  stopGlide();glideTarget={...t};
  const from={...view},dLon=((t.cLon-from.cLon+540)%360)-180,ls0=Math.log(from.s),ls1=Math.log(t.s),t0=performance.now(),dur=ms||450;
  const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
  const step=now=>{const u=Math.min(1,(now-t0)/dur),e=ease(u);
    view.s=Math.exp(ls0+(ls1-ls0)*e);view.cLon=from.cLon+dLon*e;view.cMy=from.cMy+(t.cMy-from.cMy)*e;
    const d=dims();clampView(d.W,d.H);paint();
    glideRaf=u<1?requestAnimationFrame(step):0;if(u>=1)glideTarget=null;};
  glideRaf=requestAnimationFrame(step);
}
// the view fit() would choose, without jumping there
function fitTarget(code){const old=view;fit(code);const t={...view};view=old;return t;}
function smoothFit(code){if(!view){fit(code);schedule();return;}glide(fitTarget(code));}
// fit(code): with an airport code, frames just that airport and every route to or from it
function fit(code){
  const {W,H}=dims();
  const arcs=code?model.arcs.filter(r=>r.a===code||r.b===code):model.arcs;
  if(code&&!arcs.length)return fit();
  if(!arcs.length){view={s:W/75,cLon:-100,cMy:my(40)};clampView(W,H);return;}
  // centre on the routes; longitudes are unwrapped around the widest stretch with no routes
  const lons=[];arcs.forEach(r=>r.pts.forEach(([x])=>lons.push(((x%360)+360)%360)));lons.sort((a,b)=>a-b);
  let cut=180,gap=-1;for(let i=0;i<lons.length;i++){const a=lons[i],b=i<lons.length-1?lons[i+1]:lons[0]+360;if(b-a>gap){gap=b-a;cut=(a+b)/2;}}
  let l0=1e9,l1=-1e9,m0=1e9,m1=-1e9;
  arcs.forEach(r=>r.pts.forEach(([x,y])=>{let v=((x-cut)%360+360)%360+cut;l0=Math.min(l0,v);l1=Math.max(l1,v);const m=my(y);m0=Math.min(m0,m);m1=Math.max(m1,m);}));
  const [a,b]=sLim(W,H);
  const pad=code?3:10; // a little margin so labels and end dots stay inside
  view={s:Math.max(a,Math.min(b*(code?0.6:0.3),W/((l1-l0)*1.25+pad),H/((m1-m0)*1.4+pad))),cLon:(l0+l1)/2,cMy:(m0+m1)/2};
  clampView(W,H);
}
// Route chart period: All time, YTD, the last 12 months or the last 5 years. The airport picker and details follow it.
const MKEY="contrail.mapPeriod";
let mapPeriod="all",mapAll=[];
try{mapPeriod=localStorage.getItem(MKEY)||"all";}catch(e){}
const MAP_PERIODS=[
  {id:"all",label:"All time",test:()=>true},
  {id:"ytd",label:"YTD",test:(f,t)=>f.date.slice(0,4)===t.slice(0,4)&&f.date<=t},
  {id:"1y",label:"1 year",test:(f,t)=>f.date>daysAgo(365)&&f.date<=t},
  {id:"5y",label:"5 years",test:(f,t)=>f.date>yearsAgoIso(5)&&f.date<=t}
];
function daysAgo(n){return new Date(Date.now()-n*864e5).toISOString().slice(0,10);}
function yearsAgoIso(n){const d=new Date();d.setFullYear(d.getFullYear()-n);return d.toISOString().slice(0,10);}
function mapFilter(list){
  const today=new Date().toISOString().slice(0,10);
  const yearAgo=new Date(Date.now()-365*864e5).toISOString().slice(0,10);
  const p=MAP_PERIODS.find(x=>x.id===mapPeriod)||MAP_PERIODS[0];
  return list.filter(f=>p.test(f,today,yearAgo));
}
function renderMapTabs(){
  const all=mapAll;
  $("mapTabs").innerHTML=all.length?MAP_PERIODS.map(p=>{
    const today=new Date().toISOString().slice(0,10),yearAgo=new Date(Date.now()-365*864e5).toISOString().slice(0,10);
    const n=all.filter(f=>p.test(f,today,yearAgo)).length;
    return `<button type="button" role="tab" class="ltab" data-period="${p.id}" aria-selected="${p.id===mapPeriod}">${p.label}<span>${n}</span></button>`;}).join(""):"";
}
function drawMap(list){
  mapAll=list;renderMapTabs();
  list=mapFilter(list);
  const used=new Set();list.forEach(f=>{used.add(f.from);used.add(f.to)});
  const routes={},dir={};list.forEach(f=>{const k=[f.from,f.to].sort().join("-");routes[k]=(routes[k]||0)+1;dir[f.from+"-"+f.to]=(dir[f.from+"-"+f.to]||0)+1;});
  const sig=Object.entries(routes).map(e=>e.join(":")).sort().join("|");
  if(sig!==model.sig){
    const arcs=Object.entries(routes).map(([k,c])=>{const [a,b]=k.split("-");const pts=gc(a,b,72);
      for(let i=1;i<pts.length;i++){while(pts[i][0]-pts[i-1][0]>180)pts[i][0]-=360;while(pts[i][0]-pts[i-1][0]<-180)pts[i][0]+=360;}
      let b0=1e9,b1=-1e9;pts.forEach(([x])=>{b0=Math.min(b0,x);b1=Math.max(b1,x);});return {a,b,c,pts,b0,b1};}).sort((p,q)=>p.c-q.c);
    model={arcs,used:[...used],dir,sig};
    if(sel&&!used.has(sel))sel=null;
    smoothFit(sel);
  }else{model.used=[...used];model.dir=dir;}
  if(sel&&!used.has(sel))sel=null;
  $("mapBounds").textContent=used.size?`${model.arcs.length} routes · ${used.size} airports`:"";
  renderAirport(list,used);paint();
}
function schedule(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;paint();});}
function offsets(b0,b1,L,R){const out=[];for(let k=Math.ceil((L-b1)/360);k<=Math.floor((R-b0)/360);k++)out.push(k*360);return out;}
function paint(){
  const cv=$("map"),ctx=cv.getContext("2d");const {W,H}=dims();
  if(!view)fit();
  if(W0&&W!==W0)view.s*=W/W0;W0=W;clampView(W,H);
  const dpr=paintDpr||window.devicePixelRatio||1;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.height=H+"px";}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const C={bg:cssv("--surface"),grid:cssv("--grid"),ink:cssv("--ink"),muted:cssv("--muted"),acc:cssv("--accent"),sig:cssv("--signal"),land:cssv("--land"),coast:cssv("--coast")};
  const F=[1,2,3,4,5].map(i=>cssv("--f"+i));
  const s=view.s,X=lon=>W/2+(lon-view.cLon)*s,Y=lat=>H/2-(my(lat)-view.cMy)*s;
  const L=view.cLon-W/2/s,R=view.cLon+W/2/s;
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
  // land
  ctx.fillStyle=C.land;ctx.strokeStyle=C.coast;ctx.lineWidth=.8;ctx.lineJoin="round";
  LAND.forEach((r,ri)=>{const [b0,b1]=LAND_B[ri];
    offsets(b0,b1,L,R).forEach(off=>{
      ctx.beginPath();for(let i=0;i<r.length;i+=2){const x=X(r[i]/10+off),y=Y(r[i+1]/10);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
      ctx.beginPath();
      for(let i=2;i<=r.length;i+=2){const j=i%r.length,p0=r[i-2],q0=r[i-1],p1=r[j],q1=r[j+1];
        if((Math.abs(p0)===1800&&Math.abs(p1)===1800)||(q0<=-820&&q1<=-820))continue;
        ctx.moveTo(X(p0/10+off),Y(q0/10));ctx.lineTo(X(p1/10+off),Y(q1/10));}
      ctx.stroke();});
  });
  // graticule
  const pick=span=>[60,30,20,10,5,2,1].find(st=>span/st>=4)||1;
  const latT=imy(view.cMy+H/2/s),latB=imy(view.cMy-H/2/s);
  const stLon=pick(R-L),stLat=pick(latT-latB);
  ctx.strokeStyle=C.grid;ctx.lineWidth=1;ctx.font="10px "+cssv("--f-mono");ctx.fillStyle=C.muted;
  for(let g=Math.ceil(L/stLon)*stLon;g<=R;g+=stLon){const x=Math.round(X(g))+.5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
    const gl=((g+540)%360)-180;ctx.fillText(Math.abs(gl)+"°"+(gl<0&&gl>-180?"W":gl>0?"E":""),x+3,H-5);}
  for(let g=Math.ceil(latB/stLat)*stLat;g<=latT;g+=stLat){if(Math.abs(g)>MAXLAT)continue;const y=Math.round(Y(g))+.5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();if(y>H-20||y<14)continue;ctx.fillText(Math.abs(g)+"°"+(g<0?"S":g>0?"N":""),4,y-3);}
  // routes: line thickness grows gently with times flown (square-root scale), from 1.5 px up to 5 px at most
  const routeWidth=(c,max)=>c<=1||max<=1?1.5:1.5+3.5*Math.sqrt((c-1)/(max-1));
  const maxDir=Math.max(1,...Object.values(model.dir));
  ctx.lineCap="round";ctx.lineJoin="round";
  const stroke=(sp,off)=>{ctx.beginPath();sp.forEach(([x,y],i)=>{const a=sp[Math.max(0,i-1)],b=sp[Math.min(sp.length-1,i+1)];
    let nx=-(b[1]-a[1]),ny=b[0]-a[0];const l=Math.hypot(nx,ny)||1;const px=x+nx/l*off,py=y+ny/l*off;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();};
  const maxC=Math.max(1,...model.arcs.map(a=>a.c)),hot=[];
  model.arcs.forEach(r=>{
    if(sel&&(r.a===sel||r.b===sel)){hot.push(r);return;}
    ctx.lineWidth=routeWidth(r.c,maxC);
    ctx.strokeStyle=sel?C.muted:F[bucket(r.c)];ctx.globalAlpha=sel?.22:.95;
    offsets(r.b0,r.b1,L,R).forEach(off=>stroke(r.pts.map(([lo,la])=>[X(lo+off),Y(la)]),0));});
  ctx.globalAlpha=1;
  hot.forEach(r=>{const other=r.a===sel?r.b:r.a;const out=model.dir[sel+"-"+other]||0,inn=model.dir[other+"-"+sel]||0,both=out&&inn,sgn=r.a===sel?1:-1;
    offsets(r.b0,r.b1,L,R).forEach(off=>{const sp=r.pts.map(([lo,la])=>[X(lo+off),Y(la)]);
      // each direction sits on its own side of the route, offset by half of both widths so they never overlap
      const wo=routeWidth(out,maxDir),wi=routeWidth(inn,maxDir),gap=both?(wo+wi)/4+0.6:0;
      if(out){ctx.strokeStyle=C.acc;ctx.lineWidth=wo;stroke(sp,both?gap*sgn:0);}
      if(inn){ctx.strokeStyle=C.sig;ctx.lineWidth=wi;stroke(sp,both?-gap*sgn:0);}});});
  // airports
  const placed=[];mapPts=[];
  model.used.forEach(c=>{const a=AP[c];
    const isSel=c===sel,linked=sel&&hot.some(r=>r.a===c||r.b===c),dim=sel&&!isSel&&!linked;
    offsets(a.lon,a.lon,L-2,R+2).forEach(off=>{const x=X(a.lon+off),y=Y(a.lat);if(y<-20||y>H+20)return;
      mapPts.push({c,x,y});ctx.globalAlpha=dim?.4:1;
      if(isSel){ctx.fillStyle=C.ink;ctx.beginPath();ctx.arc(x,y,7,0,7);ctx.fill();ctx.fillStyle=C.bg;ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();}
      else{ctx.fillStyle=C.bg;ctx.beginPath();ctx.arc(x,y,4.5,0,7);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(x,y,3.6,0,7);ctx.stroke();}
      ctx.font=(isSel?"700 13px ":"500 11px ")+cssv("--f-mono");
      let ly=y-(isSel?11:8);const tw=ctx.measureText(c).width;let lx=Math.min(W-tw-3,Math.max(3,x+(isSel?10:6)));
      for(const p of placed){if(Math.abs(p.x-lx)<tw+4&&Math.abs(p.y-ly)<12){ly=y+16;break;}}
      placed.push({x:lx,y:ly});ctx.fillStyle=C.ink;ctx.fillText(c,lx,Math.max(13,ly));});});
  ctx.globalAlpha=1;
  if(!model.arcs.length){ctx.fillStyle=C.muted;ctx.font="14px "+cssv("--f-body");ctx.textAlign="center";ctx.fillText(mapAll.length?"No flights in this period":"Your routes will be drawn here",W/2,H/2);ctx.textAlign="start";}
  $("zIn").disabled=view.s>=sLim(W,H)[1]-1e-6;$("zOut").disabled=view.s<=sLim(W,H)[0]+1e-6;
}

function renderAirport(list,used){
  const pick=$("apPick"),codes=[...used].sort();
  pick.innerHTML='<option value="">Pick an airport…</option>'+codes.map(c=>`<option value="${c}"${c===sel?" selected":""}>${c} · ${esc(AP[c].city)}</option>`).join("");
  pick.hidden=!codes.length;
  const P=$("apPanel");
  $("mapNote").textContent=codes.length?(sel?"":"Tap an airport"):"";
  $("mapLegend").innerHTML=sel?'<span class="lg"><i class="sw out"></i>Outbound</span><span class="lg"><i class="sw in"></i>Inbound</span>':'<span class="lg-t">Times flown</span>'+FREQ.map((f,i)=>`<span class="lg"><i class="sw" style="background:var(--f${i+1})"></i>${f.label}</span>`).join("");
  if(!sel){P.hidden=true;return;}
  const outs=list.filter(f=>f.from===sel).sort((a,b)=>b.date.localeCompare(a.date));
  const ins=list.filter(f=>f.to===sel).sort((a,b)=>b.date.localeCompare(a.date));
  const kmOut=outs.reduce((s,f)=>s+distKm(f.from,f.to),0),kmIn=ins.reduce((s,f)=>s+distKm(f.from,f.to),0);
  const peers=new Set();outs.forEach(f=>peers.add(f.to));ins.forEach(f=>peers.add(f.from));
  const row=(f,other)=>`<li data-fid="${f.id}"><span class="d">${f.date}</span><button type="button" class="ap-go" data-ap="${other}" aria-label="Show ${other} on the map">${other}</button><a class="c" href="#log" aria-label="Open ${f.from} to ${f.to} on ${f.date} in the flight log">${esc(AP[other].city)}${f.airline?" · "+f.airline+" "+f.num:""}</a><span class="km">${fmtDist(distKm(f.from,f.to))}</span></li>`;
  const head=(cls,title,n,dir)=>n?`<a class="ap-h" href="#log" data-dir="${dir}" aria-label="Open all ${n} ${title.toLowerCase()} flights in the flight log"><i class="sw ${cls}"></i><span class="label">${title}</span><span class="n">${n}</span></a>`:`<div class="ap-h"><i class="sw ${cls}"></i><span class="label">${title}</span><span class="n">0</span></div>`;
  const col=(cls,title,arr,km,key)=>`<div class="ap-col">${head(cls,title,arr.length,key)}`+
    (arr.length?`<ul>${arr.slice(0,8).map(f=>row(f,f[key])).join("")}</ul><div class="ap-sum">${arr.length>8?`${arr.length-8} more · `:""}${fmtDist(km)} ${unit} total</div>`:`<p class="ap-none">No ${title.toLowerCase()} flights logged.</p>`)+`</div>`;
  P.innerHTML=`<div class="ap-top"><div><span class="ap-code">${sel}</span><span class="ap-city">${esc(AP[sel].city)} · ${outs.length+ins.length} flights · ${peers.size} connected ${peers.size===1?"airport":"airports"}</span></div><button class="btn quiet" id="apClear">Show all routes</button></div>`+
    `<div class="ap-cols">${col("out","Outbound",outs,kmOut,"to")}${col("in","Inbound",ins,kmIn,"from")}</div>`+
    `<a class="ap-all" href="#log" data-ap="${sel}">See all ${outs.length+ins.length} ${sel} flights in the flight log ›</a>`;
  P.hidden=false;
}
// picking an airport zooms to it and all its routes; "Show all routes" zooms back out to everything
function setSel(c){sel=c||null;smoothFit(sel);renderAirport(mapFilter(mapAll),new Set(model.used));paint();}

// ---------- import UI ----------
const SAMPLE=`From: Alaska Airlines <no-reply@alaskaair.com>
Subject: Your confirmation receipt: QWERTY

Thanks for flying with us! Confirmation code: QWERTY

Departing Flight - Fri, Nov 14, 2026
Alaska Airlines AS 1294
San Francisco (SFO) → Seattle (SEA)
Departs 7:05 AM   Arrives 9:12 AM
Seat 12A  ·  Main

Return Flight - Mon, Nov 17, 2026
Alaska Airlines AS 1301
Seattle (SEA) → San Francisco (SFO)
Departs 6:40 PM   Arrives 8:55 PM
Seat 14C  ·  Main

Total charged to card ending 0000.`;

function showCandidates(list){
  const have=new Set(real().map(keyOf));
  const today=new Date().toISOString().slice(0,10);
  const trips=new Set(real().map(tripKey));
  candidates=list.map(f=>Object.assign({},f,{dup:have.has(keyOf(f))||trips.has(tripKey(f)),upcoming:f.date>today}));
  const W=$("candWrap"),C=$("cands");
  if(!candidates.length){W.hidden=true;return;}
  C.innerHTML=candidates.map((f,i)=>`<label class="cand"><input type="checkbox" id="cand${i}" data-i="${i}" ${f.dup||f.upcoming?"":"checked"}><span class="cand-main"><span><b class="mono">${f.from} → ${f.to}</b> · ${f.airline?f.airline+" "+f.num+" · ":""}${fmtDate(f.date)}${f.ac?" · "+esc(f.ac):""}</span>${f.src?`<span class="src">${esc(f.src)}</span>`:""}</span><span class="dup">${f.dup?"Already logged":f.upcoming?"Upcoming":fmtDist(distKm(f.from,f.to))+" "+unit}</span></label>`).join("");
  W.hidden=false;
}
function runParse(text){
  const msg=$("parseMsg");msg.classList.remove("err");
  if(!text.trim()){msg.textContent="Paste an email first.";msg.classList.add("err");return;}
  const got=parseEmails(text);
  if(!got.length){msg.textContent="No flights found. Contrail needs a flight number or a route like SFO → JFK, plus a date. You can add the flight by hand below.";msg.classList.add("err");showCandidates([]);return;}
  msg.textContent=`Found ${got.length} ${got.length===1?"flight":"flights"}. Check them, then add.`;
  showCandidates(got);
}
$("parseBtn").addEventListener("click",()=>runParse($("emailIn").value));
$("sampleBtn").addEventListener("click",()=>{$("emailIn").value=SAMPLE;runParse(SAMPLE);});
$("fileIn").addEventListener("change",e=>{
  const files=[...e.target.files];if(!files.length)return;
  Promise.all(files.map(f=>f.text())).then(ts=>{const all=ts.join("\n\n-----\n\n");$("emailIn").value=cleanEmail(all).slice(0,20000);runParse(all);e.target.value="";});
});
function addFlights(arr){return addFlightsIds(arr).length;}
// Adds flights not already in the log; returns the ids of the ones it added.
function addFlightsIds(arr){
  if(!arr.length)return [];
  if(flights.every(f=>f.example))flights=[];
  const have=new Set(flights.map(keyOf));let n=0;
  const trips=new Set(flights.filter(f=>!f.example).map(tripKey));
  const now=Date.now();
  const ids=[];
  arr.forEach(f=>{const k=keyOf(f);if(have.has(k)||trips.has(tripKey(f)))return;have.add(k);trips.add(tripKey(f));const id=uid();ids.push(id);flights.push({id,airline:f.airline||"",num:f.num||"",from:f.from,to:f.to,date:f.date,ac:f.ac||"",added:now});n++;});
  if(ids.length){save();render();}
  return ids;
}
$("addSel").addEventListener("click",()=>{
  const pick=[...document.querySelectorAll("#cands input:checked")].map(i=>candidates[+i.dataset.i]);
  const n=addFlights(pick);$("parseMsg").textContent=n?`Added ${n} ${n===1?"flight":"flights"} to your log.`:"Nothing new to add.";
  $("candWrap").hidden=true;$("emailIn").value="";
});
$("cancelSel").addEventListener("click",()=>{$("candWrap").hidden=true;$("parseMsg").textContent="";});
$("manual").addEventListener("submit",e=>{
  e.preventDefault();const m=$("manMsg");m.classList.remove("err");
  const from=$("mFrom").value.trim().toUpperCase(),to=$("mTo").value.trim().toUpperCase(),date=$("mDate").value;
  const fl=$("mFlight").value.trim().toUpperCase().match(/^([A-Z0-9]{2})\s?(\d{1,4})$/);
  for(const c of [from,to])if(!AP[c]){m.textContent=`Contrail doesn't know the airport code "${c}" yet. Try a major airport's 3-letter code, like SFO.`;m.classList.add("err");return;}
  if(from===to){m.textContent="From and To need to be different airports.";m.classList.add("err");return;}
  if(!date){m.textContent="Pick the date you flew.";m.classList.add("err");return;}
  const acIn=$("mAircraft").value.trim();
  const n=addFlights([{from,to,date,airline:fl?fl[1]:"",num:fl?fl[2]:"",ac:acIn?(findAircraft(acIn)||acIn):""}]);
  m.textContent=n?"Logged.":"That flight is already in your log.";
  if(n){$("mFrom").value=to;$("mTo").value="";$("mFlight").value="";$("mAircraft").value="";}
});
$("log").addEventListener("click",e=>{
  const ab=e.target.closest(".acb");
  if(ab){editAc=ab.dataset.id;renderLog(logList);const inp=$("log").querySelector(".acin");if(inp){inp.focus();inp.select();}return;}
  if(e.target.closest(".acx")){const id=editAc;editAc=null;renderLog(logList);const b=$("log").querySelector('.acb[data-id="'+id+'"]');if(b)b.focus();return;}
  const pb=e.target.closest(".phb");
  if(pb){openPh=openPh===pb.dataset.k?null:pb.dataset.k;renderLog(logList);
    const again=$("log").querySelector('.phb[data-k="'+CSS.escape(pb.dataset.k)+'"]');if(again)again.focus();return;}
  const b=e.target.closest(".x");if(!b)return;
  const gone=flights.find(f=>f.id===b.dataset.id);
  if(gone&&!gone.example){const k=keyOf(gone);removed=removed.filter(r=>r.k!==k);removed.push({k,at:Date.now()});
    if(window.ContrailPhotos)photosFor(k).forEach(id=>window.ContrailPhotos.deletePhoto(id));}
  flights=flights.filter(f=>f.id!==b.dataset.id);save();render();});
$("log").addEventListener("submit",e=>{
  const fm=e.target.closest(".acform");if(!fm)return;e.preventDefault();
  const f=flights.find(x=>x.id===fm.dataset.id);const v=fm.querySelector(".acin").value.trim();
  if(f){f.ac=v?(findAircraft(v)||v):"";f.edited=Date.now();}
  editAc=null;save();render();
  const b=$("log").querySelector('.acb[data-id="'+fm.dataset.id+'"]');if(b)b.focus();
});
$("log").addEventListener("keydown",e=>{if(e.key==="Escape"&&e.target.closest(".acform")){const id=editAc;editAc=null;renderLog(logList);const b=$("log").querySelector('.acb[data-id="'+id+'"]');if(b)b.focus();}});
$("acList").innerHTML=AC_LIST.map(n=>`<option value="${n}"></option>`).join("");
// search + filters
let lqT=0;
$("lq").addEventListener("input",e=>{clearTimeout(lqT);lqT=setTimeout(()=>{lf.q=e.target.value.trim();logPage=0;renderLog(logList);},150);});
[["lfFrom","from"],["lfTo","to"],["lfAp","ap"],["lfAl","al"],["lfAc","ac"]].forEach(([id,k])=>$(id).addEventListener("change",e=>{lf[k]=e.target.value;logPage=0;renderLog(logList);}));
function clearFilters(){Object.keys(lf).forEach(k=>lf[k]="");lf.route=null;lf.oneway=false;["lq","lfFrom","lfTo"].forEach(id=>$(id).value="");logPage=0;renderLog(logList);$("lq").focus();}
$("lfClear").addEventListener("click",clearFilters);
$("lfRouteX").addEventListener("click",()=>{lf.route=null;lf.oneway=false;lf.dirOut=lf.dirIn="";logPage=0;renderLog(logList);});
// Records → Flight log, filtered
function openLogWith(filter,year){
  Object.keys(lf).forEach(k=>lf[k]="");lf.route=null;lf.oneway=false;
  const focus=logFocus;
  Object.assign(lf,filter||{});
  $("lq").value=lf.q;$("lfFrom").value=lf.from;$("lfTo").value=lf.to;
  logTab=year||"all";logPage=0;
  if(lfCount()-(lf.route||lf.dirOut||lf.dirIn?1:0)>0){$("lfPanel").hidden=false;$("lfToggle").setAttribute("aria-expanded","true");}
  renderLog(logList);
  if(focus)setTimeout(()=>{const el=$("log").querySelector('.leg[data-fid="'+focus+'"]');if(el)el.scrollIntoView({block:"center",behavior:"smooth"});},80);
}
$("records").addEventListener("click",e=>{const a=e.target.closest("a.recbtn[data-filter]");if(!a)return;openLogWith(JSON.parse(a.dataset.filter));});
$("years").addEventListener("click",e=>{const a=e.target.closest("a.yr");if(!a)return;openLogWith(null,a.dataset.year);});
$("log").addEventListener("click",e=>{if(e.target.closest("#lfClear2"))clearFilters();});
$("lfToggle").addEventListener("click",()=>{const open=$("lfPanel").hidden;$("lfPanel").hidden=!open;$("lfToggle").setAttribute("aria-expanded",String(open));});
if(matchMedia("(min-width: 980px)").matches){$("lfPanel").hidden=false;$("lfToggle").setAttribute("aria-expanded","true");}
$("logTabs").addEventListener("click",e=>{const b=e.target.closest(".ltab");if(!b)return;
  logTab=b.dataset.tab;logPage=0;try{localStorage.setItem(TKEY,logTab);}catch(_){}renderLog(logList);
  const sel=$("logTabs").querySelector('[aria-selected="true"]');if(sel&&sel.focus)sel.focus();});
showSort();
$("lsort").addEventListener("click",()=>{logOld=!logOld;try{localStorage.setItem("contrail.logSort",logOld?"old":"new");}catch(_){}logPage=0;showSort();renderLog(logList);});
$("pgPrev").addEventListener("click",()=>{if(logPage>0){logPage--;renderLog(logList);}});
$("pgNext").addEventListener("click",()=>{logPage++;renderLog(logList);});
$("u-mi").addEventListener("click",()=>{unit="mi";try{localStorage.setItem(UKEY,unit)}catch(e){}render();showCandidates(candidates);});
$("u-km").addEventListener("click",()=>{unit="km";try{localStorage.setItem(UKEY,unit)}catch(e){}render();showCandidates(candidates);});
$("copyCsv").addEventListener("click",()=>{
  const rows=[["date","airline","flight","from","to","aircraft","distance_km"]].concat(flights.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(f=>[f.date,AL[f.airline]||"",f.airline?f.airline+f.num:"",f.from,f.to,(f.ac||"").replace(/,/g," "),Math.round(distKm(f.from,f.to))]));
  const csv=rows.map(r=>r.join(",")).join("\n");const btn=$("copyCsv");
  const done=()=>{btn.textContent="Copied";setTimeout(()=>btn.textContent="Copy as CSV",1600);};
  try{navigator.clipboard.writeText(csv).then(done,()=>{$("emailIn").value=csv;$("emailIn").select();btn.textContent="Selected in box above";});}
  catch(e){$("emailIn").value=csv;$("emailIn").select();}
});

// map interaction: drag to pan, wheel / pinch / buttons to zoom, tap an airport to select
// zoomAt: zoom by f keeping the point under (px,py) still. smooth: ease there (buttons, keys, mouse wheel
// clicks); pinch and trackpad scrolling follow the fingers directly. Quick repeats build on the zoom in progress.
function zoomAt(px,py,f,smooth,ms){const {W,H}=dims();const base=smooth&&glideTarget?glideTarget:view,s=base.s;
  const lon=base.cLon+(px-W/2)/s,m=base.cMy-(py-H/2)/s;
  const [a,b]=sLim(W,H);const s2=Math.max(a,Math.min(b,s*f));
  const t={s:s2,cLon:lon-(px-W/2)/s2,cMy:m+(py-H/2)/s2};
  if(smooth){glide(t,ms||320);return;}
  stopGlide();Object.assign(view,t);clampView(W,H);schedule();}
function local(e){const r=$("map").getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
function hitAt(x,y){let best=null,bd=18;mapPts.forEach(p=>{const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p.c;}});return best;}
(function(){
  const cv=$("map"),ptrs=new Map();let moved=0,pinchD=0,pinchM=null;
  const two=()=>{const [a,b]=[...ptrs.values()];return {d:Math.hypot(a.x-b.x,a.y-b.y),m:[(a.x+b.x)/2,(a.y+b.y)/2]};};
  cv.addEventListener("pointerdown",e=>{if(e.button>0)return;stopGlide();try{cv.setPointerCapture(e.pointerId);}catch(_){}
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===1)moved=0;
    if(ptrs.size===2){const t=two();pinchD=t.d;pinchM=t.m;}cv.classList.add("grabbing");});
  cv.addEventListener("pointermove",e=>{
    if(!ptrs.has(e.pointerId)){const [x,y]=local(e);cv.classList.toggle("can-pick",!!hitAt(x,y));return;}
    const p=ptrs.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===1){view.cLon-=dx/view.s;view.cMy+=dy/view.s;moved+=Math.abs(dx)+Math.abs(dy);const {W,H}=dims();clampView(W,H);schedule();}
    else if(ptrs.size===2){const t=two(),r=cv.getBoundingClientRect();
      view.cLon-=(t.m[0]-pinchM[0])/view.s;view.cMy+=(t.m[1]-pinchM[1])/view.s;
      zoomAt(t.m[0]-r.left,t.m[1]-r.top,pinchD?t.d/pinchD:1);pinchD=t.d;pinchM=t.m;moved+=99;}});
  const end=e=>{if(!ptrs.has(e.pointerId))return;
    if(e.type==="pointerup"&&ptrs.size===1&&moved<6){const [x,y]=local(e);const c=hitAt(x,y);setSel(c&&c!==sel?c:null);}
    ptrs.delete(e.pointerId);if(ptrs.size<2)pinchD=0;if(!ptrs.size)cv.classList.remove("grabbing");};
  cv.addEventListener("pointerup",end);cv.addEventListener("pointercancel",end);
  cv.addEventListener("wheel",e=>{e.preventDefault();const [x,y]=local(e);
    // a mouse wheel moves in big notches, so ease each one; a trackpad sends many tiny steps, so follow it directly
    const notch=e.deltaMode!==0||(Math.abs(e.deltaY)>=50&&Number.isInteger(e.deltaY)&&!e.ctrlKey);
    zoomAt(x,y,Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0018)),notch,200);},{passive:false});
  cv.addEventListener("dblclick",e=>{const [x,y]=local(e);zoomAt(x,y,e.shiftKey?0.5:2,true);});
  cv.addEventListener("keydown",e=>{const {W,H}=dims(),st=60/view.s;let used=true;
    if(e.key==="ArrowLeft")view.cLon-=st;else if(e.key==="ArrowRight")view.cLon+=st;else if(e.key==="ArrowUp")view.cMy+=st;else if(e.key==="ArrowDown")view.cMy-=st;
    else if(e.key==="+"||e.key==="=")return zoomAt(W/2,H/2,1.5,true),e.preventDefault();else if(e.key==="-"||e.key==="_")return zoomAt(W/2,H/2,1/1.5,true),e.preventDefault();
    else if(e.key==="0"){e.preventDefault();return smoothFit(sel);}else used=false;
    if(used)stopGlide();
    if(used){e.preventDefault();clampView(W,H);schedule();}});
  $("zIn").addEventListener("click",()=>{const {W,H}=dims();zoomAt(W/2,H/2,1.6,true);});
  $("zOut").addEventListener("click",()=>{const {W,H}=dims();zoomAt(W/2,H/2,1/1.6,true);});
  $("zFit").addEventListener("click",()=>smoothFit(sel));
  $("zWorld").addEventListener("click",()=>{const {W,H}=dims();glide({s:sLim(W,H)[0],cLon:view.cLon,cMy:my(20)});});
})();
$("apPick").addEventListener("change",e=>setSel(e.target.value));
$("mapTabs").addEventListener("click",e=>{const b=e.target.closest(".ltab");if(!b)return;
  mapPeriod=b.dataset.period;try{localStorage.setItem(MKEY,mapPeriod);}catch(_){}
  drawMap(mapAll);const s=$("mapTabs").querySelector('[aria-selected="true"]');if(s&&s.focus)s.focus();});
$("apPanel").addEventListener("click",e=>{if(e.target.closest("#apClear"))setSel(null);
  const all=e.target.closest(".ap-all");if(all){openLogWith({ap:all.dataset.ap});return;}
  const go=e.target.closest(".ap-go");if(go){setSel(go.dataset.ap);$("apPick").value=go.dataset.ap;return;}
  // a header opens every flight in that direction: outbound = from here (to any), inbound = to here
  const h=e.target.closest("a.ap-h");if(h){openLogWith(h.dataset.dir==="to"?{dirOut:sel}:{dirIn:sel});return;}
  const li=e.target.closest("li[data-fid]");
  if(li){const f=logList.find(x=>x.id===li.dataset.fid);if(!f)return;
    logFocus=f.id;openLogWith({route:[f.from,f.to],oneway:true});
    if(!e.target.closest("a"))location.hash="log";}});

// theme + resize redraws
window.addEventListener("resize",schedule);
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",schedule);}catch(e){}
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule);

// ---------- backup files ----------
function bmsg(t,err){const m=$("bkMsg");m.textContent=t;m.classList.toggle("err",!!err);}
$("bkSave").addEventListener("click",()=>{
  if(!real().length){bmsg("Add a flight first. Example flights aren't included in backups.",true);return;}
  const name="contrail-backup-"+new Date().toISOString().slice(0,10)+".json";
  const blob=new Blob([JSON.stringify(getDoc(),null,1)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
  bmsg(`Saved ${name}.`);
});
$("bkFile").addEventListener("change",async e=>{
  const file=e.target.files[0];e.target.value="";if(!file)return;
  let data;try{data=JSON.parse(await file.text());}catch(_){bmsg("That file isn't a Contrail backup. Pick a .json file saved from Contrail.",true);return;}
  const rows=Array.isArray(data)?data:data&&Array.isArray(data.flights)?data.flights:null;
  if(!rows){bmsg("That file isn't a Contrail backup. Pick a .json file saved from Contrail.",true);return;}
  const list=rows.map(normalizeRow).filter(Boolean);
  if(!list.length){bmsg("No flights found in that backup.",true);return;}
  const n=addFlights(list);
  bmsg(`Restored ${n} ${n===1?"flight":"flights"}`+(list.length-n?` (${list.length-n} were already in your log).`:"."));
});

// ---------- bridge for sync.js ----------
// The cloud copy is one JSON document: {app, format, updatedAt, flights:[...], removed:[{k,at}]}
function normalizeRow(r){
  if(!r)return null;
  const f={from:String(r.from||r.f||"").toUpperCase(),to:String(r.to||r.t||"").toUpperCase(),date:String(r.date||r.d||""),
    airline:String(r.airline||r.a||"").toUpperCase(),num:String(r.flight||r.num||r.n||""),added:Number(r.added)||0,
    ac:String(r.aircraft||r.ac||"").slice(0,40),edited:Number(r.edited)||0};
  return AP[f.from]&&AP[f.to]&&f.from!==f.to&&/^\d{4}-\d{2}-\d{2}$/.test(f.date)?f:null;
}
function getDoc(){
  return {app:"Contrail",format:2,updatedAt:Date.now(),wipedAt:wipeSeen(),
    flights:real().slice().sort((a,b)=>a.date.localeCompare(b.date)).map(f=>Object.assign({date:f.date,airline:f.airline||"",flight:f.num||"",from:f.from,to:f.to,added:f.added||0},f.ac?{aircraft:f.ac}:{},f.edited?{edited:f.edited}:{})),
    photos:photos.filter(p=>real().some(f=>keyOf(f)===p.k)).map(p=>({id:p.id,k:p.k,added:p.added})),
    removed:removed.slice(-1000)};
}
function setDoc(doc){
  const list=(doc.flights||[]).map(normalizeRow).filter(Boolean).map(f=>Object.assign(f,{id:uid()}));
  removed=Array.isArray(doc.removed)?doc.removed.filter(r=>r&&typeof r.k==="string"&&typeof r.at==="number"):[];
  flights=list.length?list:EXAMPLES.map(f=>Object.assign({},f,{id:uid(),example:true}));
  photos=Array.isArray(doc.photos)?doc.photos.filter(p=>p&&typeof p.id==="string"&&typeof p.k==="string").map(p=>({id:p.id,k:p.k,added:Number(p.added)||0})):photos;
  dedupeTrips();
  saveLocal();render();
  if(window.ContrailPhotos)window.ContrailPhotos.prune(photos.map(p=>p.id));
}
// ---------- delete all data ----------
// wipedAt: when this log was last wiped with "Delete all data". It travels with the cloud copy so the
// user's other devices clear themselves too instead of re-uploading what they still have.
const WIPE_KEY="contrail.wipeSeen";
function wipeSeen(){try{return Number(localStorage.getItem(WIPE_KEY))||0;}catch(_){return 0;}}
const DATA_KEYS=["contrail.flights.v1","contrail.removed.v1","contrail.photos.v1","contrail.photos.del","contrail.mail.last.gmail","contrail.mail.last.outlook"];
// full=true: everything Contrail ever stored in this browser (sign-ins, settings, data).
// full=false: just the log and photos (used when another device wiped the account copy).
async function wipeLocal(full,wipedAt){
  try{
    if(full){
      [localStorage,sessionStorage].forEach(st=>Object.keys(st).filter(k=>k.startsWith("contrail.")).forEach(k=>st.removeItem(k)));
    }else DATA_KEYS.forEach(k=>localStorage.removeItem(k));
    if(wipedAt)localStorage.setItem(WIPE_KEY,String(wipedAt));
  }catch(_){}
  if(window.ContrailPhotos)await window.ContrailPhotos.wipe();
  flights=EXAMPLES.map(f=>Object.assign({},f,{id:uid(),example:true}));removed=[];photos=[];openPh=null;
  logTab="all";logPage=0;mapPeriod="all";sel=null;
  render();
}

// ---------- bridge for photos.js ----------
function addPhotoMeta(k,id){const now=Date.now();removed=removed.filter(r=>r.k!=="p:"+id);photos.push({id,k,added:now});save();}
function removePhotoMeta(id){photos=photos.filter(p=>p.id!==id);removed=removed.filter(r=>r.k!=="p:"+id);removed.push({k:"p:"+id,at:Date.now()});save();}
function refreshLog(){renderLog(logList);}
function flightLabel(k){const f=real().find(x=>keyOf(x)===k);return f?`${f.from} → ${f.to} · ${fmtDate(f.date)}`:"Flight photo";}
// Used by mail.js: show flights found in someone's inbox in the same review list as pasted emails.
function reviewCandidates(list,message){
  const msg=$("parseMsg");msg.classList.toggle("err",!list.length);msg.textContent=message;
  showCandidates(list);
  ($("candWrap").hidden?msg:$("candWrap")).scrollIntoView({behavior:"smooth",block:"nearest"});
}
// A flight found without a flight number is dropped when the same route on the same day
// also appears with one (in this batch or already in the log).
// One entry per route and day within a batch of found flights (codeshares, repeat emails),
// keeping the most detailed: with a flight number, then with an aircraft.
function dropNumberless(list){
  const best=new Map();
  list.forEach(f=>{const t=tripKey(f),b=best.get(t);
    const score=x=>(x.airline&&x.num?2:0)+(x.ac?1:0);
    if(!b)best.set(t,f);
    else{const keep=score(f)>score(b)?f:b,other=keep===f?b:f;if(!keep.ac&&other.ac)keep.ac=other.ac;best.set(t,keep);}});
  return list.filter(f=>best.get(tripKey(f))===f);
}
// Adds imported flights straight to the log. Returns {ids, already} so the import can offer Undo.
function addImported(list){
  const have=new Set(real().map(keyOf)),trips=new Map(real().map(f=>[tripKey(f),f]));
  const fresh=list.filter(f=>!have.has(keyOf(f))&&!trips.has(tripKey(f)));
  // Flights already logged without an aircraft get it from the email (matched by flight or by route and day).
  let filled=0;const byKey=new Map(real().map(f=>[keyOf(f),f]));const now=Date.now();
  list.forEach(f=>{const g=byKey.get(keyOf(f))||trips.get(tripKey(f));if(g&&!g.ac&&f.ac){g.ac=f.ac;g.edited=now;filled++;}});
  const ids=addFlightsIds(fresh);
  if(filled&&!ids.length){save();render();}
  return {ids,already:list.length-fresh.length,filled};
}
function removeFlights(ids){
  const set=new Set(ids),now=Date.now();
  flights.filter(f=>set.has(f.id)&&!f.example).forEach(f=>{const k=keyOf(f);removed=removed.filter(r=>r.k!==k);removed.push({k,at:now});});
  flights=flights.filter(f=>!set.has(f.id));
  if(!flights.length)flights=EXAMPLES.map(f=>Object.assign({},f,{id:uid(),example:true}));
  save();render();
}
window.ContrailApp={getDoc,setDoc,keyOf,parseEmails,reviewCandidates,dropNumberless,addImported,removeFlights,
  photoIds:()=>photos.map(p=>p.id),addPhotoMeta,removePhotoMeta,refreshLog,flightLabel,wipeLocal,wipeSeen,
  counts:()=>({flights:real().length,photos:photos.length}),findAircraft,
  // Total distance flown (real flights, or the examples while the log is empty) for the Space page.
  totalKm:()=>{const l=real().length?real():flights;return l.reduce((s,f)=>s+distKm(f.from,f.to),0);},
  fmtDist:(km,dec)=>fmtDist(km,dec),unit:()=>unit,isExample:()=>!real().length,
  // For "Export your data"
  exportRows:()=>real().slice().sort((a,b)=>a.date.localeCompare(b.date)).map(f=>({date:f.date,airline_code:f.airline||"",airline:AL[f.airline]||"",
    flight:f.airline&&f.num?f.airline+f.num:"",from:f.from,from_city:AP[f.from]?AP[f.from].city:"",to:f.to,to_city:AP[f.to]?AP[f.to].city:"",
    aircraft:f.ac||"",distance_km:Math.round(distKm(f.from,f.to)),distance_mi:Math.round(distKm(f.from,f.to)*0.621371)})),
  exportPhotos:()=>photos.map(p=>{const f=real().find(x=>keyOf(x)===p.k);return f?{id:p.id,date:f.date,from:f.from,to:f.to,added:p.added}:null;}).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)||a.added-b.added)};

// ---------- Map tab: export the current map with an airport summary as a PNG ----------
// Uses exactly what's on screen: the period, the selected airport, zoom and position, and the theme.
function exportMapImage(){
  if(glideTarget){const t=glideTarget;stopGlide();view={...t};} // finish any zoom in progress first
  const src=$("map"),list=mapFilter(mapAll);
  if(!list.length){mapExSay("There are no flights on the map to export yet.",true);return;}
  const C={bg:cssv("--bg"),surf:cssv("--surface"),line:cssv("--line"),ink:cssv("--ink"),muted:cssv("--muted"),acc:cssv("--accent"),sig:cssv("--signal")};
  const FD=cssv("--f-display"),FB=cssv("--f-body"),FM=cssv("--f-mono");
  const per=(MAP_PERIODS.find(x=>x.id===mapPeriod)||MAP_PERIODS[0]).label;
  const dates=list.map(f=>f.date).sort(),span=fmtDate(dates[0])+" – "+fmtDate(dates[dates.length-1]);
  const km=list.reduce((t,f)=>t+distKm(f.from,f.to),0);
  // summary numbers and table rows
  let title,stats,head,rows,tTitle;
  if(sel){
    const outs=list.filter(f=>f.from===sel),ins=list.filter(f=>f.to===sel),peer={};
    outs.forEach(f=>{(peer[f.to]=peer[f.to]||{o:0,i:0}).o++;});ins.forEach(f=>{(peer[f.from]=peer[f.from]||{o:0,i:0}).i++;});
    const kmA=[...outs,...ins].reduce((t,f)=>t+distKm(f.from,f.to),0);
    title=sel+" · "+AP[sel].city;
    stats=[["Flights",outs.length+ins.length],["Outbound",outs.length],["Inbound",ins.length],["Connected airports",Object.keys(peer).length],["Distance",fmtDist(kmA)+" "+unit]];
    tTitle="Routes from "+sel;head=["Airport","City","Out","In","Each way ("+unit+")"];
    rows=Object.entries(peer).sort((a,b)=>(b[1].o+b[1].i)-(a[1].o+a[1].i)||a[0].localeCompare(b[0]))
      .map(([c,v])=>[c,AP[c].city,String(v.o),String(v.i),fmtDist(distKm(sel,c))]);
  }else{
    const n={},peers={},routes=new Set(),ccs=new Set();
    list.forEach(f=>{[f.from,f.to].forEach(c=>{n[c]=(n[c]||0)+1;ccs.add(AP[c].cc);});
      (peers[f.from]=peers[f.from]||new Set()).add(f.to);(peers[f.to]=peers[f.to]||new Set()).add(f.from);
      routes.add([f.from,f.to].sort().join("-"));});
    title="Route map";
    stats=[["Flights",list.length],["Distance",fmtDist(km)+" "+unit],["Airports",Object.keys(n).length],["Routes",routes.size],["Countries",ccs.size]];
    tTitle="Airports";head=["Airport","City","Country","Flights","Connected"];
    rows=Object.entries(n).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
      .map(([c,v])=>[c,AP[c].city,AP[c].cc,String(v),String(peers[c].size)]);
  }
  const MAXR=24,more=rows.length-MAXR;rows=rows.slice(0,MAXR);
  // layout, in CSS pixels at 2x. The map is full width; the title and stats sit on top of it.
  const W=1200,PAD=48,k=2,cssW=src.clientWidth||W,cssH=src.clientHeight||Math.round(W*.58);
  // the title sits in a band of open map above the routes and the stats in one below, so neither covers a route
  const TOP=170,BOT=150,drawH=Math.round(W*cssH/cssW),mapH=TOP+drawH+BOT,RH=40;
  const twoCol=rows.length>12,perCol=twoCol?Math.ceil(rows.length/2):rows.length;
  const table=!sel; // with an airport selected the image is just the map with its stats; the full view adds the airport list
  const H=mapH+(table?PAD+44+10+perCol*RH+(more>0?40:0):0)+70;
  // re-render the map sharply at the export size (same view), then put the screen version back
  paintDpr=W*k/cssW;let mapImg;
  try{paint();mapImg=document.createElement("canvas");mapImg.width=src.width;mapImg.height=src.height;mapImg.getContext("2d").drawImage(src,0,0);}
  finally{paintDpr=0;paint();}
  const cv=document.createElement("canvas");cv.width=W*k;cv.height=H*k;
  const x=cv.getContext("2d");x.scale(k,k);
  x.fillStyle=C.bg;x.fillRect(0,0,W,H);
  // the map; if the image is taller than the on-screen map, it's centred and the edges filled with the map colour
  x.fillStyle=C.surf;x.fillRect(0,0,W,mapH);
  x.drawImage(mapImg,0,TOP,W,drawH);
  const fade=(y0,y1,a0,a1)=>{const g=x.createLinearGradient(0,y0,0,y1);g.addColorStop(0,rgba(C.surf,a0));g.addColorStop(1,rgba(C.surf,a1));x.fillStyle=g;x.fillRect(0,Math.min(y0,y1),W,Math.abs(y1-y0));};
  fade(TOP,TOP+70,1,0);fade(TOP+drawH-70,TOP+drawH,0,1);
  x.textBaseline="alphabetic";
  // title, top left
  x.fillStyle=C.ink;x.font="800 22px "+FD;x.fillText("CONTRAIL",PAD,PAD+18);
  const bw=x.measureText("CONTRAIL").width;x.fillStyle=C.acc;x.fillText(".",PAD+bw,PAD+18);
  x.fillStyle=C.ink;x.font="800 56px "+FD;x.fillText(title.toUpperCase(),PAD,PAD+80,W-PAD*2);
  x.fillStyle=C.muted;x.font="14px "+FM;x.fillText(per.toUpperCase()+"  ·  "+span,PAD,PAD+110);
  if(sel){x.font="13px "+FM;let lx=W-PAD;[[C.sig,"Inbound"],[C.acc,"Outbound"]].forEach(([c,t])=>{const tw=x.measureText(t).width;lx-=tw;x.fillStyle=C.muted;x.fillText(t,lx,PAD+18);lx-=28;x.fillStyle=c;x.fillRect(lx,PAD+11,20,4);lx-=24;});}
  // stats along the bottom of the map
  const sw=(W-PAD*2)/stats.length,sy=mapH-PAD-62;
  stats.forEach(([l,v],i)=>{const sx=PAD+i*sw;
    x.fillStyle=C.muted;x.font="600 12px "+FM;x.fillText(l.toUpperCase(),sx,sy+14);
    x.fillStyle=C.ink;x.font="700 42px "+FD;x.fillText(typeof v==="number"?v.toLocaleString():v,sx,sy+60,sw-32);});
  x.strokeStyle=C.line;x.lineWidth=1;x.beginPath();x.moveTo(0,mapH+.5);x.lineTo(W,mapH+.5);x.stroke();
  let y=mapH+PAD;
  // airport table
  if(table){
  x.fillStyle=C.ink;x.font="800 26px "+FD;x.fillText(tTitle.toUpperCase(),PAD,y+24);y+=44;
  const mapW=W-PAD*2;
  const colW=twoCol?(mapW-32)/2:mapW;
  const cols=w=>[0,.12,.62,.76,1].map(f=>f*w); // x positions: code, city, then three right-aligned numbers end at .74/.88/1
  const drawTable=(rs,ox)=>{
    const cx=cols(colW);
    x.font="600 11px "+FM;x.fillStyle=C.muted;
    const right=[cx[2]+colW*.12,cx[3]+colW*.12,colW];
    x.fillText(head[0].toUpperCase(),ox,y);x.fillText(head[1].toUpperCase(),ox+cx[1],y);
    x.textAlign="right";head.slice(2).forEach((h,i)=>x.fillText(h.toUpperCase(),ox+right[i],y));x.textAlign="start";
    x.strokeStyle=C.ink;x.lineWidth=2;x.beginPath();x.moveTo(ox,y+10);x.lineTo(ox+colW,y+10);x.stroke();
    rs.forEach((r,i)=>{const ry=y+10+RH*(i+1)-14;
      x.fillStyle=C.ink;x.font="500 15px "+FM;x.fillText(r[0],ox,ry);
      x.fillStyle=C.muted;x.font="15px "+FB;x.fillText(r[1],ox+cx[1],ry,cx[2]-cx[1]+colW*.12-90);
      x.textAlign="right";x.fillStyle=C.ink;x.font="15px "+FM;r.slice(2).forEach((v,j)=>x.fillText(v,ox+right[j],ry));x.textAlign="start";
      x.strokeStyle=C.line;x.lineWidth=1;x.beginPath();x.moveTo(ox,ry+14);x.lineTo(ox+colW,ry+14);x.stroke();});
  };
  drawTable(rows.slice(0,perCol),PAD);
  if(twoCol)drawTable(rows.slice(perCol),PAD+colW+32);
  y+=10+perCol*RH;
  if(more>0){x.fillStyle=C.muted;x.font="14px "+FB;x.fillText("+ "+more+" more "+(more===1?"airport":"airports"),PAD,y+28);y+=40;}
  }
  x.fillStyle=C.muted;x.font="12px "+FM;x.fillText("Made with Contrail · "+fmtDate(localIso()),PAD,H-PAD+14);
  cv.toBlob(b=>{
    if(!b){mapExSay("Couldn't create the image. Try again.",true);return;}
    const a=document.createElement("a");a.href=URL.createObjectURL(b);
    a.download="contrail-map-"+(sel?sel.toLowerCase()+"-":"")+mapPeriod+"-"+localIso()+".png";
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);
    mapExSay("Downloaded "+a.download+".");
  },"image/png");
}
function rgba(c,a){const m=/^#?([0-9a-f]{6})$/i.exec(c.trim());if(!m)return c;const n=parseInt(m[1],16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
function localIso(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function mapExSay(t,err){const m=$("mapExMsg");m.textContent=t;m.classList.toggle("err",!!err);}
$("mapExport").addEventListener("click",()=>{try{exportMapImage();}catch(e){mapExSay("The export didn't work ("+((e&&e.message)||"error")+").",true);}});

load();render();
})();
