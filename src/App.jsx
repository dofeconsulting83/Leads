import React, { useState, useRef, useMemo, useEffect } from "react";

const SUPABASE_URL  = "https://okbtkvjexxhjmbdmorgg.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYnRrdmpleHhoam1iZG1vcmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Mjk3MzcsImV4cCI6MjA5MDEwNTczN30.vCPz-5Kj3F-NdFnw27T06qU4uhuYkGSPxUeC8S9o8dQ";
const HEADERS = { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON, "Content-Type": "application/json" };

async function dbSelect(table, query) {
  var allRows = [], offset = 0, pageSize = 1000;
  while (true) {
    var q = (query || "") + "&limit=" + pageSize + "&offset=" + offset;
    var r = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + q, { headers: Object.assign({}, HEADERS, { "Prefer": "count=none" }) });
    if (!r.ok) throw new Error(await r.text());
    var rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    allRows = allRows.concat(rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return allRows;
}
async function dbInsert(table, rows) {
  var batchSize = 500;
  for (var i = 0; i < rows.length; i += batchSize) {
    var r = await fetch(SUPABASE_URL + "/rest/v1/" + table, { method: "POST", headers: Object.assign({}, HEADERS, { "Prefer": "return=minimal" }), body: JSON.stringify(rows.slice(i, i + batchSize)) });
    if (!r.ok) throw new Error(await r.text());
  }
}
async function dbInsertOne(table, row) {
  var r = await fetch(SUPABASE_URL + "/rest/v1/" + table, { method: "POST", headers: Object.assign({}, HEADERS, { "Prefer": "return=minimal" }), body: JSON.stringify(row) });
  if (!r.ok) { var t = await r.text(); console.error("dbInsertOne ERROR", table, t); throw new Error(t); }
}
async function dbUpdate(table, match, data) {
  var r = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + match, { method: "PATCH", headers: Object.assign({}, HEADERS, { "Prefer": "return=minimal" }), body: JSON.stringify(data) });
  if (!r.ok) { var t = await r.text(); console.error("dbUpdate ERROR", table, t); throw new Error(t); }
}
async function dbDelete(table, match) {
  var r = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + match, { method: "DELETE", headers: Object.assign({}, HEADERS, { "Prefer": "return=minimal" }) });
  if (!r.ok) throw new Error(await r.text());
}
async function dbUpsert(table, rows) {
  var r = await fetch(SUPABASE_URL + "/rest/v1/" + table, { method: "POST", headers: Object.assign({}, HEADERS, { "Prefer": "resolution=merge-duplicates,return=minimal" }), body: JSON.stringify(rows) });
  if (!r.ok) throw new Error(await r.text());
}

var NETWORKS = {
  renovation: { label: "Atriome",   color: "#185FA5", light: "#E6F1FB" },
  humidite:   { label: "MurHumide", color: "#0F6E56", light: "#E1F5EE" }
};
var STATUSES = [
  { key: "nouveau",    label: "Nouveau",     bg: "#E6F1FB", color: "#0C447C" },
  { key: "contacte",   label: "Contacté",    bg: "#FAEEDA", color: "#633806" },
  { key: "rappeler",   label: "À rappeler",  bg: "#EEEDFE", color: "#3C3489" },
  { key: "rendezvous", label: "Rendez-vous", bg: "#E6F9F1", color: "#0F6E56" },
  { key: "signe",      label: "Signé",       bg: "#EAF3DE", color: "#27500A" },
  { key: "perdu",      label: "Perdu",       bg: "#FCEBEB", color: "#791F1F" },
  { key: "spam",       label: "Spam",        bg: "#F0F0F0", color: "#666666" }
];
var CUSTOM_STATUSES = {};
function getStatuses(companyId) { return STATUSES; }

var INIT_COMPANIES = [
  { id:"c2",  name:"13 ATM",  network:"renovation", login:"atm13",  password:"1234", email:"13atm@atriome.fr" },
  { id:"c3",  name:"14 ATM",  network:"renovation", login:"atm14",  password:"1234", email:"14atm@atriome.fr" },
  { id:"c4",  name:"35 ATM",  network:"renovation", login:"atm35",  password:"1234", email:"35atm@atriome.fr" },
  { id:"c5",  name:"52 ATM",  network:"renovation", login:"atm52",  password:"atm52_societe", email:"52atm@atriome.fr" },
  { id:"c6",  name:"56 ATM",  network:"renovation", login:"atm56",  password:"1234", email:"56atm@atriome.fr" },
  { id:"c7",  name:"60 ATM",  network:"renovation", login:"atm60",  password:"1234", email:"60atm@atriome.fr" },
  { id:"c8",  name:"69 ATM",  network:"renovation", login:"atm69",  password:"1234", email:"69atm@atriome.fr" },
  { id:"c9",  name:"78 ATM",  network:"renovation", login:"atm78",  password:"1234", email:"78atm@atriome.fr" },
  { id:"c10", name:"83 ATM",  network:"renovation", login:"atm83",  password:"1234", email:"83atm@atriome.fr" },
  { id:"c11", name:"84 ATM",  network:"renovation", login:"atm84",  password:"1234", email:"84atm@atriome.fr" },
  { id:"c12", name:"94 ATM",  network:"renovation", login:"atm94",  password:"1234", email:"94atm@atriome.fr" },
  { id:"c13", name:"95 ATMR", network:"renovation", login:"atmr95", password:"1234", email:"sebastien.d@atriome.fr" },
  { id:"c14", name:"30 MH",   network:"humidite",   login:"mh30",   password:"mh30_societe", email:"30mh@murhumide.fr" },
  { id:"c15", name:"44 MH",   network:"humidite",   login:"mh44",   password:"1234", email:"demande@44mh.fr" },
  { id:"c16", name:"56 MH",   network:"humidite",   login:"mh56",   password:"1234", email:"sas56mh@gmail.com" },
  { id:"c17", name:"59 MH",   network:"humidite",   login:"mh59",   password:"1234", email:"prospect@murhumide.fr" },
  { id:"c18", name:"69 MH",   network:"humidite",   login:"mh69",   password:"1234", email:"" },
  { id:"c19", name:"76 MH",   network:"humidite",   login:"mh76",   password:"mh76_societe", email:"normandie@murhumide.fr" },
  { id:"c20", name:"83 MH",   network:"humidite",   login:"mh83",   password:"mh83_societe", email:"cyril.blin@murhumide.fr" },
  { id:"c21", name:"91 MH",   network:"humidite",   login:"mh91",   password:"1234", email:"abder.limam@murhumide.fr" },
  { id:"c22", name:"ATM BFC", network:"renovation", login:"atmbfc", password:"1234", email:"pf21@proxifeu.fr" },
];
var ADMIN = { login: "admin", password: "admin123" };
var MH76_ADMIN = { companyId: "c19", login: "mh76", password: "1234" };
var MH30_ADMIN = { companyId: "c14", login: "mh30", password: "1234" };
var ATM52_ADMIN = { companyId: "c5",  login: "atm52", password: "1234" };
var MH83_ADMIN = { companyId: "c20", login: "mh83", password: "1234" };
var PAGE_SIZE = 20;

function rowToLead(r) { return { id:r.id, companyId:r.company_id, firstName:r.first_name, lastName:r.last_name, email:r.email, phone:r.phone, address:r.address, city:r.city, zip:r.zip, message:r.message, campaign:r.campaign, importedAt:r.imported_at, importId:r.import_id||null, importLabel:r.import_label||null, status:r.status||"nouveau", note:r.note||"", source:r.source||"" }; }
function leadToRow(l) { return { id:l.id, company_id:l.companyId, first_name:l.firstName, last_name:l.lastName, email:l.email, phone:l.phone, address:l.address, city:l.city, zip:l.zip, message:l.message, campaign:l.campaign, imported_at:l.importedAt, import_id:l.importId||null, import_label:l.importLabel||null, status:l.status||"nouveau", note:l.note||"", source:l.source||"" }; }
function rowToCompany(r) { return { id:r.id, name:r.name, network:r.network, login:r.login, password:r.password, email:r.email||"" }; }
function companyToRow(c) { return { id:c.id, name:c.name, network:c.network, login:c.login, password:c.password, email:c.email||"" }; }

function parseLeadDate(str) {
  if (!str) return null;
  var m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(m[3]+"-"+m[2]+"-"+m[1]);
  var d = new Date(str); return isNaN(d)?null:d;
}
function fmtDate(str) {
  if (!str) return "—";
  var m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return m[1]+"/"+m[2]+"/"+m[3];
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) return str.slice(0,10).split("-").reverse().join("/");
  return str.slice(0,10);
}
function fmtTime(str) { if(!str)return""; var m=str.match(/(\d{2}):(\d{2})/); return m?m[1]+":"+m[2]:""; }
function fmtMois(key) {
  var parts=key.split("-");
  var d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,1);
  return d.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
}
function fmtCA(n) {
  if(!n&&n!==0)return"0 €";
  return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
}
function getMoisList(n) {
  var months=[];
  for(var i=n-1;i>=0;i--){var d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);months.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));}
  return months;
}
function getMoisListSince(startYear, startMonth) {
  var months=[];
  var now=new Date();
  var y=startYear,m=startMonth;
  while(y<now.getFullYear()||(y===now.getFullYear()&&m<=now.getMonth()+1)){
    months.push(y+"-"+String(m).padStart(2,"0"));
    m++;if(m>12){m=1;y++;}
  }
  return months;
}
function parseMontant(val) {
  var cleaned=val.trim().toLowerCase().replace(/\s/g,"").replace(/€/g,"").replace(/,/g,".");
  var multiplier=1;
  if(cleaned.endsWith("k")){multiplier=1000;cleaned=cleaned.slice(0,-1);}
  else if(cleaned.endsWith("e")){cleaned=cleaned.slice(0,-1);}
  return (parseFloat(cleaned)||0)*multiplier;
}

function parseCSV(text) {
  var clean=text.replace(/^\uFEFF/,"");
  var lines=clean.trim().split(/\r?\n/).map(function(l){return l.trim();}).filter(Boolean);
  if(lines.length<2)return[];
  var sep=lines[0].includes(";")?";":",";
  function norm(s){return s.replace(/^"|"$/g,"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").trim();}
  var headers=lines[0].split(sep).map(norm);
  function idx(){var keys=Array.prototype.slice.call(arguments);return headers.findIndex(function(h){return keys.some(function(k){return h.includes(k);});});}
  var iFullName=idx("nom complet","full name"),iFirst=idx("prenom","first name"),iLast=idx("last name","lastname");
  var iPhone=idx("telephone","phone","mobile","n de tel","numero"),iEmail=idx("email","mail","e mail");
  var iZip=idx("code postal","postal","zip","cp"),iCity=idx("ville","city"),iAddr=idx("adresse","address","rue");
  var iMsg=idx("message","commentaire","note","remarque","phase","description"),iDate=idx("date","heure","soumis","envoi"),iCampaign=idx("campagne","campaign");
  function splitLine(line){var res=[],cur="",inQ=false;for(var ci=0;ci<line.length;ci++){var ch=line[ci];if(ch==='"'){inQ=!inQ;continue;}if(ch===sep&&!inQ){res.push(cur.trim());cur="";continue;}cur+=ch;}res.push(cur.trim());return res;}
  return lines.slice(1).map(function(line,i){
    var cols=splitLine(line);
    function g(j){return(j>=0&&j<cols.length)?cols[j].replace(/^"|"$/g,"").trim():"";}
    var fn=g(iFirst)||"",ln=g(iLast)||"";
    if(!fn&&!ln&&iFullName>=0){var pts=g(iFullName).trim().split(/\s+/);fn=pts[0]||"";ln=pts.slice(1).join(" ")||"";}
    if(!fn&&!g(iPhone)&&!g(iEmail))return null;
    return{id:"l_"+Date.now()+"_"+i+"_"+Math.random().toString(36).slice(2,6),firstName:fn||"—",lastName:ln,email:g(iEmail),phone:g(iPhone),address:g(iAddr),city:g(iCity),zip:g(iZip),message:g(iMsg),campaign:g(iCampaign),importedAt:g(iDate)||new Date().toLocaleString("fr-FR"),status:"nouveau",note:"",source:"",companyId:null,importId:null,importLabel:null};
  }).filter(Boolean);
}
function isContactFormat(headers){return headers.some(function(h){return h.includes("activity")||h.includes("siren")||h.includes("siret")||h.includes("naf");});}
function parseContactCSV(text){
  var clean=text.replace(/^\uFEFF/,"");
  var lines=clean.trim().split(/\r?\n/).map(function(l){return l.trim();}).filter(Boolean);
  if(lines.length<2)return[];
  var sep=";";
  function norm(s){return s.replace(/^"|"$/g,"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").trim();}
  var headers=lines[0].split(sep).map(norm);
  function idx(){var keys=Array.prototype.slice.call(arguments);return headers.findIndex(function(h){return keys.some(function(k){return h.includes(k);});});}
  var iNom=idx("nom"),iAddr=idx("addresse","adresse","address"),iZip=idx("code postal","postal","cp");
  var iCity=idx("ville","city"),iPhone=idx("telephone"),iMobile=idx("mobile"),iEmail=idx("mail","email"),iActivity=idx("activity","activit");
  function splitLine(line){var res=[],cur="",inQ=false;for(var ci=0;ci<line.length;ci++){var ch=line[ci];if(ch==='"'){inQ=!inQ;continue;}if(ch===sep&&!inQ){res.push(cur.trim());cur="";continue;}cur+=ch;}res.push(cur.trim());return res;}
  function cleanStr(s){return(s||"").replace(/^"|"$/g,"").replace(/[\x00-\x1F\x7F\u00A0\u200B\u200C\u200D\uFEFF]/g,"").trim();}
  function hasContent(s){var c=cleanStr(s);return c.length>0&&c!=="-"&&c!=="—"&&c!=="."&&c!=="N/A"&&c!=="n/a";}
  return lines.slice(1).map(function(line,i){
    var rawCleaned=line.replace(/;/g,"").replace(/,/g,"").replace(/\s/g,"").replace(/[\x00-\x1F\x7F\u00A0\u200B]/g,"");
    if(!rawCleaned)return null;
    var cols=splitLine(line);
    function g(j){return cleanStr((j>=0&&j<cols.length)?cols[j]:"");}
    var nom=g(iNom),phone=g(iMobile)||g(iPhone),email=g(iEmail),city=g(iCity),zip=g(iZip),addr=g(iAddr),activity=g(iActivity);
    if(!hasContent(nom)&&!hasContent(phone)&&!hasContent(email))return null;
    var phoneValid=phone.replace(/[\s\-\.\(\)]/g,"");
    if(phoneValid&&!/\d{6,}/.test(phoneValid))phone="";
    return{id:"l_"+Date.now()+"_"+i+"_"+Math.random().toString(36).slice(2,6),firstName:hasContent(nom)?nom:"—",lastName:"",email:hasContent(email)?email:"",phone:phone,address:hasContent(addr)?addr:"",city:hasContent(city)?city:"",zip:hasContent(zip)?zip:"",message:hasContent(activity)?"Activité : "+activity:"",campaign:"Import contact entreprise",importedAt:new Date().toLocaleString("fr-FR"),status:"nouveau",note:"",source:"Contacts",companyId:null,importId:null,importLabel:null};
  }).filter(Boolean);
}
function parseAutoCSV(text){
  var clean=text.replace(/^\uFEFF/,"");
  var firstLine=(clean.split(/\r?\n/)[0]||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  var headers=firstLine.split(";").map(function(h){return h.replace(/^"|"$/g,"").trim();});
  var commaHeaders=firstLine.split(",").map(function(h){return h.replace(/^"|"$/g,"").trim();});
  var isFacebook=commaHeaders.some(function(h){return h.includes("ad name")||h.includes("form name")||h.includes("campaign name")||h.includes("platform");});
  if(isContactFormat(headers))return{leads:parseContactCSV(text),format:"contact",source:"Contacts"};
  if(isFacebook)return{leads:parseCSV(text),format:"facebook",source:"Facebook"};
  return{leads:parseCSV(text),format:"googleads",source:"Google Ads"};
}
function exportCSV(leads,name){
  var h=["Prénom","Nom","Email","Téléphone","Adresse","Ville","CP","Message","Campagne","Statut","Note","Date","Origine"];
  var rows=leads.map(function(l){return[l.firstName,l.lastName,l.email,l.phone,l.address,l.city,l.zip,l.message,l.campaign,(STATUSES.find(function(s){return s.key===l.status;})||STATUSES[0]).label,l.note,l.importedAt,l.source||""];});
  var csv=[h].concat(rows).map(function(r){return r.map(function(v){return'"'+(v||"").replace(/"/g,'""')+'"';}).join(";");}).join("\n");
  var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
  a.download="leads_"+name.replace(/\s/g,"_")+"_"+new Date().toISOString().slice(0,10)+".csv";a.click();
}

var inp={padding:"7px 10px",borderRadius:8,border:"1px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontSize:13};

function fmtVille(l){
  var city=l.city&&l.city.trim();
  var zip=l.zip&&l.zip.trim();
  if(zip==="00000"||zip==="0")zip="";
  if(city)return zip?city+" ("+zip+")":city;
  if(zip)return zip;
  return "—";
}

function SourceBadge(props){
  var source=props.source||"";
  var cfg={"Google Ads":{bg:"#E8F0FE",color:"#1A73E8",ic:"🔎"},"Facebook":{bg:"#E7F0FF",color:"#1877F2",ic:"📘"},"Contacts":{bg:"#F3F4F6",color:"#555",ic:"📇"},"WhatsApp":{bg:"#E3F8EA",color:"#128C7E",ic:"💬"},"Tchatbot":{bg:"#F1E8FB",color:"#7B3FC4",ic:"🤖"}};
  var s=cfg[source]||{bg:"#F3F4F6",color:"#888",ic:"•"};
  if(!source)return null;
  return React.createElement("span",{style:{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,padding:"3px 10px",borderRadius:999,background:s.bg,color:s.color,fontWeight:500,whiteSpace:"nowrap"}},React.createElement("span",{style:{fontSize:12}},s.ic),source);
}

function Badge(props){
  var statuses=getStatuses(props.companyId);
  var s=statuses.find(function(x){return x.key===props.statusKey;})||STATUSES[0];
  return React.createElement("span",{style:{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,padding:"3px 11px",borderRadius:999,background:s.bg,color:s.color,fontWeight:500,whiteSpace:"nowrap"}},React.createElement("span",{style:{width:7,height:7,borderRadius:"50%",background:s.color}}),s.label);
}

function Pagination(props){
  var page=props.page,total=props.total,pageSize=props.pageSize,onChange=props.onChange,color=props.color;
  var totalPages=Math.max(1,Math.ceil(total/pageSize));
  var from=total===0?0:(page-1)*pageSize+1,to=Math.min(total,page*pageSize);
  var pages=[];
  for(var i=1;i<=totalPages;i++){if(i===1||i===totalPages||Math.abs(i-page)<=1)pages.push(i);else if(pages[pages.length-1]!=="…")pages.push("…");}
  var nb={width:36,height:36,borderRadius:10,border:"1px solid #e3e8ef",background:"#fff",cursor:"pointer",fontSize:14,color:"#4a5565",display:"inline-flex",alignItems:"center",justifyContent:"center"};
  return React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16,flexWrap:"wrap",gap:10}},
    React.createElement("span",{style:{fontSize:13,color:"#6b7684"}},from+" – "+to+" sur "+total+" lead"+(total>1?"s":"")),
    totalPages>1&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
      React.createElement("button",{onClick:function(){onChange(page-1);},disabled:page<=1,style:Object.assign({},nb,{opacity:page<=1?0.4:1,cursor:page<=1?"not-allowed":"pointer"})},"‹"),
      pages.map(function(p,k){if(p==="…")return React.createElement("span",{key:"e"+k,style:{color:"#9aa4b2",padding:"0 4px"}},"…");var active=p===page;return React.createElement("button",{key:p,onClick:function(){onChange(p);},style:Object.assign({},nb,{background:active?color:"#fff",color:active?"#fff":"#4a5565",borderColor:active?color:"#e3e8ef",fontWeight:active?600:400,boxShadow:active?"0 4px 10px rgba(24,95,165,.25)":"none"})},p);}),
      React.createElement("button",{onClick:function(){onChange(page+1);},disabled:page>=totalPages,style:Object.assign({},nb,{opacity:page>=totalPages?0.4:1,cursor:page>=totalPages?"not-allowed":"pointer"})},"›")
    )
  );
}

// ── Mapping société → lignes dans LEADS-ENTRANTS_2026 ──────────────────────
var STATS_SOURCES=["Devis site","Site local","Chatbot","Local Services","Formulaire Ads","Appels Fiche Google","Solocal","Salons & Foires","N° Vert","Réseaux sociaux"];
var STATS_MONTHS=["janvier","fevrier","mars","avril","mai","juin","juillet","aout","septembre","octobre","novembre","decembre"];
var STATS_MONTHS_FR=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// Mapping company_id → row index (0-based) dans LEADS-ENTRANTS_2026
var STATS_COMPANY_ROWS={
  "c2":2,"c3":16,"c4":30,"c5":56,"c6":70,"c7":84,"c8":98,"c9":112,
  "c10":126,"c11":140,"c12":154,"c13":168,
  "c14":196,"c15":224,"c16":238,"c17":252,
  "c19":294,"c20":308,"c21":336
};
// Lignes totaux réseau (0-based), chaque source sur une ligne consécutive
var STATS_NETWORK_ROWS={
  "renovation":183, // row 184 = TOTAL DEVIS SITE ATM, puis +1 par source
  "humidite":351    // row 352 = TOTAL DEVIS SITE MH
};

function parseExcelStatsFile(buffer,companies){
  return new Promise(function(resolve,reject){
    function doWork(XLSX){
      try{
        var data=new Uint8Array(buffer);
        var wb=XLSX.read(data,{type:"array"});
        var ws=wb.Sheets["LEADS-ENTRANTS_2026"];
        if(!ws){reject(new Error("Onglet 'LEADS-ENTRANTS_2026' introuvable"));return;}
        var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});
        var result={};
        function lab(v){return String(v==null?"":v).replace(/\s+/g," ").trim().toLowerCase();}
        // Détection par libellés (robuste si des lignes sont ajoutées dans le fichier)
        var blockStart={};
        rows.forEach(function(r,i){var nx=rows[i+1];if(r&&nx&&lab(nx[0]).indexOf("source de contact")===0&&lab(r[0])&&blockStart[lab(r[0])]===undefined)blockStart[lab(r[0])]=i;});
        var netStart={};
        rows.forEach(function(r,i){var m=lab(r&&r[0]).match(/^total devis site (atm|mh)\b/);if(m&&netStart[m[1]]===undefined)netStart[m[1]]=i;});
        // Parse société data
        companies.forEach(function(co){
          var startRow=blockStart[lab(co.name)];
          if(startRow===undefined)startRow=STATS_COMPANY_ROWS[co.id];
          if(startRow===undefined)return;
          var coData={};
          STATS_SOURCES.forEach(function(src,si){
            var srcRow=rows[startRow+2+si];
            if(!srcRow)return;
            var monthly={};
            STATS_MONTHS.forEach(function(m,mi){
              var val=srcRow[mi+1];
              monthly[m]=typeof val==="number"?Math.round(val):0;
            });
            coData[src]=monthly;
          });
          result[co.id]=coData;
        });
        // Parse totaux réseau
        Object.keys(STATS_NETWORK_ROWS).forEach(function(network){
          var startRow=netStart[network==="renovation"?"atm":"mh"];
          if(startRow===undefined)startRow=STATS_NETWORK_ROWS[network];
          var netData={};
          STATS_SOURCES.forEach(function(src,si){
            var srcRow=rows[startRow+si];
            if(!srcRow)return;
            var monthly={};
            STATS_MONTHS.forEach(function(m,mi){
              var val=srcRow[mi+1];
              monthly[m]=typeof val==="number"?Math.round(val):0;
            });
            netData[src]=monthly;
          });
          result["network_"+network]=netData;
        });
        resolve(result);
      }catch(e){reject(e);}
    }
    // Load SheetJS from CDN if not available
    if(typeof window.XLSX!=="undefined"){doWork(window.XLSX);return;}
    var script=document.createElement("script");
    script.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload=function(){doWork(window.XLSX);};
    script.onerror=function(){reject(new Error("Impossible de charger la librairie XLSX"));};
    document.head.appendChild(script);
  });
}

// ── Admin : upload Excel stats ────────────────────────────────────────────────
function LeadsStatsAdminView(props){
  var companies=props.companies;
  var [uploading,setUploading]=useState(false);
  var [msg,setMsg]=useState(null);
  var [annee,setAnnee]=useState("2026");
  var fileRef=useRef();

  async function handleFile(e){
    var f=e.target.files[0];if(!f)return;
    setUploading(true);setMsg(null);
    try{
      var buffer=await f.arrayBuffer();
      var parsed=await parseExcelStatsFile(buffer,companies);
      var rows=[];
      Object.keys(parsed).forEach(function(coId){
        var coData=parsed[coId];
        STATS_SOURCES.forEach(function(src){
          var monthly=coData[src]||{};
          rows.push({
            id:"ls_"+coId+"_"+annee+"_"+src.replace(/[^a-z0-9]/gi,"_").toLowerCase(),
            company_id:coId,annee:parseInt(annee),source:src,
            janvier:monthly.janvier||0,fevrier:monthly.fevrier||0,mars:monthly.mars||0,
            avril:monthly.avril||0,mai:monthly.mai||0,juin:monthly.juin||0,
            juillet:monthly.juillet||0,aout:monthly.aout||0,septembre:monthly.septembre||0,
            octobre:monthly.octobre||0,novembre:monthly.novembre||0,decembre:monthly.decembre||0,
            updated_at:new Date().toISOString()
          });
        });
      });      // Upsert all rows
      var batchSize=50;
      for(var i=0;i<rows.length;i+=batchSize){
        var batch=rows.slice(i,i+batchSize);
        var r=await fetch(SUPABASE_URL+"/rest/v1/leads_stats",{method:"POST",headers:Object.assign({},HEADERS,{"Prefer":"resolution=merge-duplicates,return=minimal"}),body:JSON.stringify(batch)});
        if(!r.ok)throw new Error(await r.text());
      }
      setMsg({type:"ok",text:"✓ "+rows.length+" lignes importées pour "+Object.keys(parsed).length+" sociétés ("+annee+")"});
    }catch(err){setMsg({type:"error",text:"Erreur : "+err.message});}
    setUploading(false);e.target.value="";
  }

  return React.createElement("div",null,
    React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",padding:20,marginBottom:16}},
      React.createElement("div",{style:{fontWeight:500,fontSize:15,marginBottom:14}},"📊 Import Stats Leads"),
      React.createElement("div",{style:{fontSize:13,color:"var(--color-text-secondary)",marginBottom:16}},"Importez le fichier Excel annuel — les données de toutes les sociétés seront mises à jour automatiquement."),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}},
        React.createElement("span",{style:{fontSize:13,color:"var(--color-text-secondary)"}},"Année :"),
        React.createElement("select",{value:annee,onChange:function(e){setAnnee(e.target.value);},style:Object.assign({},inp,{padding:"6px 10px"})},
          ["2024","2025","2026","2027"].map(function(y){return React.createElement("option",{key:y,value:y},y);})
        )
      ),
      msg&&React.createElement("div",{style:{padding:"10px 14px",borderRadius:8,background:msg.type==="ok"?"#EAF3DE":"#FCEBEB",color:msg.type==="ok"?"#27500A":"#791F1F",marginBottom:14,fontSize:13}},msg.text),
      React.createElement("input",{type:"file",accept:".xlsx,.xls",ref:fileRef,onChange:handleFile,style:{display:"none"}}),
      React.createElement("button",{onClick:function(){if(!uploading)fileRef.current.click();},disabled:uploading,style:{padding:"9px 20px",borderRadius:8,border:"none",background:"#185FA5",color:"#fff",fontWeight:500,fontSize:14,cursor:uploading?"not-allowed":"pointer",opacity:uploading?0.7:1}},uploading?"Import en cours…":"⬆ Choisir le fichier Excel"),
      React.createElement("div",{style:{marginTop:12,fontSize:12,color:"var(--color-text-secondary)"}},"Format attendu : fichier avec l'onglet 'LEADS-ENTRANTS_2026' (même structure que votre tableau actuel)")
    )
  );
}

// ── Vue société : stats leads ─────────────────────────────────────────────────
function LeadsStatsView(props){
  var company=props.company,net=props.net;
  var [stats,setStats]=useState(null);
  var [netStats,setNetStats]=useState(null);
  var [loading,setLoading]=useState(true);
  var [annee,setAnnee]=useState("2026");
  var [viewMode,setViewMode]=useState("societe"); // "societe" or "reseau"

  useEffect(function(){
    setLoading(true);
    var networkKey="network_"+company.network;
    Promise.all([
      dbSelect("leads_stats","company_id=eq."+company.id+"&annee=eq."+annee+"&order=source.asc"),
      dbSelect("leads_stats","company_id=eq."+networkKey+"&annee=eq."+annee+"&order=source.asc")
    ]).then(function(results){
      setStats(results[0]||[]);
      setNetStats(results[1]||[]);
      setLoading(false);
    }).catch(function(){setStats([]);setNetStats([]);setLoading(false);});
  },[company.id,company.network,annee]);

  function renderTable(data,title,color,light){
    var grandTotal={};STATS_MONTHS.forEach(function(m){grandTotal[m]=0;});
    var fixedRows=STATS_SOURCES.map(function(src,si){
      var row=(data||[]).find(function(r){return r.source===src;})||{};
      var total=STATS_MONTHS.reduce(function(s,m){return s+(row[m]||0);},0);
      STATS_MONTHS.forEach(function(m){grandTotal[m]+=(row[m]||0);});
      return React.createElement("tr",{key:src,style:{borderBottom:"1px solid var(--color-border-tertiary)",background:si%2===0?"transparent":"var(--color-background-secondary)"}},
        React.createElement("td",{style:{padding:"9px 14px",fontWeight:500,fontSize:13}},src),
        STATS_MONTHS.map(function(m){var v=row[m]||0;return React.createElement("td",{key:m,style:{padding:"9px 10px",textAlign:"center",color:v>0?color:"var(--color-text-tertiary)",fontWeight:v>0?500:400}},v>0?v:"—");}),
        React.createElement("td",{style:{padding:"9px 14px",textAlign:"center",fontWeight:700,color:total>0?color:"var(--color-text-tertiary)"}},total>0?total:"—")
      );
    });
    var gt=STATS_MONTHS.reduce(function(s,m){return s+(grandTotal[m]||0);},0);
    var totalRow=React.createElement("tr",{key:"total",style:{background:light||net.light,borderTop:"2px solid "+color}},
      React.createElement("td",{style:{padding:"10px 14px",fontWeight:700,color:color}},"TOTAL"),
      STATS_MONTHS.map(function(m){var v=grandTotal[m]||0;return React.createElement("td",{key:m,style:{padding:"10px 10px",textAlign:"center",fontWeight:700,color:color}},v>0?v:"—");}),
      React.createElement("td",{style:{padding:"10px 14px",textAlign:"center",fontWeight:700,color:color}},gt>0?gt:"—")
    );
    return React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",overflowX:"auto"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:900}},
        React.createElement("thead",null,React.createElement("tr",{style:{background:"var(--color-background-secondary)",fontSize:11,color:"var(--color-text-secondary)"}},
          React.createElement("th",{style:{padding:"8px 14px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"Source"),
          STATS_MONTHS_FR.map(function(m){return React.createElement("th",{key:m,style:{padding:"8px 10px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}},m.slice(0,3)+".");}),
          React.createElement("th",{style:{padding:"8px 14px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"Total")
        )),
        React.createElement("tbody",null,fixedRows.concat([totalRow]))
      )
    );
  }

  function exportPDF(data,title){
    var grandTotal={};STATS_MONTHS.forEach(function(m){grandTotal[m]=0;});
    var html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+title+' — '+annee+'</title>'
      +'<style>*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}body{padding:28px;color:#1a1a18}'
      +'.title{font-size:18px;font-weight:700;color:'+net.color+';margin-bottom:4px}'
      +'.subtitle{font-size:12px;color:#666;margin-bottom:20px}'
      +'table{width:100%;border-collapse:collapse;font-size:11px}'
      +'th{background:'+net.color+';color:#fff;padding:7px 10px;text-align:center;white-space:nowrap}'
      +'th.left{text-align:left}td{padding:7px 10px;border-bottom:1px solid #eee;text-align:center}'
      +'td.src{text-align:left;font-weight:500}td.tot{font-weight:700;color:'+net.color+'}'
      +'.total-row td{background:'+net.light+';font-weight:700;color:'+net.color+';border-top:2px solid '+net.color+'}'
      +'@media print{body{padding:16px}}</style></head><body>'
      +'<div class="title">📊 '+title+'</div>'
      +'<div class="subtitle">Année '+annee+' · Généré le '+new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})+'</div>'
      +'<table><thead><tr><th class="left">Source</th>'
      +STATS_MONTHS_FR.map(function(m){return'<th>'+m.slice(0,3)+'</th>';}).join("")+'<th>Total</th></tr></thead><tbody>';
    STATS_SOURCES.forEach(function(src){
      var row=(data||[]).find(function(r){return r.source===src;})||{};
      var rowTotal=0;
      html+='<tr><td class="src">'+src+'</td>';
      STATS_MONTHS.forEach(function(m){var v=row[m]||0;rowTotal+=v;grandTotal[m]+=v;html+='<td>'+(v>0?v:"—")+'</td>';});
      html+='<td class="tot">'+rowTotal+'</td></tr>';
    });
    var gt=STATS_MONTHS.reduce(function(s,m){return s+(grandTotal[m]||0);},0);
    html+='<tr class="total-row"><td>TOTAL</td>';
    STATS_MONTHS.forEach(function(m){html+='<td>'+(grandTotal[m]||0)+'</td>';});
    html+='<td>'+gt+'</td></tr></tbody></table></body></html>';
    var w=window.open("","_blank","width=1000,height=700");w.document.write(html);w.document.close();w.focus();setTimeout(function(){w.print();},400);
  }

  if(loading)return React.createElement("div",{style:{padding:40,textAlign:"center",color:"var(--color-text-secondary)"}},"Chargement…");

  var currentData=viewMode==="reseau"?netStats:stats;
  var currentTitle=viewMode==="reseau"?"Stats Réseau "+NETWORKS[company.network].label:"Stats Leads — "+company.name;
  var hasData=currentData&&currentData.length>0;

  var isNet=viewMode==="reseau",accent=isNet?"#0d2c4d":net.color,accentLight=isNet?"#E8EEF6":net.light;
  return React.createElement("div",{style:{padding:0}},
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}},
        React.createElement("div",{style:{fontWeight:700,fontSize:16,color:"#12263f"}},"📊 Contacts entrants"),
        React.createElement("select",{value:annee,onChange:function(e){setAnnee(e.target.value);},style:Object.assign({},inp,{padding:"7px 10px",fontSize:13})},
          ["2024","2025","2026"].map(function(y){return React.createElement("option",{key:y,value:y},y);})
        ),
        React.createElement("div",{style:{display:"flex",gap:4,background:"#fff",border:"1px solid #e3e8ef",borderRadius:12,padding:4}},
          [["societe","🏢 Ma société · "+company.name],["reseau","🌐 Réseau "+NETWORKS[company.network].label+" (toutes sociétés)"]].map(function(item){
            var active=viewMode===item[0],c=item[0]==="reseau"?"#0d2c4d":net.color;
            return React.createElement("button",{key:item[0],onClick:function(){setViewMode(item[0]);},style:{padding:"7px 14px",borderRadius:9,border:"none",background:active?c:"transparent",color:active?"#fff":"#5b6573",fontSize:13,cursor:"pointer",fontWeight:active?600:500}},item[1]);
          })
        )
      ),
      hasData&&React.createElement("button",{onClick:function(){exportPDF(currentData,currentTitle);},style:{padding:"8px 16px",borderRadius:10,border:"1px solid "+accent,background:accentLight,color:accent,fontSize:13,cursor:"pointer",fontWeight:600}},"📄 Exporter PDF")
    ),
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderRadius:12,background:accentLight,borderLeft:"4px solid "+accent,color:accent,fontSize:13.5,marginBottom:14}},
      React.createElement("span",{style:{fontSize:18}},isNet?"🌐":"🏢"),
      React.createElement("span",null,isNet?React.createElement("span",null,React.createElement("b",null,"Chiffres de tout le réseau "+NETWORKS[company.network].label),", toutes sociétés confondues — ce ne sont pas les contacts de ",company.name,"."):React.createElement("span",null,React.createElement("b",null,"Contacts de "+company.name+" uniquement"),". Pour comparer avec l'ensemble du réseau, choisissez « Réseau »."))),
    !hasData
      ? React.createElement("div",{style:{padding:40,textAlign:"center",background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",color:"var(--color-text-secondary)"}},
          React.createElement("div",{style:{fontSize:28,marginBottom:10}},"📊"),
          React.createElement("div",{style:{fontWeight:500,marginBottom:4}},"Aucune donnée pour "+annee),
          React.createElement("div",{style:{fontSize:13}},"L'administrateur n'a pas encore importé le fichier de statistiques.")
        )
      : renderTable(currentData,currentTitle,accent,accentLight)
  );
}


var COMMERCIAL_NOTIFY={
  "c14":{email:"30mh@murhumide.fr",name:"30 MH"},
  "c19":{email:"normandie@murhumide.fr",name:"76 MH"},
  "c20":{email:"jmpochiero83@murhumide.fr",name:"83 MH"}
};

function notifyCommercialLogin(companyId,commercialNom){
  var cfg=COMMERCIAL_NOTIFY[companyId];
  if(!cfg)return;
  fetch("/api/notify-commercial",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commercialNom:commercialNom,companyName:cfg.name,companyEmail:cfg.email,loginAt:new Date().toLocaleString("fr-FR")})}).catch(function(){});
}
var GSHEET_ID="1HdDhcTlUtw5LK_k69mPB8hdeFU4-kOhy6Fl_4QZAumg";
var GSHEET_API_KEY="AIzaSyBHhvGkHOiPQLAOK2n-5xCZwCGShS67il8";
// Mapping onglet Google Sheet → company_id
// À compléter avec les vrais noms d'onglets
var GSHEET_TAB_MAP={
  "13ATM":"c2",
  "52 ATM":"c5",
  "14 ATM":"c3",
  "30 MH":"c14",
  "60 ATM":"c7",
  "76 MH":"c19",
  "83 MH":"c20",
  "94 ATM":"c12"
};

async function fetchGSheetTab(tabName){
  var url="https://sheets.googleapis.com/v4/spreadsheets/"+GSHEET_ID
    +"/values/"+encodeURIComponent(tabName)
    +"?key="+GSHEET_API_KEY;
  var r=await fetch(url);
  if(!r.ok)throw new Error("Erreur lecture onglet '"+tabName+"' : "+await r.text());
  var data=await r.json();
  return data.values||[];
}

function parseGSheetRows(rows){
  if(rows.length<2)return[];
  var headers=rows[0].map(function(h){return(h||"").toLowerCase().trim();});
  function idx(){var keys=Array.prototype.slice.call(arguments);return headers.findIndex(function(h){return keys.some(function(k){return h===k||h.includes(k);});});}
  // Colonnes exactes du Sheet Facebook
  var iFullName=idx("full_name","full name","nom complet","nom");
  var iFirst=idx("first_name","prenom","prénom","first name");
  var iLast=idx("last_name","lastname","nom de famille","last name");
  var iPhone=idx("phone_number","phone","telephone","téléphone","mobile");
  var iEmail=idx("email","mail","e-mail");
  var iZip=idx("post_code","post code","code_postal","code postal","zip","postal","cp");
  var iCity=idx("ville","city");
  var iDate=idx("created_time","date","heure","soumis");
  var iCampaign=idx("campaign_name","campagne","campaign","ad_name","publicite");
  var iMessage=idx("quel_est_votre_projet_?","message","commentaire","projet");
  return rows.slice(1).map(function(row,i){
    function g(j){return(j>=0&&j<row.length)?(row[j]||"").toString().trim():"";}
    var fn="",ln="";
    if(iFullName>=0&&g(iFullName)){
      var pts=g(iFullName).split(/\s+/);
      fn=pts[0]||"";ln=pts.slice(1).join(" ")||"";
    } else {
      fn=g(iFirst);ln=g(iLast);
    }
    var phone=g(iPhone).replace(/^p:/i,"").trim();
    var email=g(iEmail);
    var zip=g(iZip).replace(/^[a-z]:/i,"").trim();
    if(!fn&&!phone&&!email)return null;
    return{
      id:"l_"+Date.now()+"_"+i+"_"+Math.random().toString(36).slice(2,6),
      firstName:fn||"—",lastName:ln,
      email:email,phone:phone,
      address:"",city:g(iCity),zip:zip,
      message:g(iMessage),
      campaign:g(iCampaign),
      importedAt:g(iDate)||new Date().toLocaleString("fr-FR"),
      status:"nouveau",note:"",source:"Facebook",
      companyId:null,importId:null,importLabel:null
    };
  }).filter(Boolean);
}
function CARow(props){
  var comm=props.comm,color=props.color,initialValue=props.initialValue;
  var [val,setVal]=useState(initialValue||"");
  var [saved,setSaved]=useState(false);
  var [saving,setSaving]=useState(false);
  var [error,setError]=useState("");
  useEffect(function(){setVal(initialValue||"");setSaved(false);setError("");},[initialValue,comm.id]);
  function save(){
    var n=parseMontant(val);setVal(String(n));setSaving(true);setError("");
    props.onSave(n,function(ok,err){setSaving(false);if(ok){setSaved(true);setTimeout(function(){setSaved(false);},2000);}else{setError(err||"Erreur");}});
  }
  return React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid var(--color-border-tertiary)",flexWrap:"wrap"}},
    React.createElement("div",{style:{flex:2,minWidth:140}},
      React.createElement("div",{style:{fontWeight:500,fontSize:13}},comm.nom),
      React.createElement("span",{style:{fontSize:11,padding:"1px 7px",borderRadius:8,background:comm.role==="gerant"?"#FAEEDA":"var(--color-background-secondary)",color:comm.role==="gerant"?"#BA7517":"var(--color-text-secondary)"}},comm.role==="gerant"?"Gérant":"Commercial")
    ),
    React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4,flex:1,minWidth:200}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,width:"100%"}},
        React.createElement("input",{value:val,onChange:function(e){setVal(e.target.value);setSaved(false);setError("");},onKeyDown:function(e){if(e.key==="Enter")save();},placeholder:"Montant en € (ex: 20000)",style:Object.assign({},inp,{flex:1})}),
        React.createElement("button",{onClick:save,disabled:saving,style:{padding:"6px 14px",borderRadius:7,border:"none",background:saved?"#27500A":saving?"#888":color,color:"#fff",fontSize:12,cursor:saving?"not-allowed":"pointer",fontWeight:500,whiteSpace:"nowrap"}},saved?"✓ Sauvegardé":saving?"…":"Enregistrer")
      ),
      error&&React.createElement("div",{style:{fontSize:11,color:"#A32D2D"}},error)
    ),
    React.createElement("button",{onClick:props.onDelete,style:{padding:"5px 8px",borderRadius:6,border:"1px solid #F7C1C1",background:"transparent",color:"#A32D2D",fontSize:12,cursor:"pointer"}},"🗑")
  );
}

function CAView(props){
  var company=props.company,net=NETWORKS[company.network],companies=props.companies||INIT_COMPANIES;
  var [commerciaux,setCommerciaux]=useState(null);
  var [caData,setCaData]=useState([]);
  var [globalCA,setGlobalCA]=useState({});
  var [allCaByCompany,setAllCaByCompany]=useState({});
  var [loadError,setLoadError]=useState("");
  var [moisSel,setMoisSel]=useState(function(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");});
  var [newNom,setNewNom]=useState("");
  var [newRole,setNewRole]=useState("commercial");
  var [moisDebut,setMoisDebut]=useState(function(){var d=new Date();d.setMonth(d.getMonth()-5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");});
  var [moisFin,setMoisFin]=useState(function(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");});
  var moisListAll=getMoisListSince(2024,1);
  var moisList=useMemo(function(){return moisListAll.filter(function(m){return m>=moisDebut&&m<=moisFin;});},[moisListAll,moisDebut,moisFin]);

  useEffect(function(){
    var cancelled=false;
    async function load(){
      try{
        var comms=await dbSelect("commerciaux","company_id=eq."+company.id+"&order=created_at.asc");
        var ca=await dbSelect("ca_facture","company_id=eq."+company.id);
        var allCa=await dbSelect("ca_facture","select=company_id,mois,montant");
        var glo={},networkIds={},byCompany={};
        INIT_COMPANIES.filter(function(c){return c.network===company.network;}).forEach(function(c){networkIds[c.id]=true;});
        (allCa||[]).forEach(function(c){
          var m=c.mois;
          if(!byCompany[c.company_id])byCompany[c.company_id]={};
          if(!byCompany[c.company_id][m])byCompany[c.company_id][m]=0;
          byCompany[c.company_id][m]+=(parseFloat(c.montant)||0);
          if(networkIds[c.company_id]){if(!glo[m])glo[m]=0;glo[m]+=(parseFloat(c.montant)||0);}
        });
        if(!cancelled){setCommerciaux(comms||[]);setCaData(ca||[]);setGlobalCA(glo);setAllCaByCompany(byCompany);}
      }catch(e){if(!cancelled)setLoadError(e.message||"Erreur chargement");}
    }
    load();
    return function(){cancelled=true;};
  },[company.id]);

  async function addCommercial(){
    if(!newNom.trim())return;
    var row={id:"comm_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:company.id,nom:newNom.trim(),role:newRole};
    setCommerciaux(function(prev){return (prev||[]).concat(row);});setNewNom("");
    try{await dbInsertOne("commerciaux",row);}catch(e){setCommerciaux(function(prev){return (prev||[]).filter(function(c){return c.id!==row.id;});});}
  }
  async function deleteCommercial(id){
    if(!window.confirm("Supprimer ce commercial ?"))return;
    setCommerciaux(function(prev){return (prev||[]).filter(function(c){return c.id!==id;});});
    setCaData(function(prev){return prev.filter(function(c){return c.commercial_id!==id;});});
    try{await dbDelete("commerciaux","id=eq."+id);await dbDelete("ca_facture","commercial_id=eq."+id);}catch(e){}
  }
  async function saveCA(commercialId,commercialNom,montant,cb){
    var existing=caData.find(function(c){return c.commercial_id===commercialId&&c.mois===moisSel;});
    if(existing){
      setCaData(function(prev){return prev.map(function(c){return c.id===existing.id?Object.assign({},c,{montant:montant}):c;});});
      setGlobalCA(function(prev){var oldVal=parseFloat(existing.montant)||0;var diff=montant-oldVal;var r=Object.assign({},prev);r[moisSel]=(r[moisSel]||0)+diff;return r;});
      try{await dbUpdate("ca_facture","id=eq."+existing.id,{montant:montant});cb(true);}catch(e){cb(false,e.message);}
    } else {
      var row={id:"ca_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:company.id,commercial_id:commercialId,commercial_nom:commercialNom,mois:moisSel,montant:montant};
      setCaData(function(prev){return prev.concat(row);});
      setGlobalCA(function(prev){var r=Object.assign({},prev);r[moisSel]=(r[moisSel]||0)+montant;return r;});
      try{await dbInsertOne("ca_facture",row);cb(true);}
      catch(e){setCaData(function(prev){return prev.filter(function(c){return c.id!==row.id;});});setGlobalCA(function(prev){var r=Object.assign({},prev);r[moisSel]=(r[moisSel]||0)-montant;return r;});cb(false,e.message);}
    }
  }

  var caForMois=useMemo(function(){return caData.filter(function(c){return c.mois===moisSel;});},[caData,moisSel]);
  var totalSociete=caForMois.reduce(function(s,c){return s+(parseFloat(c.montant)||0);},0);

  if(commerciaux===null)return React.createElement("div",{style:{padding:40,textAlign:"center",color:"var(--color-text-secondary)"}},"Chargement…");
  if(loadError)return React.createElement("div",{style:{padding:40,textAlign:"center",color:"#A32D2D",fontSize:13}},loadError);

  return React.createElement("div",{style:{padding:0}},
    React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",padding:20,marginBottom:20}},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}},
        React.createElement("div",{style:{fontWeight:500,fontSize:15}},"📈 CA Global Réseau"),
        React.createElement("button",{onClick:function(){
          var networkCompanies=companies.filter(function(c){return c.network===company.network;}).map(function(c){var monthlyCA=moisList.map(function(m){return(allCaByCompany[c.id]&&allCaByCompany[c.id][m])||0;});var total=monthlyCA.reduce(function(s,v){return s+v;},0);return{c:c,monthlyCA:monthlyCA,total:total};}).sort(function(a,b){return b.total!==a.total?b.total-a.total:a.c.name.localeCompare(b.c.name);});
          var medals=["🥇","🥈","🥉"];
          var html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>Palmarès CA — '+net.label+'</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}body{padding:32px;color:#1a1a18}.title{font-size:20px;font-weight:700;color:'+net.color+';margin-bottom:4px}.subtitle{font-size:13px;color:#666;margin-bottom:24px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:'+net.color+';color:#fff;padding:9px 12px;text-align:center}th.left{text-align:left}td{padding:9px 12px;border-bottom:1px solid #eee;text-align:center}td.left{text-align:left}td.me{background:'+net.light+';font-weight:700;color:'+net.color+'}.total-row td{background:'+net.color+';color:#fff;font-weight:700;border:none}.footer{margin-top:24px;font-size:11px;color:#aaa;text-align:right}@media print{body{padding:16px}}</style></head><body><div class="title">🏆 Palmarès CA — '+net.label+'</div><div class="subtitle">6 derniers mois · '+new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})+'</div><table><thead><tr><th style="width:40px">#</th><th class="left">Société</th>'+moisList.map(function(m){return'<th style="text-transform:capitalize">'+fmtMois(m)+'</th>';}).join("")+'<th>Total</th></tr></thead><tbody>';
          networkCompanies.forEach(function(item,rank){var isMe=item.c.id===company.id;var medal=medals[rank]||(rank+1);var cls=isMe?' class="me"':"";html+='<tr><td'+cls+'>'+medal+'</td><td class="left'+(isMe?" me":"")+'">'+(isMe?"★ ":"")+item.c.name+'</td>';item.monthlyCA.forEach(function(ca){html+='<td'+cls+'>'+(ca>0?fmtCA(ca):"—")+'</td>';});html+='<td'+cls+'>'+(item.total>0?fmtCA(item.total):"—")+'</td></tr>';});
          html+='</tbody><tfoot><tr class="total-row"><td colspan="2">TOTAL RÉSEAU</td>'+moisList.map(function(m){return'<td>'+fmtCA(globalCA[m]||0)+'</td>';}).join("")+'<td>'+fmtCA(Object.values(globalCA).reduce(function(s,v){return s+v;},0))+'</td></tr></tfoot></table></body></html>';
          var w=window.open("","_blank","width=900,height=650");w.document.write(html);w.document.close();w.focus();setTimeout(function(){w.print();},400);
        },style:{padding:"6px 12px",borderRadius:7,border:"1px solid "+net.color,background:net.light,color:net.color,fontSize:12,cursor:"pointer",fontWeight:500,whiteSpace:"nowrap"}},"📄 Exporter palmarès PDF")
      ),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}},
        React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"De :"),
        React.createElement("select",{value:moisDebut,onChange:function(e){setMoisDebut(e.target.value);},style:Object.assign({},inp,{padding:"5px 8px",textTransform:"capitalize",fontSize:12})},moisListAll.map(function(m){return React.createElement("option",{key:m,value:m},fmtMois(m));})),
        React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"À :"),
        React.createElement("select",{value:moisFin,onChange:function(e){setMoisFin(e.target.value);},style:Object.assign({},inp,{padding:"5px 8px",textTransform:"capitalize",fontSize:12})},moisListAll.map(function(m){return React.createElement("option",{key:m,value:m},fmtMois(m));}))
      ),
      React.createElement("div",{style:{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}},
        moisList.map(function(m){var total=globalCA[m]||0;var isCurrent=m===moisSel;return React.createElement("div",{key:m,style:{flex:1,minWidth:120,background:isCurrent?net.light:"var(--color-background-secondary)",borderRadius:8,padding:"12px 14px",border:"1px solid "+(isCurrent?net.color:"var(--color-border-tertiary)")}},React.createElement("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4,textTransform:"capitalize"}},fmtMois(m)),React.createElement("div",{style:{fontSize:18,fontWeight:500,color:isCurrent?net.color:"var(--color-text-primary)"}},fmtCA(total)));})
      ),
      React.createElement("div",{style:{overflowX:"auto"}},
        React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:500,fontSize:12}},
          React.createElement("thead",null,React.createElement("tr",{style:{background:"var(--color-background-secondary)",color:"var(--color-text-secondary)"}},
            React.createElement("th",{style:{padding:"7px 12px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"#"),
            React.createElement("th",{style:{padding:"7px 12px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"Société"),
            moisList.map(function(m){return React.createElement("th",{key:m,style:{padding:"7px 12px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap",textTransform:"capitalize"}},fmtMois(m));}),
            React.createElement("th",{style:{padding:"7px 12px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"Total")
          )),
          React.createElement("tbody",null,
            companies.filter(function(c){return c.network===company.network;}).map(function(c){var monthlyCA=moisList.map(function(m){return(allCaByCompany[c.id]&&allCaByCompany[c.id][m])||0;});var total=monthlyCA.reduce(function(s,v){return s+v;},0);return{c:c,monthlyCA:monthlyCA,total:total};}).sort(function(a,b){return b.total!==a.total?b.total-a.total:a.c.name.localeCompare(b.c.name);}).map(function(item,rank){
              var c=item.c,monthlyCA=item.monthlyCA,total=item.total;
              var isMe=c.id===company.id;
              var medal=rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":"";
              return React.createElement("tr",{key:c.id,style:{borderBottom:"1px solid var(--color-border-tertiary)",background:isMe?net.light:rank%2===0?"transparent":"var(--color-background-secondary)",outline:isMe?"2px solid "+net.color:"none",outlineOffset:"-1px"}},
                React.createElement("td",{style:{padding:"8px 12px",textAlign:"center",fontSize:14}},medal||(rank+1)),
                React.createElement("td",{style:{padding:"8px 12px",fontWeight:isMe?700:400,color:isMe?net.color:"var(--color-text-primary)"}},
                  React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},isMe&&React.createElement("div",{style:{width:6,height:6,borderRadius:"50%",background:net.color,flexShrink:0}}),c.name+(isMe?" (vous)":""))
                ),
                monthlyCA.map(function(ca,mi){return React.createElement("td",{key:moisList[mi],style:{padding:"8px 12px",textAlign:"center",fontWeight:ca>0?500:400,color:ca>0?net.color:"var(--color-text-tertiary)"}},ca>0?fmtCA(ca):"—");}),
                React.createElement("td",{style:{padding:"8px 12px",textAlign:"center",fontWeight:700,color:total>0?net.color:"var(--color-text-tertiary)"}},total>0?fmtCA(total):"—")
              );
            }),
            React.createElement("tr",{style:{background:"var(--color-background-secondary)",borderTop:"2px solid var(--color-border-secondary)"}},
              React.createElement("td",{style:{padding:"8px 12px"}}),
              React.createElement("td",{style:{padding:"8px 12px",fontWeight:600,fontSize:12}},"TOTAL RÉSEAU"),
              moisList.map(function(m){return React.createElement("td",{key:m,style:{padding:"8px 12px",textAlign:"center",fontWeight:600,color:net.color}},fmtCA(globalCA[m]||0));}),
              React.createElement("td",{style:{padding:"8px 12px",textAlign:"center",fontWeight:600,color:net.color}},fmtCA(Object.values(globalCA).reduce(function(s,v){return s+v;},0)))
            )
          )
        )
      )
    ),
    React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",padding:20,marginBottom:20}},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}},
        React.createElement("div",{style:{fontWeight:500,fontSize:15}},"💼 CA Facturé — "+company.name),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}},
          React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"Mois :"),
          React.createElement("select",{value:moisSel,onChange:function(e){setMoisSel(e.target.value);},style:Object.assign({},inp,{padding:"5px 10px",textTransform:"capitalize"})},
            moisListAll.slice().reverse().map(function(m){return React.createElement("option",{key:m,value:m},fmtMois(m));})
          ),
          React.createElement("button",{onClick:function(){
            var rows=commerciaux.map(function(comm){var existing=caForMois.find(function(c){return c.commercial_id===comm.id;});return{nom:comm.nom,role:comm.role,montant:existing?parseFloat(existing.montant)||0:0};});
            var moisLabel=fmtMois(moisSel);
            var html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>CA '+company.name+' — '+moisLabel+'</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}body{padding:32px;color:#1a1a18}.title{font-size:20px;font-weight:700;color:'+net.color+'}.subtitle{font-size:13px;color:#666;margin-top:4px;margin-bottom:24px;text-transform:capitalize}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:'+net.color+';color:#fff;padding:10px 14px;text-align:left;font-size:12px}th.right{text-align:right}td{padding:10px 14px;font-size:13px;border-bottom:1px solid #eee}td.right{text-align:right;font-weight:500}.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;background:#f0f0f0;color:#555}.badge.gerant{background:#FAEEDA;color:#633806}.total td{background:'+net.light+';font-weight:700;padding:12px 14px;font-size:14px;color:'+net.color+';border-bottom:none}.footer{margin-top:24px;font-size:11px;color:#aaa;text-align:right}@media print{body{padding:20px}}</style></head><body><div class="title">CA Facturé — '+company.name+'</div><div class="subtitle">'+moisLabel+'</div><table><thead><tr><th>Commercial</th><th>Rôle</th><th class="right">Montant</th></tr></thead><tbody>';
            rows.forEach(function(r){html+='<tr><td>'+r.nom+'</td><td><span class="badge'+(r.role==="gerant"?" gerant":"")+'">'+( r.role==="gerant"?"Gérant":"Commercial")+'</span></td><td class="right">'+(r.montant>0?fmtCA(r.montant):"—")+'</td></tr>';});
            html+='</tbody><tfoot><tr class="total"><td colspan="2">Total '+company.name+'</td><td class="right">'+fmtCA(rows.reduce(function(s,r){return s+r.montant;},0))+'</td></tr></tfoot></table><div class="footer">Généré le '+new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})+'</div></body></html>';
            var w=window.open("","_blank","width=800,height=600");w.document.write(html);w.document.close();w.focus();setTimeout(function(){w.print();},400);
          },style:{padding:"6px 12px",borderRadius:7,border:"1px solid "+net.color,background:net.light,color:net.color,fontSize:12,cursor:"pointer",fontWeight:500,whiteSpace:"nowrap"}},"📄 Exporter PDF")
        )
      ),
      commerciaux.length===0
        ? React.createElement("div",{style:{padding:24,textAlign:"center",color:"var(--color-text-secondary)",fontSize:13,background:"var(--color-background-secondary)",borderRadius:8}},"Ajoutez vos commerciaux ci-dessous pour saisir le CA.")
        : React.createElement("div",null,
            commerciaux.map(function(comm){var existing=caForMois.find(function(c){return c.commercial_id===comm.id;});var initVal=existing?String(existing.montant):"";return React.createElement(CARow,{key:comm.id+"-"+moisSel,comm:comm,color:net.color,initialValue:initVal,onSave:function(montant,cb){saveCA(comm.id,comm.nom,montant,cb);},onDelete:function(){deleteCommercial(comm.id);}});}),
            React.createElement("div",{style:{marginTop:12,padding:"12px 16px",background:net.light,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}},
              React.createElement("span",{style:{fontWeight:500,color:net.color,fontSize:14}},"Total "+company.name),
              React.createElement("span",{style:{fontWeight:700,fontSize:20,color:net.color}},fmtCA(totalSociete))
            )
          ),
      React.createElement("div",{style:{marginTop:16,paddingTop:16,borderTop:"1px solid var(--color-border-tertiary)"}},
        React.createElement("div",{style:{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}},"Ajouter un membre"),
        React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}},
          React.createElement("input",{value:newNom,onChange:function(e){setNewNom(e.target.value);},onKeyDown:function(e){if(e.key==="Enter")addCommercial();},placeholder:"Nom et prénom",style:Object.assign({},inp,{flex:2,minWidth:160})}),
          React.createElement("select",{value:newRole,onChange:function(e){setNewRole(e.target.value);},style:Object.assign({},inp,{flex:1,minWidth:130})},
            React.createElement("option",{value:"commercial"},"Commercial"),
            React.createElement("option",{value:"gerant"},"Gérant")
          ),
          React.createElement("button",{onClick:addCommercial,style:{padding:"7px 16px",borderRadius:8,border:"none",background:net.color,color:"#fff",fontWeight:500,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}},"+ Ajouter")
        )
      )
    )
  );
}

function CAAdminView(props){
  var companies=props.companies;
  var [allCa,setAllCa]=useState([]);var [allComm,setAllComm]=useState([]);var [loading,setLoading]=useState(true);
  var [networkSel,setNetworkSel]=useState("renovation");
  var [moisDebut,setMoisDebut]=useState(function(){var d=new Date();d.setMonth(d.getMonth()-5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");});
  var [moisFin,setMoisFin]=useState(function(){var d=new Date();d.setMonth(d.getMonth()+6);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");});
  var moisListAll=useMemo(function(){var months=[],y=2024,m=1;while(y<2028){months.push(y+"-"+String(m).padStart(2,"0"));m++;if(m>12){m=1;y++;}}return months;},[]);
  var moisList=useMemo(function(){return moisListAll.filter(function(m){return m>=moisDebut&&m<=moisFin;});},[moisListAll,moisDebut,moisFin]);
  useEffect(function(){
    setLoading(true);
    async function load(){
      try{var ca=await dbSelect("ca_facture","order=mois.asc");setAllCa(ca||[]);var comms=await dbSelect("commerciaux","order=company_id.asc,created_at.asc");setAllComm(comms||[]);}catch(e){}
      setLoading(false);
    }
    load();
  },[]);
  var netCompanies=useMemo(function(){return companies.filter(function(c){return c.network===networkSel;}).slice().sort(function(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true});});},[companies,networkSel]);
  var net=NETWORKS[networkSel];
  var globalByMois=useMemo(function(){
    var netIds={};netCompanies.forEach(function(c){netIds[c.id]=true;});
    var r={};moisList.forEach(function(m){r[m]=allCa.filter(function(c){return netIds[c.company_id]&&c.mois===m;}).reduce(function(s,c){return s+(parseFloat(c.montant)||0);},0);});
    return r;
  },[allCa,moisList,netCompanies]);
  function caForCompany(companyId,mois){return allCa.filter(function(c){return c.company_id===companyId&&c.mois===mois;}).reduce(function(s,c){return s+(parseFloat(c.montant)||0);},0);}
  var globalTotal=Object.values(globalByMois).reduce(function(s,v){return s+v;},0);
  if(loading)return React.createElement("div",{style:{padding:40,textAlign:"center",color:"var(--color-text-secondary)"}},"Chargement…");
  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}},
      React.createElement("div",{style:{display:"flex",gap:4}},
        Object.entries(NETWORKS).map(function(entry){var nk=entry[0],nv=entry[1];var active=networkSel===nk;return React.createElement("button",{key:nk,onClick:function(){setNetworkSel(nk);},style:{padding:"6px 14px",borderRadius:8,border:"1px solid "+(active?nv.color:"var(--color-border-secondary)"),background:active?nv.light:"transparent",color:active?nv.color:"var(--color-text-secondary)",fontSize:13,cursor:"pointer",fontWeight:active?500:400}},nv.label);})
      ),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginLeft:"auto",flexWrap:"wrap"}},
        React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"De :"),
        React.createElement("select",{value:moisDebut,onChange:function(e){setMoisDebut(e.target.value);},style:Object.assign({},inp,{padding:"5px 8px",textTransform:"capitalize",fontSize:12})},moisListAll.map(function(m){return React.createElement("option",{key:m,value:m},fmtMois(m));})),
        React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"À :"),
        React.createElement("select",{value:moisFin,onChange:function(e){setMoisFin(e.target.value);},style:Object.assign({},inp,{padding:"5px 8px",textTransform:"capitalize",fontSize:12})},moisListAll.map(function(m){return React.createElement("option",{key:m,value:m},fmtMois(m));})),
        React.createElement("button",{onClick:function(){props.onRefresh();},style:{padding:"6px 12px",borderRadius:7,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontSize:12,color:"var(--color-text-secondary)"}},"↻ Actualiser")
      )
    ),
    React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}},
      moisList.map(function(m){var now=new Date();var curMois=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");var isFuture=m>curMois;return React.createElement("div",{key:m,style:{flex:1,minWidth:110,background:isFuture?"var(--color-background-secondary)":"var(--color-background-primary)",borderRadius:8,padding:"10px 12px",border:"1px solid "+(isFuture?"var(--color-border-tertiary)":net.color+"44")}},React.createElement("div",{style:{fontSize:10,color:"var(--color-text-secondary)",marginBottom:3,textTransform:"capitalize"}},fmtMois(m)),React.createElement("div",{style:{fontSize:16,fontWeight:500,color:isFuture?"var(--color-text-tertiary)":net.color}},isFuture?"—":fmtCA(globalByMois[m]||0)));})
    ),
    React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",overflowX:"auto"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:600,fontSize:12}},
        React.createElement("thead",null,React.createElement("tr",{style:{background:"var(--color-background-secondary)",color:"var(--color-text-secondary)"}},
          React.createElement("th",{style:{padding:"8px 14px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"Société"),
          moisList.map(function(m){var now=new Date();var curMois=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");var isFuture=m>curMois;return React.createElement("th",{key:m,style:{padding:"8px 14px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap",textTransform:"capitalize",color:isFuture?"var(--color-text-tertiary)":"var(--color-text-secondary)"}},fmtMois(m));}),
          React.createElement("th",{style:{padding:"8px 14px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"Total")
        )),
        React.createElement("tbody",null,
          netCompanies.map(function(c,ci){
            var commsForCo=allComm.filter(function(cm){return cm.company_id===c.id;});
            var monthlyCA=moisList.map(function(m){return caForCompany(c.id,m);});
            var total=monthlyCA.reduce(function(s,v){return s+v;},0);
            var commRows=commsForCo.map(function(comm){var commMonthly=moisList.map(function(m){return allCa.filter(function(c2){return c2.commercial_id===comm.id&&c2.mois===m;}).reduce(function(s,c2){return s+(parseFloat(c2.montant)||0);},0);});var commTotal=commMonthly.reduce(function(s,v){return s+v;},0);if(commTotal===0)return null;return React.createElement("tr",{key:comm.id,style:{borderBottom:"1px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}},React.createElement("td",{style:{padding:"6px 14px 6px 28px",fontSize:12,color:"var(--color-text-secondary)"}},(comm.role==="gerant"?"👔 ":"👤 ")+comm.nom),commMonthly.map(function(ca,mi){return React.createElement("td",{key:moisList[mi],style:{padding:"6px 14px",textAlign:"center",color:"var(--color-text-secondary)"}},ca>0?fmtCA(ca):"—");}),React.createElement("td",{style:{padding:"6px 14px",textAlign:"center",color:"var(--color-text-secondary)"}},commTotal>0?fmtCA(commTotal):"—"));});
            return React.createElement(React.Fragment,{key:c.id},
              React.createElement("tr",{style:{borderBottom:"1px solid var(--color-border-tertiary)",background:ci%2===0?"transparent":"var(--color-background-secondary)"}},
                React.createElement("td",{style:{padding:"9px 14px",fontWeight:500,fontSize:13}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:net.color}}),c.name)),
                monthlyCA.map(function(ca,mi){return React.createElement("td",{key:moisList[mi],style:{padding:"9px 14px",textAlign:"center",fontWeight:ca>0?500:400,color:ca>0?net.color:"var(--color-text-tertiary)"}},ca>0?fmtCA(ca):"—");}),
                React.createElement("td",{style:{padding:"9px 14px",textAlign:"center",fontWeight:500,color:net.color}},total>0?fmtCA(total):"—")
              ),
              commRows
            );
          }),
          React.createElement("tr",{style:{background:"var(--color-background-secondary)",borderTop:"2px solid var(--color-border-secondary)"}},
            React.createElement("td",{style:{padding:"10px 14px",fontWeight:600,fontSize:13}},"TOTAL "+net.label.toUpperCase()),
            moisList.map(function(m){return React.createElement("td",{key:m,style:{padding:"10px 14px",textAlign:"center",fontWeight:600,color:net.color,fontSize:13}},globalByMois[m]>0?fmtCA(globalByMois[m]):"—");}),
            React.createElement("td",{style:{padding:"10px 14px",textAlign:"center",fontWeight:600,color:net.color,fontSize:13}},globalTotal>0?fmtCA(globalTotal):"—")
          )
        )
      )
    )
  );
}

var LOGO_SRC="data:image/jpeg;base64,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";
var DOFE_BG="linear-gradient(135deg,#0d2c4d 0%,#185FA5 55%,#3B8B35 130%)";
var DOFE_CSS="@keyframes dofePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:.85}}@keyframes dofeBar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}@keyframes dofeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}.dofe-in{animation:dofeIn .5s ease both}.dofe-inp:focus{outline:none;border-color:#185FA5!important;box-shadow:0 0 0 3px rgba(24,95,165,.15)}.dofe-btn:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}.dofe-btn{transition:all .15s}";

function LoginScreen(props){
  var onLogin=props.onLogin,companies=props.companies,mh76Commerciaux=props.mh76Commerciaux||[],mh30Commerciaux=props.mh30Commerciaux||[],mh83Commerciaux=props.mh83Commerciaux||[],atm52Commerciaux=props.atm52Commerciaux||[];
  var [login,setLogin]=useState(""),[pass,setPass]=useState(""),[err,setErr]=useState(""),[checking,setChecking]=useState(false);
  async function submit(){
    if(login===ADMIN.login&&pass===ADMIN.password){
      dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:"admin",company_name:"Administration",role:"admin",user_name:"Admin"}).catch(function(){});
      onLogin({role:"admin"});return;
    }
    if(login===MH76_ADMIN.login&&pass===MH76_ADMIN.password){
      dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:"c19",company_name:"76 MH",role:"subadmin",user_name:"Admin 76 MH"}).catch(function(){});
      onLogin({role:"mh76admin",companyId:"c19"});return;
    }
    if(login===MH30_ADMIN.login&&pass===MH30_ADMIN.password){
      dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:"c14",company_name:"30 MH",role:"subadmin",user_name:"Admin 30 MH"}).catch(function(){});
      onLogin({role:"mh30admin",companyId:"c14"});return;
    }
    if(login===ATM52_ADMIN.login&&pass===ATM52_ADMIN.password){
      dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:"c5",company_name:"52 ATM",role:"subadmin",user_name:"Admin 52 ATM"}).catch(function(){});
      onLogin({role:"atm52admin",companyId:"c5"});return;
    }
    if(login===MH83_ADMIN.login&&pass===MH83_ADMIN.password){
      dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:"c20",company_name:"83 MH",role:"subadmin",user_name:"Admin 83 MH"}).catch(function(){});
      onLogin({role:"mh83admin",companyId:"c20"});return;
    }
    var comm=mh76Commerciaux.find(function(c){return c.login===login&&c.password===pass;});
    if(!comm){setChecking(true);try{var rows=await dbSelect("mh76_commerciaux","login=eq."+encodeURIComponent(login));comm=(rows||[]).find(function(c){return c.password===pass;});}catch(e){}setChecking(false);}
    if(comm){
      dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:"c19",company_name:"76 MH",role:"commercial",user_name:comm.nom}).catch(function(){});
      notifyCommercialLogin("c19",comm.nom);
      onLogin({role:"mh76commercial",commercialId:comm.id});return;
    }
    var comm30=mh30Commerciaux.find(function(c){return c.login===login&&c.password===pass;});
    if(!comm30){setChecking(true);try{var rows30=await dbSelect("mh30_commerciaux","login=eq."+encodeURIComponent(login));comm30=(rows30||[]).find(function(c){return c.password===pass;});}catch(e){}setChecking(false);}
    if(comm30){
      dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:"c14",company_name:"30 MH",role:"commercial",user_name:comm30.nom}).catch(function(){});
      notifyCommercialLogin("c14",comm30.nom);
      onLogin({role:"mh30commercial",commercialId:comm30.id});return;
    }
    var comm52=atm52Commerciaux.find(function(c){return c.login===login&&c.password===pass;});
    if(!comm52){setChecking(true);try{var rows52=await dbSelect("atm52_commerciaux","login=eq."+encodeURIComponent(login));comm52=(rows52||[]).find(function(c){return c.password===pass;});}catch(e){}setChecking(false);}
    if(comm52){
      dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:"c5",company_name:"52 ATM",role:"commercial",user_name:comm52.nom}).catch(function(){});
      onLogin({role:"atm52commercial",commercialId:comm52.id});return;
    }
    var comm83=mh83Commerciaux.find(function(c){return c.login===login&&c.password===pass;});
    if(!comm83){setChecking(true);try{var rows83=await dbSelect("mh83_commerciaux","login=eq."+encodeURIComponent(login));comm83=(rows83||[]).find(function(c){return c.password===pass;});}catch(e){}setChecking(false);}
    if(comm83){
      dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:"c20",company_name:"83 MH",role:"commercial",user_name:comm83.nom}).catch(function(){});
      notifyCommercialLogin("c20",comm83.nom);
      onLogin({role:"mh83commercial",commercialId:comm83.id});return;
    }
    var co=companies.find(function(c){return c.login===login&&c.password===pass;});
    if(co){dbInsertOne("login_history",{id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),company_id:co.id,company_name:co.name,role:"company",user_name:co.name}).catch(function(){});onLogin({role:"company",companyId:co.id});return;}
    setErr("Identifiants incorrects.");
  }
  var lab={fontSize:11,fontWeight:500,color:"#5b6573",marginBottom:5,letterSpacing:.3,textTransform:"uppercase"};
  var fld=Object.assign({},inp,{width:"100%",boxSizing:"border-box",padding:"11px 13px",borderRadius:10,fontSize:14,background:"#fff",color:"#1a1a18",border:"1px solid #d5dbe3"});
  return React.createElement("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:DOFE_BG,padding:20,boxSizing:"border-box"}},
    React.createElement("style",null,DOFE_CSS),
    React.createElement("div",{className:"dofe-in",style:{width:"100%",maxWidth:400}},
      React.createElement("div",{style:{background:"#fff",borderRadius:18,padding:"28px 30px 24px",boxShadow:"0 20px 60px rgba(0,0,0,.35)"}},
        React.createElement("img",{src:LOGO_SRC,alt:"Dofelink",style:{display:"block",width:240,maxWidth:"80%",margin:"0 auto 16px"}}),
        React.createElement("div",{style:{height:1,background:"linear-gradient(90deg,transparent,#d5dbe3,transparent)",marginBottom:18}}),
        React.createElement("div",{style:{textAlign:"center",fontWeight:600,fontSize:20,color:"#12263f",marginBottom:4}},"Connexion à votre espace"),
        React.createElement("div",{style:{textAlign:"center",fontSize:13,color:"#6b7684",marginBottom:22}},"Suivi des leads · Atriome & MurHumide"),
        React.createElement("div",{style:{marginBottom:14}},React.createElement("div",{style:lab},"Identifiant"),React.createElement("input",{className:"dofe-inp",value:login,onChange:function(e){setLogin(e.target.value);},placeholder:"ex : atm83",autoCapitalize:"none",style:fld})),
        React.createElement("div",{style:{marginBottom:16}},React.createElement("div",{style:lab},"Mot de passe"),React.createElement("input",{className:"dofe-inp",value:pass,type:"password",placeholder:"••••••••",onChange:function(e){setPass(e.target.value);},onKeyDown:function(e){if(e.key==="Enter")submit();},style:fld})),
        err&&React.createElement("div",{style:{color:"#A32D2D",background:"#FDECEC",borderRadius:8,padding:"8px 12px",fontSize:12.5,marginBottom:14}},err),
        React.createElement("button",{className:"dofe-btn",onClick:submit,disabled:checking,style:{width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#185FA5,#2f7d3a)",color:"#fff",fontWeight:600,fontSize:15,cursor:checking?"not-allowed":"pointer",opacity:checking?0.7:1,boxShadow:"0 6px 16px rgba(24,95,165,.35)"}},checking?"Vérification…":"Se connecter")
      ),
      React.createElement("div",{style:{textAlign:"center",marginTop:16,fontSize:12,color:"rgba(255,255,255,.75)"}},"© "+new Date().getFullYear()+" Dofelink by DOFE Consulting")
    )
  );
}

function LeadPanel(props){
  var lead=props.lead,onClose=props.onClose,onSave=props.onSave,color=props.color,companyId=props.companyId;
  var statuses=getStatuses(companyId);
  var [status,setStatus]=useState(lead.status),[note,setNote]=useState(lead.note||""),[saving,setSaving]=useState(false);
  useEffect(function(){function k(e){if(e.key==="Escape")onClose();}window.addEventListener("keydown",k);return function(){window.removeEventListener("keydown",k);};},[]);
  var cur=statuses.find(function(x){return x.key===status;})||statuses[0];
  var changed=status!==lead.status||note!==(lead.note||"");
  var digits=(lead.phone||"").replace(/[^0-9]/g,""),wa=digits?(digits.charAt(0)==="0"?"33"+digits.slice(1):digits):"";
  var cardS={background:"#f6f8fb",border:"1px solid #e9edf3",borderRadius:14,padding:"12px 14px"};
  var lab={fontSize:11,fontWeight:600,color:"#6b7684",textTransform:"uppercase",letterSpacing:.4,marginBottom:6};
  function act(href,label,primary,ext){return React.createElement("a",{href:href,target:ext?"_blank":undefined,rel:ext?"noopener noreferrer":undefined,style:{flex:1,textAlign:"center",padding:"7px 8px",borderRadius:9,fontSize:12.5,fontWeight:600,textDecoration:"none",background:primary?"#0d2c4d":"#fff",color:primary?"#fff":"#0d2c4d",border:"1px solid "+(primary?"#0d2c4d":"#d9e0ea")}},label);}
  async function save(){setSaving(true);try{await onSave(lead.id,status,note);}catch(e){}onClose();}
  return React.createElement("div",{onClick:onClose,style:{position:"fixed",inset:0,background:"rgba(10,25,45,0.55)",display:"flex",justifyContent:"flex-end",zIndex:200,backdropFilter:"blur(2px)"}},
    React.createElement("style",null,"@keyframes dlSlide{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}"),
    React.createElement("div",{onClick:function(e){e.stopPropagation();},style:{background:"#fff",width:480,maxWidth:"100vw",height:"100%",display:"flex",flexDirection:"column",boxShadow:"-20px 0 60px rgba(0,0,0,.3)",animation:"dlSlide .25s ease both",color:"#1a2433"}},
      React.createElement("div",{style:{background:"linear-gradient(135deg,#0d2c4d 0%,#185FA5 140%)",padding:"18px 20px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}},
        React.createElement("div",{style:{minWidth:0}},
          React.createElement("div",{style:{fontSize:11,opacity:.7,letterSpacing:.5,textTransform:"uppercase",marginBottom:4}},"Fiche lead · reçu le "+fmtDate(lead.importedAt)),
          React.createElement("div",{style:{fontWeight:700,fontSize:20,marginBottom:8,wordBreak:"break-word"}},lead.firstName+" "+lead.lastName),
          React.createElement("span",{style:{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:600,padding:"3px 11px",borderRadius:999,background:cur.bg,color:cur.color}},React.createElement("span",{style:{width:7,height:7,borderRadius:"50%",background:cur.color}}),cur.label)),
        React.createElement("button",{onClick:onClose,title:"Fermer (Échap)",style:{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",flexShrink:0}},"✕")),
      React.createElement("div",{style:{flex:1,overflowY:"auto",padding:20}},
        React.createElement("div",{style:lab},"Coordonnées"),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}},
          React.createElement("div",{style:cardS},React.createElement("div",{style:{fontSize:12,color:"#6b7684",marginBottom:3}},"📞 Téléphone"),React.createElement("div",{style:{fontWeight:600,marginBottom:10,wordBreak:"break-all"}},lead.phone||"—"),lead.phone&&React.createElement("div",{style:{display:"flex",gap:6}},act("tel:"+lead.phone,"Appeler",true),act("https://wa.me/"+wa,"WhatsApp",false,true))),
          React.createElement("div",{style:cardS},React.createElement("div",{style:{fontSize:12,color:"#6b7684",marginBottom:3}},"✉️ E-mail"),React.createElement("div",{style:{fontWeight:600,marginBottom:10,wordBreak:"break-all",fontSize:13}},lead.email||"—"),lead.email&&React.createElement("div",{style:{display:"flex",gap:6}},act("mailto:"+lead.email,"Écrire",true)))),
        React.createElement("div",{style:Object.assign({},cardS,{marginBottom:20,display:"flex",alignItems:"center",gap:8,fontSize:13})},"📍 ",React.createElement("b",null,fmtVille(lead))),
        React.createElement("div",{style:lab},"Demande du contact"),
        React.createElement("div",{style:Object.assign({},cardS,{marginBottom:20})},
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:lead.message?10:0}},lead.source?React.createElement(SourceBadge,{source:lead.source}):React.createElement("span",{style:{color:"#9aa4b2",fontSize:12}},"Origine inconnue"),lead.campaign&&React.createElement("span",{style:{fontSize:12.5,color:"#4a5565"}},"Campagne : ",React.createElement("b",null,lead.campaign))),
          lead.message&&React.createElement("div",{style:{fontSize:13.5,fontStyle:"italic",color:"#2b3646",lineHeight:1.5,borderLeft:"3px solid #185FA5",paddingLeft:12}},"« "+lead.message+" »"),
          !lead.message&&!lead.campaign&&!lead.source&&React.createElement("div",{style:{color:"#9aa4b2",fontSize:13}},"Aucune information.")),
        React.createElement("div",{style:lab},"Statut"),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}},statuses.map(function(s){var on=status===s.key;return React.createElement("button",{key:s.key,onClick:function(){setStatus(s.key);},style:{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:12,border:"1.5px solid "+(on?s.color:"#e3e8ef"),background:on?s.bg:"#fff",color:on?s.color:"#4a5565",fontSize:13.5,cursor:"pointer",fontWeight:on?700:500,textAlign:"left",transition:"all .12s",boxShadow:on?"0 3px 10px rgba(0,0,0,.08)":"none"}},React.createElement("span",{style:{width:10,height:10,borderRadius:"50%",background:s.color,opacity:on?1:.45,flexShrink:0}}),s.label,on&&React.createElement("span",{style:{marginLeft:"auto"}},"✓"));})),
        React.createElement("div",{style:lab},"Note interne"),
        React.createElement("textarea",{value:note,onChange:function(e){setNote(e.target.value);},rows:6,placeholder:"Compte rendu d'appel, besoin du client, prochaine étape…",style:{width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid #d9e0ea",background:"#fff",color:"#1a2433",fontSize:14,lineHeight:1.5,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}),
        React.createElement("div",{style:{fontSize:11.5,color:"#9aa4b2",textAlign:"right",marginTop:4}},note.length+" caractère"+(note.length>1?"s":""))),
      React.createElement("div",{style:{padding:"14px 20px",borderTop:"1px solid #e9edf3",background:"#fff",display:"flex",gap:10}},
        React.createElement("button",{onClick:onClose,style:{padding:"12px 18px",borderRadius:12,border:"1px solid #d9e0ea",background:"#fff",cursor:"pointer",fontSize:14,color:"#4a5565",fontWeight:500}},"Annuler"),
        React.createElement("button",{onClick:save,disabled:saving,style:{flex:1,padding:"12px 18px",borderRadius:12,border:"none",background:changed?"linear-gradient(135deg,#185FA5,#2f7d3a)":"#9db4cc",color:"#fff",fontWeight:700,fontSize:15,cursor:saving?"not-allowed":"pointer",boxShadow:changed?"0 6px 16px rgba(24,95,165,.3)":"none"}},saving?"Enregistrement…":changed?"Enregistrer les modifications":"Enregistrer"))
    )
  );
}

function Avatar(props){
  var l=props.lead,pal=[["#E6F1FB","#185FA5"],["#EEEDFE","#5B50C9"],["#FCEBEB","#B03A3A"],["#E6F9F1","#0F6E56"],["#FAEEDA","#9A5B10"],["#E3F8EA","#128C7E"]];
  var ini=((l.firstName||"")[0]||"")+((l.lastName||"")[0]||"");ini=(ini||"?").toUpperCase();
  var h=0,str=(l.firstName||"")+(l.lastName||"");for(var i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))%pal.length;
  return React.createElement("div",{style:{width:34,height:34,borderRadius:"50%",background:pal[h][0],color:pal[h][1],display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}},ini);
}

function LeadsTable(props){
  var leads=props.leads,net=props.net,onPanel=props.onPanel,groupByDept=props.groupByDept,sortDesc=props.sortDesc,onToggleSort=props.onToggleSort,companyId=props.companyId;
  function renderRow(l,i){
    return React.createElement("tr",{key:l.id,className:"dl-row",style:{borderBottom:"1px solid #eef1f6"}},
      React.createElement("td",{style:{padding:"13px 14px",fontSize:12,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}},fmtDate(l.importedAt),React.createElement("div",{style:{fontSize:11,color:"var(--color-text-tertiary)"}},fmtTime(l.importedAt))),
      React.createElement("td",{style:{padding:"13px 14px",minWidth:150}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},React.createElement(Avatar,{lead:l}),React.createElement("div",{style:{fontWeight:600,color:"#1a2433"}},l.firstName+" "+l.lastName))),
      React.createElement("td",{style:{padding:"13px 14px",fontSize:13,whiteSpace:"nowrap"}},l.phone?React.createElement("a",{href:"tel:"+l.phone,style:{color:net.color,textDecoration:"none",fontWeight:500}},"📞 "+l.phone):"—"),
      React.createElement("td",{style:{padding:"13px 14px",fontSize:12,minWidth:160}},l.email?React.createElement("a",{href:"mailto:"+l.email,style:{color:"#3b4757",textDecoration:"none",wordBreak:"break-all"}},"✉️ "+l.email):React.createElement("span",{style:{color:"var(--color-text-tertiary)"}},"—")),
      React.createElement("td",{style:{padding:"13px 14px",fontSize:13}},React.createElement("div",{style:{whiteSpace:"nowrap"}},fmtVille(l))),
      React.createElement("td",{style:{padding:"13px 14px"}},React.createElement(SourceBadge,{source:l.source})),
      React.createElement("td",{style:{padding:"13px 14px"}},React.createElement(Badge,{statusKey:l.status,companyId:companyId})),
      React.createElement("td",{style:{padding:"13px 14px",fontSize:12,color:"var(--color-text-secondary)"}},"—"),
      React.createElement("td",{style:{padding:"13px 14px",fontSize:12,color:"var(--color-text-secondary)",maxWidth:140}},l.note?l.note.slice(0,50)+(l.note.length>50?"…":""):React.createElement("span",{style:{color:"var(--color-text-tertiary)"}},"—")),
      React.createElement("td",{style:{padding:"13px 14px"}},React.createElement("button",{onClick:function(){onPanel(l);},className:"dl-act",style:{padding:"6px 14px",borderRadius:9,border:"none",background:net.light,color:net.color,fontSize:12.5,cursor:"pointer",fontWeight:600}},"Gérer"))
    );
  }
  var headCols=[["Date","sort"],["Contact",null],["Téléphone",null],["Email",null],["CP / Ville",null],["Origine",null],["Statut",null],["Assigné à",null],["Note",null],["Action",null]];
  function renderHead(){
    return React.createElement("tr",{style:{background:"#f6f8fb",fontSize:11,color:"#6b7684",textTransform:"uppercase",letterSpacing:.4}},
      headCols.map(function(item){
        var isSort=item[1]==="sort";
        return React.createElement("th",{key:item[0],onClick:isSort?onToggleSort:undefined,style:{padding:"11px 14px",textAlign:"left",fontWeight:600,borderBottom:"1px solid #e9edf3",whiteSpace:"nowrap",cursor:isSort?"pointer":"default",userSelect:"none"}},
          isSort?React.createElement("span",{style:{display:"inline-flex",alignItems:"center",gap:4}},item[0],React.createElement("span",{style:{fontSize:14,color:net.color,fontWeight:700}},sortDesc?"↓":"↑")):item[0]
        );
      })
    );
  }
  function renderTable(rowList,xStyle){
    return React.createElement("div",{style:Object.assign({background:"#fff",borderRadius:14,border:"1px solid #e9edf3",overflowX:"auto",boxShadow:"0 2px 10px rgba(20,40,80,.05)"},xStyle||{})},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:900}},
        React.createElement("thead",null,renderHead()),
        React.createElement("tbody",null,rowList,leads.length===0&&React.createElement("tr",null,React.createElement("td",{colSpan:10,style:{padding:24,textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}},"Aucun lead ne correspond.")))
      )
    );
  }
  if(!groupByDept)return renderTable(leads.map(function(l,i){return renderRow(l,i);}));
  var groups={};leads.forEach(function(l){var d=(l.zip||"00").slice(0,2).toUpperCase();if(!groups[d])groups[d]=[];groups[d].push(l);});
  var depts=Object.keys(groups).sort();
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:16}},
    depts.length===0&&React.createElement("div",{style:{padding:24,textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}},"Aucun lead ne correspond."),
    depts.map(function(dept){var dl=groups[dept];return React.createElement("div",{key:dept},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8}},React.createElement("span",{style:{fontWeight:500,color:net.color,fontSize:14}},"📍 Département "+dept),React.createElement("span",{style:{fontSize:12,background:net.color,color:"#fff",borderRadius:9,padding:"1px 8px"}},dl.length+" lead"+(dl.length>1?"s":""))),renderTable(dl.map(function(l,i){return renderRow(l,i);})));})
  );
}

var SIDEBAR_CSS=".dl-side{position:sticky;top:0;height:100vh;width:240px;flex-shrink:0;background:linear-gradient(180deg,#0d2c4d 0%,#0a2038 100%);display:flex;flex-direction:column;padding:18px 14px;box-sizing:border-box;z-index:60}.dl-nav{display:flex;align-items:center;gap:12px;width:100%;padding:11px 14px;border:none;border-radius:11px;background:transparent;color:#c5d3e6;font-size:14px;cursor:pointer;text-align:left;margin-bottom:3px;transition:all .15s}.dl-nav:hover{background:rgba(255,255,255,.08);color:#fff}.dl-nav.on{background:#185FA5;color:#fff;font-weight:600;box-shadow:0 6px 16px rgba(0,0,0,.25)}.dl-admin{--color-background-primary:#fff;--color-background-secondary:#f6f8fb;--color-background-tertiary:#eef3fa;--color-border-tertiary:#e9edf3;--color-border-secondary:#d9e0ea;--color-text-secondary:#5b6573;--color-text-tertiary:#8a95a5;--color-text-primary:#1a2433}.dl-admin div[style*='border-radius: 10px'][style*='solid'],.dl-admin div[style*='border-radius: 12px'][style*='solid'],.dl-admin div[style*='border-radius: 14px'][style*='solid']{border-radius:16px!important;box-shadow:0 2px 12px rgba(20,40,80,.06);border-color:#eef1f6!important}.dl-admin table{border-collapse:collapse}.dl-admin th{text-transform:uppercase;letter-spacing:.4px;font-size:11px!important;font-weight:600!important;color:#6b7684!important;background:#f6f8fb!important}.dl-admin tbody tr{transition:background .12s}.dl-admin tbody tr:hover{background:#f6f9fd!important}.dl-admin button[style*='border-radius: 8px'],.dl-admin button[style*='border-radius: 7px'],.dl-admin button[style*='border-radius: 9px']{border-radius:10px!important}.dl-admin input:not([type=checkbox]):not([type=file]),.dl-admin select,.dl-admin textarea{border-radius:10px!important;border-color:#d9e0ea!important;background-color:#fff}.dl-admin input:focus,.dl-admin select:focus,.dl-admin textarea:focus{outline:none;border-color:#185FA5!important;box-shadow:0 0 0 3px rgba(24,95,165,.15)}.dl-admin h2,.dl-admin h3{color:#12263f}.dl-burger{display:none}@media(max-width:860px){.dl-side{position:fixed;left:0;top:0;transform:translateX(-100%);transition:transform .25s}.dl-side.open{transform:none}.dl-burger{display:inline-flex}.dl-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:55}}";

function SideNav(props){
  return React.createElement(React.Fragment,null,
    props.open&&React.createElement("div",{className:"dl-ov",onClick:props.onClose}),
    React.createElement("aside",{className:"dl-side"+(props.open?" open":"")},
      React.createElement("div",{style:{background:"#fff",borderRadius:12,padding:"8px 12px",marginBottom:22,textAlign:"center"}},React.createElement("img",{src:LOGO_SRC,alt:"Dofelink",style:{height:34,maxWidth:"100%"}})),
      React.createElement("div",{style:{flex:1,overflowY:"auto"}},props.items.map(function(t){return React.createElement("button",{key:t[0],className:"dl-nav"+(props.active===t[0]?" on":""),onClick:function(){props.onChange(t[0]);props.onClose();}},React.createElement("span",{style:{fontSize:16,width:20,textAlign:"center"}},t[1]),t[2]);})),
      React.createElement("div",{style:{fontSize:11,color:"#7f93ad",textAlign:"center",paddingTop:12}},"Dofelink · by DOFE Consulting")));
}

function CompanyDashboard(props){
  var company=props.company,net=props.net,myLeads=props.myLeads,go=props.go,onOpen=props.onOpen;
  var [per,setPer]=useState({mode:"30",from:"",to:""});
  var P=resolvePeriod(per),days=P.days;
  var [ca,setCa]=useState(null);
  useEffect(function(){if(props.hideCa)return;dbSelect("ca_facture","company_id=eq."+company.id).then(function(r){setCa(Array.isArray(r)?r:[]);}).catch(function(){setCa([]);});},[company.id]);
  var st=useMemo(function(){
    var start=P.start,prevStart=new Date(start.getTime()-days*864e5),bk=P.bk;
    var c1=[],c2=[],labels=[];for(var i=0;i<P.nb;i++){c1.push(0);c2.push(0);var dd=new Date(start.getTime()+i*bk*864e5);labels.push(dd.getDate()+"/"+(dd.getMonth()+1));}
    var cur=0,prev=0,signed=0,signedPrev=0;
    myLeads.forEach(function(l){if(l.status==="spam")return;var d=parseLeadDate(l.importedAt);if(!d)return;var day=new Date(d.getFullYear(),d.getMonth(),d.getDate());
      if(d>=start){var ix=Math.floor((day-start)/864e5);if(ix>=0&&ix<days){c1[Math.floor(ix/bk)]++;cur++;if(l.status==="signe")signed++;}}
      else if(d>=prevStart){var jx=Math.floor((day-prevStart)/864e5);if(jx>=0&&jx<days){c2[Math.floor(jx/bk)]++;prev++;if(l.status==="signe")signedPrev++;}}});
    function dl(a,b){return b>0?Math.round((a-b)/b*100):null;}
    var cnt=function(k){return myLeads.filter(function(l){return l.status===k;}).length;};
    var recent=myLeads.filter(function(l){return l.status!=="spam";}).slice().sort(function(a,b){return (parseLeadDate(b.importedAt)||0)-(parseLeadDate(a.importedAt)||0);}).slice(0,5);
    return{c1:c1,c2:c2,labels:labels,cur:cur,prev:prev,curD:dl(cur,prev),signed:signed,signedD:dl(signed,signedPrev),nw:cnt("nouveau"),rap:cnt("rappeler"),rdv:cnt("rendezvous"),cont:cnt("contacte"),recent:recent};
  },[myLeads,per.mode,per.from,per.to]);
  var caK=useMemo(function(){
    if(!ca)return null;var n=new Date(),k0=n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0"),p=new Date(n.getFullYear(),n.getMonth()-1,1),k1=p.getFullYear()+"-"+String(p.getMonth()+1).padStart(2,"0");
    var a=0,b=0;ca.forEach(function(c){var v=parseFloat(c.montant)||0;if(c.mois===k0)a+=v;else if(c.mois===k1)b+=v;});return{v:a,d:b>0?Math.round((a-b)/b*100):null};
  },[ca]);
  var card={background:"#fff",borderRadius:16,boxShadow:"0 2px 12px rgba(20,40,80,.06)",border:"1px solid #eef1f6"};
  function kpi(icon,bg,label,value,d){return React.createElement("div",{key:label,style:Object.assign({},card,{padding:"16px 18px",display:"flex",alignItems:"center",gap:14,flex:"1 1 200px",minWidth:190})},
    React.createElement("div",{style:{width:48,height:48,borderRadius:14,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}},icon),
    React.createElement("div",null,React.createElement("div",{style:{fontSize:12.5,color:"#6b7684"}},label),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}},React.createElement("span",{style:{fontSize:26,fontWeight:700,color:"#12263f",lineHeight:1.2}},value),
        d!==null&&d!==undefined&&React.createElement("span",{style:{fontSize:11.5,fontWeight:600,padding:"2px 8px",borderRadius:8,background:d>=0?"#E3F6E8":"#FDECEC",color:d>=0?"#1E7B3A":"#B03A3A"}},(d>=0?"↑ +":"↓ ")+d+" %"))));}
  function actRow(icon,label,n,bg,color,key){return React.createElement("div",{key:key,style:{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,background:"#f6f8fb",marginBottom:8}},React.createElement("span",{style:{fontSize:17}},icon),React.createElement("span",{style:{flex:1,fontWeight:600}},label),React.createElement("span",{style:{minWidth:34,textAlign:"center",padding:"3px 10px",borderRadius:999,background:bg,color:color,fontWeight:700,fontSize:13}},n));}
  var eur=function(v){return Math.round(v).toLocaleString("fr-FR")+" €";};
  return React.createElement("div",{className:"dofe-in"},
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:20}},
      React.createElement("div",null,React.createElement("div",{style:{fontSize:28,fontWeight:700,color:"#12263f"}},"Bonjour 👋"),React.createElement("div",{style:{fontSize:14.5,color:"#6b7684"}},"Voici la vue d'ensemble de votre activité – ",React.createElement("b",{style:{color:"#12263f"}},company.name))),
      React.createElement(PeriodPicker,{value:per,onChange:setPer})),
    React.createElement("div",{style:{display:"flex",gap:14,flexWrap:"wrap",marginBottom:18}},
      kpi("👥","#E6F1FB","Leads reçus",st.cur,st.curD),kpi("📞","#FAEEDA","Leads à traiter",st.nw),kpi("✅","#EEEDFE","Leads signés",st.signed,st.signedD),props.hideCa?kpi("📅","#E6F9F1","Rendez-vous",st.rdv):kpi("💶","#FDEBDD","CA facturé (mois)",caK?eur(caK.v):"…",caK?caK.d:null)),
    React.createElement("div",{style:{display:"flex",gap:16,flexWrap:"wrap",marginBottom:18}},
      React.createElement("div",{style:Object.assign({},card,{padding:20,flex:"3 1 420px",minWidth:300})},
        React.createElement("div",{style:{fontWeight:700,fontSize:16,color:"#12263f",marginBottom:6}},"Évolution des leads"),
        React.createElement("div",{style:{display:"flex",gap:18,fontSize:12.5,color:"#6b7684",marginBottom:8}},React.createElement("span",null,React.createElement("span",{style:{display:"inline-block",width:9,height:9,borderRadius:"50%",background:net.color,marginRight:6}}),"Période actuelle ("+st.cur+")"),React.createElement("span",null,React.createElement("span",{style:{display:"inline-block",width:14,borderTop:"2px dashed "+net.color,opacity:.5,marginRight:6,verticalAlign:"middle"}}),"Période précédente ("+st.prev+")")),
        React.createElement(LineChart,{data:st.c1,data2:st.c2,labels:st.labels,color:net.color})),
      React.createElement("div",{style:Object.assign({},card,{padding:20,flex:"1 1 300px",minWidth:280,display:"flex",flexDirection:"column"})},
        React.createElement("div",{style:{fontWeight:700,fontSize:16,color:"#12263f",marginBottom:14}},"🎯 Mon activité"),
        actRow("📞","À rappeler",st.rap,"#EEEDFE","#3C3489","r"),actRow("📅","Rendez-vous",st.rdv,"#E6F9F1","#0F6E56","d"),actRow("💬","Contactés",st.cont,"#FAEEDA","#633806","c"),
        React.createElement("button",{onClick:function(){go("leads");},style:{marginTop:"auto",padding:"13px 0",borderRadius:12,border:"none",background:net.color,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",boxShadow:"0 6px 16px rgba(24,95,165,.3)"}},"Voir mes leads →"))),
    React.createElement("div",{style:Object.assign({},card,{padding:20})},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}},React.createElement("div",{style:{fontWeight:700,fontSize:16,color:"#12263f"}},"🕒 Derniers leads reçus"),React.createElement("button",{onClick:function(){go("leads");},style:{background:"none",border:"none",color:net.color,fontWeight:600,cursor:"pointer",fontSize:13.5}},"Voir tous les leads ›")),
      st.recent.length===0?React.createElement("div",{style:{padding:24,textAlign:"center",color:"#9aa4b2"}},"Aucun lead pour le moment."):
      React.createElement("div",{style:{overflowX:"auto"}},React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:620}},
        React.createElement("thead",null,React.createElement("tr",{style:{background:"#f6f8fb",fontSize:11,color:"#6b7684",textTransform:"uppercase",letterSpacing:.4}},["Date","Contact","Téléphone","Source","Statut",""].map(function(h,i){return React.createElement("th",{key:i,style:{padding:"10px 14px",textAlign:"left",fontWeight:600}},h);}))),
        React.createElement("tbody",null,st.recent.map(function(l){return React.createElement("tr",{key:l.id,className:"dl-row",style:{borderBottom:"1px solid #eef1f6"}},
          React.createElement("td",{style:{padding:"12px 14px",fontSize:13,whiteSpace:"nowrap"}},fmtDate(l.importedAt)+" – "+fmtTime(l.importedAt)),
          React.createElement("td",{style:{padding:"12px 14px"}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},React.createElement(Avatar,{lead:l}),React.createElement("b",null,l.firstName+" "+l.lastName))),
          React.createElement("td",{style:{padding:"12px 14px",fontWeight:500}},l.phone?React.createElement("a",{href:"tel:"+l.phone,style:{color:net.color,textDecoration:"none"}},"📞 "+l.phone):"—"),
          React.createElement("td",{style:{padding:"12px 14px"}},React.createElement(SourceBadge,{source:l.source})),
          React.createElement("td",{style:{padding:"12px 14px"}},React.createElement(Badge,{statusKey:l.status,companyId:company.id})),
          React.createElement("td",{style:{padding:"12px 14px",textAlign:"right"}},React.createElement("button",{onClick:function(){onOpen(l);},className:"dl-act",style:{padding:"6px 14px",borderRadius:9,border:"none",background:net.light,color:net.color,fontSize:12.5,cursor:"pointer",fontWeight:600}},"Gérer")));})))))
  );
}

function CompanyView(props){
  var company=props.company,leads=props.leads,setLeads=props.setLeads,onLogout=props.onLogout,companies=props.companies||INIT_COMPANIES;
  var net=NETWORKS[company.network],statuses=getStatuses(company.id);
  var [activeTab,setActiveTab]=useState("dashboard"),[navOpen,setNavOpen]=useState(false);
  var [filter,setFilter]=useState("tous"),[search,setSearch]=useState("");
  var [dateFrom,setDateFrom]=useState(""),[dateTo,setDateTo]=useState("");
  var [panel,setPanel]=useState(null),[groupByDept,setGroupByDept]=useState(false);
  var [sortDesc,setSortDesc]=useState(true),[page,setPage]=useState(1);
  var myLeads=useMemo(function(){return leads.filter(function(l){return l.companyId===company.id;});},[leads,company.id]);
  var shown=useMemo(function(){
    var filtered=myLeads.filter(function(l){
      var matchStatus=filter==="spam"?l.status==="spam":filter==="tous"?l.status!=="spam":l.status===filter;
      var q=search.toLowerCase();
      var matchSearch=!q||[l.firstName,l.lastName,l.email,l.phone,l.city,l.zip,l.message,l.campaign].some(function(v){return(v||"").toLowerCase().includes(q);});
      var lDate=parseLeadDate(l.importedAt);
      var matchFrom=!dateFrom||!lDate||lDate>=new Date(dateFrom);
      var matchTo=!dateTo||!lDate||lDate<=new Date(dateTo+"T23:59:59");
      return matchStatus&&matchSearch&&matchFrom&&matchTo;
    });
    filtered.sort(function(a,b){var da=parseLeadDate(a.importedAt)||new Date(0),db=parseLeadDate(b.importedAt)||new Date(0);return sortDesc?db-da:da-db;});
    return filtered;
  },[myLeads,filter,search,dateFrom,dateTo,sortDesc]);
  useEffect(function(){setPage(1);},[filter,search,dateFrom,dateTo,sortDesc,groupByDept]);
  var totalPages=Math.max(1,Math.ceil(shown.length/PAGE_SIZE));
  var paginated=shown.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  var counts=useMemo(function(){var r={tous:myLeads.filter(function(l){return l.status!=="spam";}).length};statuses.forEach(function(s){r[s.key]=myLeads.filter(function(l){return l.status===s.key;}).length;});return r;},[myLeads,statuses]);
  async function saveLeadUpdate(id,status,note){await dbUpdate("leads","id=eq."+id,{status:status,note:note});setLeads(function(prev){return prev.map(function(l){return l.id===id?Object.assign({},l,{status:status,note:note}):l;});});}
  function changePage(p){if(p>=1&&p<=totalPages){setPage(p);window.scrollTo(0,0);}}
  var kpi=useMemo(function(){
    var now=new Date(),m0=new Date(now.getFullYear(),now.getMonth(),1),m1=new Date(now.getFullYear(),now.getMonth()-1,1);
    var d30=new Date(now.getTime()-30*864e5),d60=new Date(now.getTime()-60*864e5);
    var valid=myLeads.filter(function(l){return l.status!=="spam";});
    var cMonth=0,cPrev=0,c30=0,c60=0,nouveaux=0,signes=0;
    valid.forEach(function(l){var d=parseLeadDate(l.importedAt);if(l.status==="nouveau")nouveaux++;if(l.status==="signe")signes++;if(!d)return;if(d>=m0)cMonth++;else if(d>=m1)cPrev++;if(d>=d30)c30++;else if(d>=d60)c60++;});
    function delta(a,b){return b>0?Math.round((a-b)/b*100):null;}
    return{month:cMonth,monthD:delta(cMonth,cPrev),d30:c30,d30D:delta(c30,c60),nouveaux:nouveaux,rate:valid.length?Math.round(signes/valid.length*100):0,signes:signes};
  },[myLeads]);
  var card={background:"#fff",borderRadius:16,boxShadow:"0 2px 12px rgba(20,40,80,.06)",border:"1px solid #eef1f6"};
  function kpiCard(icon,bg,label,value,d,suffix){
    return React.createElement("div",{key:label,style:Object.assign({},card,{padding:"16px 18px",display:"flex",alignItems:"center",gap:14,flex:"1 1 200px",minWidth:190})},
      React.createElement("div",{style:{width:46,height:46,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}},icon),
      React.createElement("div",{style:{minWidth:0}},
        React.createElement("div",{style:{fontSize:12.5,color:"#6b7684"}},label),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}},
          React.createElement("span",{style:{fontSize:26,fontWeight:700,color:"#12263f",lineHeight:1.2}},value+(suffix||"")),
          d!==null&&d!==undefined&&React.createElement("span",{style:{fontSize:11.5,fontWeight:600,padding:"2px 8px",borderRadius:8,background:d>=0?"#E3F6E8":"#FDECEC",color:d>=0?"#1E7B3A":"#B03A3A"}},(d>=0?"↑ +":"↓ ")+d+" %"))));
  }
  var pill=function(active,color,bg){return{padding:"7px 15px",borderRadius:999,border:"1px solid "+(active?color:"#e3e8ef"),background:active?bg:"#fff",color:active?color:"#5b6573",fontSize:13,cursor:"pointer",fontWeight:active?600:400,transition:"all .15s"};};
  var ghost={padding:"8px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff",cursor:"pointer",fontSize:13,color:"#4a5565",fontWeight:500};
  var initials=company.name.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase();
  var navItems=[["dashboard","🏠","Tableau de bord"],["leads","👥","Mes leads"],["ca","💶","CA Facturé"],["stats","📊","Source de contacts"]];
  var curNav=navItems.find(function(t){return t[0]===activeTab;})||navItems[0];
  var ghost2={padding:"8px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff",cursor:"pointer",fontSize:13,color:"#4a5565",fontWeight:500};
  return React.createElement("div",{style:{minHeight:"100vh",display:"flex",background:"linear-gradient(180deg,#eef3fa 0%,#f7f9fc 40%)",fontSize:14,color:"#1a2433"}},
    React.createElement("style",null,DOFE_CSS+ADMIN_THEME_CSS+SIDEBAR_CSS+".dl-row{transition:background .12s}.dl-row:hover{background:#f6f9fd}.dl-act:hover{filter:brightness(.95)}"),
    React.createElement(SideNav,{items:navItems,active:activeTab,onChange:setActiveTab,open:navOpen,onClose:function(){setNavOpen(false);}}),
    React.createElement("div",{style:{flex:1,minWidth:0}},
      React.createElement("div",{style:{background:"rgba(255,255,255,.85)",backdropFilter:"blur(8px)",borderBottom:"1px solid #e9edf3",padding:"12px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50,gap:10,flexWrap:"wrap"}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},
          React.createElement("button",{className:"dl-burger",onClick:function(){setNavOpen(true);},style:{border:"1px solid #e3e8ef",background:"#fff",borderRadius:9,padding:"6px 11px",fontSize:16,cursor:"pointer"}},"☰"),
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff"}},React.createElement("span",{style:{width:9,height:9,borderRadius:"50%",background:net.color}}),React.createElement("span",{style:{fontWeight:600}},company.name),React.createElement("span",{style:{fontSize:11.5,background:net.light,color:net.color,padding:"2px 9px",borderRadius:999}},net.label))),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
          React.createElement("button",{onClick:function(){exportCSV(myLeads,company.name);},style:ghost2},"⬇ Exporter CSV"),
          React.createElement("button",{onClick:onLogout,style:ghost2},"Déconnexion"),
          React.createElement("div",{title:company.name,style:{width:38,height:38,borderRadius:"50%",background:net.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}},initials))),
      React.createElement("div",{className:"dl-admin",style:{maxWidth:1500,margin:"0 auto",padding:"22px 24px 40px"}},
      activeTab==="dashboard"&&React.createElement(CompanyDashboard,{company:company,net:net,myLeads:myLeads,go:setActiveTab,onOpen:function(l){setPanel(l);}}),
      React.createElement("div",{style:{display:activeTab==="ca"?"block":"none"}},React.createElement(CAView,{company:company,companies:companies})),
      React.createElement("div",{style:{display:activeTab==="stats"?"block":"none"}},React.createElement(LeadsStatsView,{company:company,net:net})),
      activeTab==="leads"&&React.createElement("div",null,
        React.createElement("div",{style:Object.assign({},card,{padding:16,marginBottom:16})},
          React.createElement("div",{style:{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:14}},
            React.createElement("input",{value:search,onChange:function(e){setSearch(e.target.value);},placeholder:"🔍  Rechercher un lead (nom, téléphone, e-mail, ville, CP…)",style:Object.assign({},inp,{flex:"2 1 260px",padding:"11px 14px",borderRadius:10,fontSize:14,border:"1px solid #e3e8ef",background:"#f8fafc"})}),
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,flex:"1 1 280px"}},
              React.createElement("span",{style:{fontSize:12.5,color:"#6b7684"}},"Du"),
              React.createElement("input",{type:"date",value:dateFrom,onChange:function(e){setDateFrom(e.target.value);},style:Object.assign({},inp,{flex:1,padding:"10px 10px",borderRadius:10,border:"1px solid #e3e8ef",background:"#f8fafc"})}),
              React.createElement("span",{style:{fontSize:12.5,color:"#6b7684"}},"au"),
              React.createElement("input",{type:"date",value:dateTo,onChange:function(e){setDateTo(e.target.value);},style:Object.assign({},inp,{flex:1,padding:"10px 10px",borderRadius:10,border:"1px solid #e3e8ef",background:"#f8fafc"})}),
              (dateFrom||dateTo)&&React.createElement("button",{onClick:function(){setDateFrom("");setDateTo("");},style:Object.assign({},ghost,{padding:"8px 10px"})},"✕")),
            React.createElement("button",{onClick:function(){setGroupByDept(function(v){return!v;});},style:Object.assign({},ghost,{borderColor:groupByDept?net.color:"#e3e8ef",background:groupByDept?net.light:"#fff",color:groupByDept?net.color:"#4a5565",whiteSpace:"nowrap"})},"📍 "+(groupByDept?"Groupé par dpt":"Grouper par dpt"))),
          React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
            React.createElement("button",{onClick:function(){setFilter("tous");},style:pill(filter==="tous",net.color,net.light)},"Tous ("+counts.tous+")"),
            statuses.map(function(s){return React.createElement("button",{key:s.key,onClick:function(){setFilter(s.key);},style:pill(filter===s.key,s.color,s.bg)},s.label+" ("+(counts[s.key]||0)+")");}))),
        myLeads.length===0
          ? React.createElement("div",{style:Object.assign({},card,{textAlign:"center",padding:60,color:"#6b7684"})},React.createElement("div",{style:{fontSize:34,marginBottom:10}},"📭"),React.createElement("div",{style:{fontWeight:600,marginBottom:4,color:"#12263f"}},"Aucun lead pour le moment"),React.createElement("div",{style:{fontSize:13}},"Les nouveaux leads apparaîtront ici dès leur arrivée."))
          : React.createElement(React.Fragment,null,React.createElement(LeadsTable,{leads:paginated,net:net,companyId:company.id,onPanel:function(l){setPanel(l);},groupByDept:groupByDept,sortDesc:sortDesc,onToggleSort:function(){setSortDesc(function(v){return!v;});}}),React.createElement(Pagination,{page:page,total:shown.length,pageSize:PAGE_SIZE,onChange:changePage,color:net.color}))
      )
      )
    ),
    panel&&React.createElement(LeadPanel,{lead:panel,color:net.color,companyId:company.id,onClose:function(){setPanel(null);},onSave:saveLeadUpdate})
  );
}

function GSheetSyncPanel(props){
  var leads=props.leads,setLeads=props.setLeads,companies=props.companies,grouped=props.grouped,setMsg=props.setMsg;
  var [syncing,setSyncing]=useState(false);
  var [progress,setProgress]=useState(null);
  var [selTabs,setSelTabs]=useState(Object.keys(GSHEET_TAB_MAP));

  async function syncAll(){
    setSyncing(true);setProgress("Connexion au Google Sheet…");
    var totalNew=0,errors=[];
    for(var i=0;i<selTabs.length;i++){
      var tabName=selTabs[i];
      var coId=GSHEET_TAB_MAP[tabName];
      var co=companies.find(function(c){return c.id===coId;});
      if(!co)continue;
      setProgress("Lecture onglet '"+tabName+"'… ("+(i+1)+"/"+selTabs.length+")");
      try{
        var rows=await fetchGSheetTab(tabName);
        var parsed=parseGSheetRows(rows);
        if(!parsed.length)continue;
        var existing=leads.filter(function(l){return l.companyId===coId;}),existingKeys={};
        existing.forEach(function(l){if(l.phone)existingKeys[l.phone.replace(/\s/g,"")]=true;if(l.email)existingKeys[l.email.toLowerCase().trim()]=true;});
        var newLeads=parsed.filter(function(l){var phone=(l.phone||"").replace(/\s/g,""),email=(l.email||"").toLowerCase().trim();if(phone&&existingKeys[phone])return false;if(email&&existingKeys[email])return false;return true;});
        if(!newLeads.length)continue;
        var importId="imp_gs_"+Date.now()+"_"+coId;
        var importLabel=co.name+" — Google Sheets Facebook — "+new Date().toLocaleString("fr-FR");
        var withCo=newLeads.map(function(l){return Object.assign({},l,{companyId:coId,importId:importId,importLabel:importLabel,source:"Facebook"});});
        await dbInsert("leads",withCo.map(leadToRow));
        setLeads(function(prev){return withCo.concat(prev);});
        totalNew+=newLeads.length;
        if(co.email){fetch("/api/notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({companyName:co.name,companyEmail:co.email,count:newLeads.length,source:"Facebook"})}).catch(function(){});}
      }catch(e){errors.push(tabName+" : "+e.message);}
    }
    setSyncing(false);setProgress(null);
    if(errors.length){setMsg({type:"error",text:"Erreurs : "+errors.join(" | ")});}
    else{setMsg({type:"ok",text:"✓ "+totalNew+" nouveau"+(totalNew>1?"x":"")+" lead"+(totalNew>1?"s":"")+" importé"+(totalNew>1?"s":"")+" depuis Google Sheets (Facebook)"+(totalNew===0?" — aucun nouveau lead trouvé":"")+"."});}
  }

  return React.createElement("div",null,
    React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)",marginBottom:10}},"Sélectionnez les onglets à synchroniser :"),
    React.createElement("div",{style:{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}},
      Object.keys(GSHEET_TAB_MAP).map(function(tab){
        var active=selTabs.indexOf(tab)>=0;
        var co=companies.find(function(c){return c.id===GSHEET_TAB_MAP[tab];});
        var nk=co?co.network:"renovation";
        return React.createElement("button",{key:tab,onClick:function(){setSelTabs(function(prev){return active?prev.filter(function(t){return t!==tab;}):prev.concat(tab);});},style:{padding:"6px 14px",borderRadius:999,border:"1px solid "+(active?NETWORKS[nk].color:"var(--color-border-secondary)"),background:active?NETWORKS[nk].light:"#fff",color:active?NETWORKS[nk].color:"#4a5565",fontSize:13,cursor:"pointer",fontWeight:active?600:400}},(active?"✓ ":"")+tab);
      })
    ),
    progress&&React.createElement("div",{style:{fontSize:12,color:"#1877F2",marginBottom:10,padding:"8px 12px",background:"#E7F0FF",borderRadius:8}},progress),
    React.createElement("button",{onClick:syncAll,disabled:syncing||selTabs.length===0,style:{padding:"9px 20px",borderRadius:8,border:"none",background:syncing?"#888":"#1877F2",color:"#fff",fontWeight:500,fontSize:14,cursor:syncing?"not-allowed":"pointer",opacity:syncing?0.7:1}},syncing?"Synchronisation…":"🔄 Synchroniser maintenant")
  );
}

function ManualLeadPanel(props){
  var leads=props.leads,setLeads=props.setLeads,companies=props.companies,setMsg=props.setMsg;
  var empty={coId:"",firstName:"",lastName:"",phone:"",email:"",zip:"",city:"",message:"",campaign:"",source:"Google Ads"};
  var [f,setF]=useState(empty);
  var [saving,setSaving]=useState(false);
  function upd(k,v){setF(function(p){var o=Object.assign({},p);o[k]=v;return o;});}
  var sorted=companies.slice().sort(function(a,b){var na=parseInt((a.name.match(/\d+/)||[999])[0],10),nb=parseInt((b.name.match(/\d+/)||[999])[0],10);return na-nb||a.name.localeCompare(b.name);});
  async function submit(){
    if(!f.coId){setMsg({type:"error",text:"Choisissez une société."});return;}
    if(!f.firstName.trim()&&!f.lastName.trim()){setMsg({type:"error",text:"Indiquez au moins un nom ou prénom."});return;}
    if(!f.phone.trim()&&!f.email.trim()){setMsg({type:"error",text:"Indiquez un téléphone ou un e-mail."});return;}
    var co=companies.find(function(c){return c.id===f.coId;});
    var ph=f.phone.replace(/\s/g,""),em=f.email.toLowerCase().trim();
    var dup=leads.some(function(l){if(l.companyId!==f.coId)return false;return (ph&&(l.phone||"").replace(/\s/g,"")===ph)||(em&&(l.email||"").toLowerCase().trim()===em);});
    if(dup){setMsg({type:"error",text:"Doublon : un lead avec ce téléphone ou e-mail existe déjà pour "+co.name+"."});return;}
    setSaving(true);
    var now=new Date().toLocaleString("fr-FR");
    var lead={id:"l_man_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),companyId:f.coId,firstName:f.firstName.trim()||"—",lastName:f.lastName.trim(),email:f.email.trim(),phone:f.phone.trim(),address:"",city:f.city.trim(),zip:f.zip.trim(),message:f.message.trim(),campaign:f.campaign.trim()||f.source,importedAt:now,importId:"imp_man_"+Date.now(),importLabel:co.name+" — Saisie manuelle — "+now,status:"nouveau",note:"",source:f.source,assignedTo:null};
    try{
      await dbInsert("leads",[leadToRow(lead)]);
      setLeads(function(prev){return [lead].concat(prev);});
      var alertTxt=" — ⚠ aucune alerte e-mail (pas d'adresse pour cette société)";
      if(co.email){
        try{var r=await fetch("/api/notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({companyName:co.name,companyEmail:co.email,count:1,source:f.source})});alertTxt=r.ok?" — 📧 alerte envoyée à "+co.email:" — ⚠ échec de l'alerte e-mail";}
        catch(e2){alertTxt=" — ⚠ échec de l'alerte e-mail";}
      }
      setMsg({type:"ok",text:"✓ Lead ajouté pour "+co.name+alertTxt+"."});
      setF(Object.assign({},empty,{coId:f.coId,source:f.source}));
    }catch(e){setMsg({type:"error",text:"Erreur : "+e.message});}
    setSaving(false);
  }
  function field(label,k,ph,w){return React.createElement("div",{style:{flex:"1 1 "+(w||170)+"px"}},React.createElement("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:3}},label),React.createElement("input",{value:f[k],placeholder:ph||"",onChange:function(e){upd(k,e.target.value);},style:Object.assign({},inp,{width:"100%",boxSizing:"border-box"})}));}
  var row={display:"flex",gap:10,flexWrap:"wrap",marginBottom:10};
  return React.createElement("div",null,
    React.createElement("div",{style:row},
      React.createElement("div",{style:{flex:"1 1 200px"}},React.createElement("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:3}},"Société *"),
        React.createElement("select",{value:f.coId,onChange:function(e){upd("coId",e.target.value);},style:Object.assign({},inp,{width:"100%",boxSizing:"border-box"})},
          [React.createElement("option",{key:"",value:""},"— Choisir —")].concat(sorted.map(function(c){return React.createElement("option",{key:c.id,value:c.id},c.name);})))),
      React.createElement("div",{style:{flex:"1 1 200px"}},React.createElement("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:3}},"Origine *"),
        React.createElement("select",{value:f.source,onChange:function(e){upd("source",e.target.value);},style:Object.assign({},inp,{width:"100%",boxSizing:"border-box"})},
          ["Google Ads","Facebook","WhatsApp","Tchatbot","Autre"].map(function(s){return React.createElement("option",{key:s,value:s},s);})))
    ),
    React.createElement("div",{style:row},field("Prénom","firstName"),field("Nom","lastName"),field("Téléphone","phone","06 00 00 00 00"),field("E-mail","email","nom@mail.fr",200)),
    React.createElement("div",{style:row},field("Code postal","zip","",100),field("Ville","city"),field("Campagne (optionnel)","campaign")),
    React.createElement("div",{style:{marginBottom:12}},React.createElement("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:3}},"Message / besoin"),
      React.createElement("textarea",{value:f.message,onChange:function(e){upd("message",e.target.value);},rows:2,style:Object.assign({},inp,{width:"100%",boxSizing:"border-box",fontFamily:"inherit"})})),
    React.createElement("button",{onClick:submit,disabled:saving,style:{padding:"9px 20px",borderRadius:8,border:"none",background:saving?"#888":"#185FA5",color:"#fff",fontWeight:500,fontSize:14,cursor:saving?"not-allowed":"pointer"}},saving?"Enregistrement…":"➕ Ajouter le lead")
  );
}

function OverviewMonthlyTable(props){
  var leads=props.leads,companies=props.companies,grouped=props.grouped;
  var months=getMoisList(6);
  function getMonth(l){var d=parseLeadDate(l.importedAt);if(!d)return null;return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");}
  return React.createElement("div",{style:{marginBottom:20}},
    React.createElement("div",{style:{fontWeight:500,fontSize:14,marginBottom:12}},"Leads par société par mois"),
    React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",overflowX:"auto"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:500}},
        React.createElement("thead",null,React.createElement("tr",{style:{background:"var(--color-background-secondary)",fontSize:11,color:"var(--color-text-secondary)"}},
          React.createElement("th",{style:{padding:"8px 14px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"Société"),
          React.createElement("th",{style:{padding:"8px 14px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"Réseau"),
          months.map(function(m){return React.createElement("th",{key:m,style:{padding:"8px 14px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap",textTransform:"capitalize"}},fmtMois(m));}),
          React.createElement("th",{style:{padding:"8px 14px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},"Total")
        )),
        React.createElement("tbody",null,
          companies.slice().sort(function(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true});}).map(function(c,ci){
            var net=NETWORKS[c.network],cl=grouped[c.id]||[];
            var mc=months.map(function(m){return cl.filter(function(l){return getMonth(l)===m;}).length;});
            return React.createElement("tr",{key:c.id,style:{borderBottom:"1px solid var(--color-border-tertiary)",background:ci%2===0?"transparent":"var(--color-background-secondary)"}},
              React.createElement("td",{style:{padding:"9px 14px",fontWeight:500,fontSize:13}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:net.color}}),c.name)),
              React.createElement("td",{style:{padding:"9px 14px"}},React.createElement("span",{style:{fontSize:11,background:net.light,color:net.color,padding:"1px 7px",borderRadius:9}},net.label)),
              mc.map(function(count,mi){return React.createElement("td",{key:months[mi],style:{padding:"9px 14px",textAlign:"center",fontSize:13,fontWeight:count>0?500:400,color:count>0?net.color:"var(--color-text-tertiary)"}},count>0?count:"—");}),
              React.createElement("td",{style:{padding:"9px 14px",textAlign:"center",fontWeight:500,color:"#185FA5",fontSize:13}},cl.length||"—")
            );
          }),
          React.createElement("tr",{style:{background:"var(--color-background-secondary)",fontWeight:500,borderTop:"2px solid var(--color-border-secondary)"}},
            React.createElement("td",{style:{padding:"9px 14px",fontSize:13,fontWeight:500}},"TOTAL"),
            React.createElement("td",{style:{padding:"9px 14px"}}),
            months.map(function(m){var t=leads.filter(function(l){var d=parseLeadDate(l.importedAt);if(!d)return false;return(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"))===m;}).length;return React.createElement("td",{key:m,style:{padding:"9px 14px",textAlign:"center",fontSize:13,fontWeight:500,color:"#185FA5"}},t||"—");}),
            React.createElement("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:13,fontWeight:500,color:"#185FA5"}},leads.length||"—")
          )
        )
      )
    )
  );
}

function resolvePeriod(v){
  var now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),start,days;
  function pd(x){var p=(x||"").split("-");return p.length===3?new Date(+p[0],+p[1]-1,+p[2]):null;}
  if(v.mode==="year"){start=new Date(now.getFullYear(),0,1);days=Math.round((today-start)/864e5)+1;}
  else if(v.mode==="custom"){var a=pd(v.from),b=pd(v.to)||today;if(!a)a=new Date(b.getTime()-29*864e5);if(a>b){var t=a;a=b;b=t;}start=a;days=Math.round((b-a)/864e5)+1;}
  else{days=parseInt(v.mode,10)||30;start=new Date(today.getTime()-(days-1)*864e5);}
  var bk=days<=92?1:days<=370?7:30;
  return{start:start,days:days,bk:bk,nb:Math.ceil(days/bk)};
}

function PeriodPicker(props){
  var v=props.value,sel=Object.assign({},inp,{padding:"10px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff",fontWeight:500});
  function set(o){props.onChange(Object.assign({},v,o));}
  return React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}},
    v.mode==="custom"&&React.createElement(React.Fragment,null,
      React.createElement("span",{style:{fontSize:13,color:"#6b7684"}},"Du"),React.createElement("input",{type:"date",value:v.from,onChange:function(e){set({from:e.target.value});},style:sel}),
      React.createElement("span",{style:{fontSize:13,color:"#6b7684"}},"au"),React.createElement("input",{type:"date",value:v.to,onChange:function(e){set({to:e.target.value});},style:sel})),
    React.createElement("select",{value:v.mode,onChange:function(e){var m=e.target.value;if(m==="custom"&&!v.from){var t=new Date(),f=new Date(t.getTime()-29*864e5),fm=function(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};set({mode:m,from:fm(f),to:fm(t)});}else set({mode:m});},style:sel},
      [["7","7 derniers jours"],["30","30 derniers jours"],["90","90 derniers jours"],["year","Cette année"],["custom","Personnalisé…"]].map(function(o){return React.createElement("option",{key:o[0],value:o[0]},o[1]);})));
}

function LineChart(props){
  var data=props.data,data2=props.data2,labels=props.labels,color=props.color||"#185FA5";
  var [hov,setHov]=useState(null);
  var W=600,H=220,pl=34,pr=10,pt=16,pb=26;
  var max=Math.max.apply(null,data.concat(data2||[],[4])),top=Math.ceil(max/4)*4;
  var n=data.length,step=n>1?(W-pl-pr)/(n-1):0;
  function X(i){return pl+i*step;}function Y(v){return pt+(H-pt-pb)*(1-v/top);}
  var d="";data.forEach(function(v,i){if(i===0){d="M"+X(0)+","+Y(v);}else{var cx=(X(i-1)+X(i))/2;d+=" C"+cx+","+Y(data[i-1])+" "+cx+","+Y(v)+" "+X(i)+","+Y(v);}});
  function smooth(arr){var q="";arr.forEach(function(v,i){if(i===0){q="M"+X(0)+","+Y(v);}else{var cx=(X(i-1)+X(i))/2;q+=" C"+cx+","+Y(arr[i-1])+" "+cx+","+Y(v)+" "+X(i)+","+Y(v);}});return q;}
  var area=d+" L"+X(n-1)+","+(H-pb)+" L"+X(0)+","+(H-pb)+" Z";
  var grid=[0,1,2,3,4].map(function(k){var v=top*k/4;return React.createElement("g",{key:k},React.createElement("line",{x1:pl,x2:W-pr,y1:Y(v),y2:Y(v),stroke:"#eef1f6"}),React.createElement("text",{x:pl-6,y:Y(v)+4,fontSize:10,fill:"#9aa4b2",textAnchor:"end"},Math.round(v)));});
  var every=Math.max(1,Math.ceil(n/6));
  var xl=labels.map(function(t,i){return(i%every===0)?React.createElement("text",{key:i,x:X(i),y:H-8,fontSize:10,fill:"#9aa4b2",textAnchor:"middle"},t):null;});
  return React.createElement("svg",{viewBox:"0 0 "+W+" "+H,style:{width:"100%",height:"auto",display:"block"},onMouseLeave:function(){setHov(null);}},
    React.createElement("defs",null,React.createElement("linearGradient",{id:"lcg",x1:0,y1:0,x2:0,y2:1},React.createElement("stop",{offset:"0%",stopColor:color,stopOpacity:.25}),React.createElement("stop",{offset:"100%",stopColor:color,stopOpacity:0}))),
    grid,React.createElement("path",{d:area,fill:"url(#lcg)"}),data2&&React.createElement("path",{d:smooth(data2),fill:"none",stroke:color,strokeWidth:2,strokeDasharray:"5 5",opacity:.45}),React.createElement("path",{d:d,fill:"none",stroke:color,strokeWidth:2.5,strokeLinecap:"round"}),xl,
    data.map(function(v,i){return React.createElement("rect",{key:"h"+i,x:X(i)-Math.max(step/2,4),y:0,width:Math.max(step,8),height:H,fill:"transparent",onMouseEnter:function(){setHov(i);}});}),
    hov!==null&&React.createElement("g",null,React.createElement("line",{x1:X(hov),x2:X(hov),y1:pt,y2:H-pb,stroke:color,strokeDasharray:"3 3",opacity:.5}),React.createElement("circle",{cx:X(hov),cy:Y(data[hov]),r:5,fill:"#fff",stroke:color,strokeWidth:2.5}),
      React.createElement("g",{transform:"translate("+Math.min(Math.max(X(hov)-48,pl),W-pr-96)+","+Math.max(Y(data[hov])-40,2)+")"},React.createElement("rect",{width:96,height:28,rx:7,fill:"#12263f"}),React.createElement("text",{x:48,y:18,fontSize:11,fill:"#fff",textAnchor:"middle"},data[hov]+" lead"+(data[hov]>1?"s":"")+" · "+labels[hov]))));
}

function DonutChart(props){
  var items=props.items,total=props.total,R=70,C=2*Math.PI*R,off=0;
  return React.createElement("svg",{viewBox:"0 0 180 180",style:{width:170,height:170,flexShrink:0}},
    React.createElement("circle",{cx:90,cy:90,r:R,fill:"none",stroke:"#eef1f6",strokeWidth:22}),
    items.map(function(it,i){var len=total?it.value/total*C:0;var el=React.createElement("circle",{key:i,cx:90,cy:90,r:R,fill:"none",stroke:it.color,strokeWidth:22,strokeDasharray:len+" "+(C-len),strokeDashoffset:-off,transform:"rotate(-90 90 90)"});off+=len;return el;}),
    React.createElement("text",{x:90,y:92,textAnchor:"middle",fontSize:26,fontWeight:700,fill:"#12263f"},total),
    React.createElement("text",{x:90,y:110,textAnchor:"middle",fontSize:12,fill:"#6b7684"},"leads"));
}

function AdminDashboard(props){
  var leads=props.leads,companies=props.companies,importGroups=props.importGroups,go=props.go;
  var [per,setPer]=useState({mode:"30",from:"",to:""});
  var P=resolvePeriod(per),days=P.days;
  var st=useMemo(function(){
    var start=P.start,prevStart=new Date(start.getTime()-days*864e5),bk=P.bk;
    var counts=[],labels=[];for(var i=0;i<P.nb;i++){counts.push(0);var dd=new Date(start.getTime()+i*bk*864e5);labels.push(dd.getDate()+"/"+(dd.getMonth()+1));}
    var impCur=0,impPrev=0;
    importGroups.forEach(function(g){var m=(g.id||"").match(/\d{12,}/);if(!m)return;var t=parseInt(m[0],10);if(t>=start.getTime())impCur++;else if(t>=prevStart.getTime())impPrev++;});
    var cur=0,prev=0,byCo={};
    leads.forEach(function(l){var d=parseLeadDate(l.importedAt);if(!d)return;if(d>=start){var idx=Math.floor((new Date(d.getFullYear(),d.getMonth(),d.getDate())-start)/864e5);if(idx>=0&&idx<days){counts[Math.floor(idx/bk)]++;cur++;byCo[l.companyId]=(byCo[l.companyId]||0)+1;}}else if(d>=prevStart)prev++;});
    var rows=Object.keys(byCo).map(function(id){var c=companies.find(function(x){return x.id===id;});return{name:c?c.name:id,value:byCo[id]};}).sort(function(a,b){return b.value-a.value;});
    var pal=["#185FA5","#12A5A0","#3B9B3B","#7B5BD6","#E8A33D","#C8CED6"];
    var top=rows.slice(0,5),rest=rows.slice(5).reduce(function(a,r){return a+r.value;},0);
    var items=top.map(function(r,i){return Object.assign({},r,{color:pal[i]});});if(rest>0)items.push({name:"Autres",value:rest,color:pal[5]});
    return{imp:impCur,impD:impPrev>0?Math.round((impCur-impPrev)/impPrev*100):null,counts:counts,labels:labels,cur:cur,delta:prev>0?Math.round((cur-prev)/prev*100):null,items:items};
  },[leads,companies,importGroups,per.mode,per.from,per.to]);
  var contacts=useMemo(function(){return leads.filter(function(l){return l.source==="Contacts";}).length;},[leads]);
  var card={background:"#fff",borderRadius:16,boxShadow:"0 2px 12px rgba(20,40,80,.06)",border:"1px solid #eef1f6"};
  function kpi(icon,bg,label,value,d,target){
    return React.createElement("div",{key:label,onClick:target?function(){go(target);}:undefined,style:Object.assign({},card,{padding:"16px 18px",display:"flex",alignItems:"center",gap:14,flex:"1 1 200px",minWidth:190,cursor:target?"pointer":"default"})},
      React.createElement("div",{style:{width:46,height:46,borderRadius:12,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21}},icon),
      React.createElement("div",null,React.createElement("div",{style:{fontSize:12.5,color:"#6b7684"}},label),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},React.createElement("span",{style:{fontSize:26,fontWeight:700,color:"#12263f",lineHeight:1.2}},value),
          d!==null&&d!==undefined&&React.createElement("span",{style:{fontSize:11.5,fontWeight:600,padding:"2px 8px",borderRadius:8,background:d>=0?"#E3F6E8":"#FDECEC",color:d>=0?"#1E7B3A":"#B03A3A"}},(d>=0?"+":"")+d+" %"))));
  }
  var total=st.items.reduce(function(a,i){return a+i.value;},0);
  return React.createElement("div",{className:"dofe-in"},
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:20}},
      React.createElement("div",null,React.createElement("div",{style:{fontSize:26,fontWeight:700,color:"#12263f"}},"Bonjour Guillaume 👋"),React.createElement("div",{style:{fontSize:14,color:"#6b7684"}},"Voici la vue d'ensemble de votre activité.")),
      React.createElement(PeriodPicker,{value:per,onChange:setPer})),
    React.createElement("div",{style:{display:"flex",gap:14,flexWrap:"wrap",marginBottom:18}},
      kpi("⬆️","#E6F1FB","Imports ("+days+" j)",st.imp,st.impD,"imports"),
      kpi("👥","#E3F6E8","Leads ("+days+" j)",st.cur,st.delta,"overview"),
      kpi("🎯","#EEEDFE","Contacts",contacts,null,"stats"),
      kpi("🏢","#FAEEDA","Sociétés",companies.length,null,"companies")),
    React.createElement("div",{style:{display:"flex",gap:16,flexWrap:"wrap"}},
      React.createElement("div",{style:Object.assign({},card,{padding:20,flex:"3 1 420px",minWidth:300})},React.createElement("div",{style:{fontWeight:600,marginBottom:10,color:"#12263f"}},"Évolution des leads"),React.createElement(LineChart,{data:st.counts,labels:st.labels})),
      React.createElement("div",{style:Object.assign({},card,{padding:20,flex:"2 1 320px",minWidth:280})},React.createElement("div",{style:{fontWeight:600,marginBottom:10,color:"#12263f"}},"Répartition par société"),
        total===0?React.createElement("div",{style:{color:"#9aa4b2",padding:30,textAlign:"center"}},"Aucun lead sur la période."):
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}},React.createElement(DonutChart,{items:st.items,total:total}),
          React.createElement("div",{style:{flex:1,minWidth:140}},st.items.map(function(it){return React.createElement("div",{key:it.name,style:{display:"flex",alignItems:"center",gap:8,padding:"5px 0",fontSize:13}},React.createElement("span",{style:{width:9,height:9,borderRadius:"50%",background:it.color}}),React.createElement("span",{style:{flex:1}},it.name),React.createElement("span",{style:{color:"#6b7684"}},Math.round(it.value/total*100)+" %"));}))))));
}

function CardHead(props){
  return React.createElement("div",{style:{display:"flex",alignItems:"center",gap:14,marginBottom:props.mb===undefined?16:props.mb}},
    React.createElement("div",{style:{width:44,height:44,borderRadius:12,background:props.bg||"#E6F1FB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}},props.icon),
    React.createElement("div",{style:{flex:1,minWidth:0}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}},React.createElement("div",{style:{fontWeight:700,fontSize:16,color:"#12263f"}},props.title),props.badge&&React.createElement("span",{style:{fontSize:11.5,background:"#E7F0FF",color:"#1877F2",padding:"3px 10px",borderRadius:999,fontWeight:600}},props.badge)),
      props.sub&&React.createElement("div",{style:{fontSize:13,color:"#6b7684",marginTop:2}},props.sub)),
    props.right||null);
}

function KpiRow(props){
  return React.createElement("div",{style:{display:"flex",gap:14,flexWrap:"wrap",marginBottom:18}},props.items.map(function(it){
    return React.createElement("div",{key:it.label,style:{background:"#fff",borderRadius:16,boxShadow:"0 2px 12px rgba(20,40,80,.06)",border:"1px solid #eef1f6",padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flex:"1 1 200px",minWidth:190}},
      React.createElement("div",{style:{width:44,height:44,borderRadius:12,background:it.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}},it.icon),
      React.createElement("div",null,React.createElement("div",{style:{fontSize:12.5,color:"#6b7684"}},it.label),React.createElement("div",{style:{fontSize:22,fontWeight:700,color:"#12263f",lineHeight:1.25}},it.value)));
  }));
}

var TAB_DESC={import:"Importez des leads par fichier CSV, synchronisez Google Sheets ou saisissez-les à la main.",imports:"Retrouvez chaque import effectué et gérez-le.",overview:"Répartition des leads par statut et par société, mois par mois.",ca:"Suivi du chiffre d'affaires facturé par société.",stats:"Statistiques de leads par canal d'acquisition.",connexions:"Qui s'est connecté, quand, et à quelle fréquence.",companies:"Gérez les sociétés et leurs mots de passe."};

function AdminView(props){
  var leads=props.leads,setLeads=props.setLeads,companies=props.companies,setCompanies=props.setCompanies,onLogout=props.onLogout;
  var fileRef=useRef();
  var [selId,setSelId]=useState(companies[0]?companies[0].id:"");
  var [msg,setMsg]=useState(null),[tab,setTab]=useState("dashboard"),[navOpen,setNavOpen]=useState(false);
  var [caRefreshKey,setCaRefreshKey]=useState(0);
  var [sourceOverride,setSourceOverride]=useState("");
  var [editId,setEditId]=useState(null),[editPwd,setEditPwd]=useState("");
  var [uploading,setUploading]=useState(false),[loginHistory,setLoginHistory]=useState([]);
  useEffect(function(){dbSelect("login_history","order=login_at.desc&limit=200").then(function(rows){if(Array.isArray(rows))setLoginHistory(rows);}).catch(function(){});},[]);
  var selCo=companies.find(function(c){return c.id===selId;});
  async function handleFile(e){
    var f=e.target.files[0];if(!f||!selId)return;
    var importId="imp_"+Date.now(),importLabel=(selCo?selCo.name:"")+" — "+f.name+" — "+new Date().toLocaleString("fr-FR");
    function readWithEncoding(enc){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(ev){resolve(ev.target.result);};r.onerror=reject;r.readAsText(f,enc);});}
    try{
      var text=await readWithEncoding("UTF-8");
      if(text.includes("\uFFFD"))text=await readWithEncoding("windows-1252");
      var result=parseAutoCSV(text),parsed=result.leads,detectedSource=result.source||"Google Ads";
      var finalSource=sourceOverride||detectedSource;
      if(!parsed.length){setMsg({type:"error",text:"Fichier invalide ou vide."});return;}
      var existing=leads.filter(function(l){return l.companyId===selId;}),existingKeys={};
      existing.forEach(function(l){if(l.phone)existingKeys[l.phone.replace(/\s/g,"")]=true;if(l.email)existingKeys[l.email.toLowerCase().trim()]=true;});
      var newLeads=parsed.filter(function(l){var phone=(l.phone||"").replace(/\s/g,""),email=(l.email||"").toLowerCase().trim();if(phone&&existingKeys[phone])return false;if(email&&existingKeys[email])return false;return true;});
      var skipped=parsed.length-newLeads.length;
      if(!newLeads.length){setMsg({type:"ok",text:"✓ Aucun nouveau lead ("+skipped+" déjà présent"+(skipped>1?"s":"")+" en base)."});e.target.value="";return;}
      setUploading(true);
      var withCo=newLeads.map(function(l){return Object.assign({},l,{companyId:selId,importId:importId,importLabel:importLabel,source:finalSource});});
      try{
        await dbInsert("leads",withCo.map(leadToRow));
        setLeads(function(prev){return withCo.concat(prev);});
        var txt="✓ "+newLeads.length+" lead"+(newLeads.length>1?"s":"")+" importé"+(newLeads.length>1?"s":"")+" ("+finalSource+") pour "+(selCo?selCo.name:"");
        if(skipped>0)txt+=" · "+skipped+" doublon"+(skipped>1?"s":"")+" ignoré"+(skipped>1?"s":"");
        setMsg({type:"ok",text:txt+"."});
        if(selCo&&selCo.email){fetch("/api/notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({companyName:selCo.name,companyEmail:selCo.email,count:newLeads.length,source:finalSource})}).catch(function(){});}
      }catch(err){setMsg({type:"error",text:"Erreur import : "+err.message});}
      setUploading(false);e.target.value="";
    }catch(err){setMsg({type:"error",text:"Erreur lecture : "+err.message});}
  }
  async function savePassword(coId,pwd){await dbUpdate("companies","id=eq."+coId,{password:pwd});setCompanies(function(prev){return prev.map(function(c){return c.id===coId?Object.assign({},c,{password:pwd}):c;});});setEditId(null);}
  async function deleteImport(importId,count){if(!window.confirm("Supprimer les "+count+" leads de cet import ?"))return;try{await dbDelete("leads","import_id=eq."+importId);setLeads(function(prev){return prev.filter(function(l){return l.importId!==importId;});});setMsg({type:"ok",text:"✓ Import supprimé."});}catch(err){setMsg({type:"error",text:"Erreur : "+err.message});}}
  var grouped=useMemo(function(){var r={};companies.forEach(function(c){r[c.id]=leads.filter(function(l){return l.companyId===c.id;});});return r;},[leads,companies]);
  var importGroups=useMemo(function(){var g={};leads.forEach(function(l){if(!l.importId)return;if(!g[l.importId])g[l.importId]={id:l.importId,label:l.importLabel,companyId:l.companyId,leads:[]};g[l.importId].leads.push(l);});return Object.values(g).sort(function(a,b){return b.id.localeCompare(a.id);});},[leads]);
  var allStats=useMemo(function(){return{total:leads.length,byStatus:STATUSES.map(function(s){return Object.assign({},s,{count:leads.filter(function(l){return l.status===s.key;}).length});})};},[leads]);
  var tabs=[["dashboard","🏠","Tableau de bord"],["import","⬆️","Importer CSV"],["imports","🗂️","Historique imports"],["overview","🧭","Vue d'ensemble"],["ca","💶","CA Facturé"],["stats","📊","Source de contacts"],["connexions","🔐","Connexions"],["companies","🏢","Sociétés"]];
  var curTab=tabs.find(function(t){return t[0]===tab;})||tabs[0];
  var sideCss=".dl-side{position:sticky;top:0;height:100vh;width:240px;flex-shrink:0;background:linear-gradient(180deg,#0d2c4d 0%,#0a2038 100%);display:flex;flex-direction:column;padding:18px 14px;box-sizing:border-box;z-index:60}.dl-nav{display:flex;align-items:center;gap:12px;width:100%;padding:11px 14px;border:none;border-radius:11px;background:transparent;color:#c5d3e6;font-size:14px;cursor:pointer;text-align:left;margin-bottom:3px;transition:all .15s}.dl-nav:hover{background:rgba(255,255,255,.08);color:#fff}.dl-nav.on{background:#185FA5;color:#fff;font-weight:600;box-shadow:0 6px 16px rgba(0,0,0,.25)}.dl-admin{--color-background-primary:#fff;--color-background-secondary:#f6f8fb;--color-background-tertiary:#eef3fa;--color-border-tertiary:#e9edf3;--color-border-secondary:#d9e0ea;--color-text-secondary:#5b6573;--color-text-tertiary:#8a95a5;--color-text-primary:#1a2433}.dl-admin div[style*='border-radius: 10px'][style*='solid'],.dl-admin div[style*='border-radius: 12px'][style*='solid'],.dl-admin div[style*='border-radius: 14px'][style*='solid']{border-radius:16px!important;box-shadow:0 2px 12px rgba(20,40,80,.06);border-color:#eef1f6!important}.dl-admin table{border-collapse:collapse}.dl-admin th{text-transform:uppercase;letter-spacing:.4px;font-size:11px!important;font-weight:600!important;color:#6b7684!important;background:#f6f8fb!important}.dl-admin tbody tr{transition:background .12s}.dl-admin tbody tr:hover{background:#f6f9fd!important}.dl-admin button[style*='border-radius: 8px'],.dl-admin button[style*='border-radius: 7px'],.dl-admin button[style*='border-radius: 9px']{border-radius:10px!important}.dl-admin input:not([type=checkbox]):not([type=file]),.dl-admin select,.dl-admin textarea{border-radius:10px!important;border-color:#d9e0ea!important;background-color:#fff}.dl-admin input:focus,.dl-admin select:focus,.dl-admin textarea:focus{outline:none;border-color:#185FA5!important;box-shadow:0 0 0 3px rgba(24,95,165,.15)}.dl-admin h2,.dl-admin h3{color:#12263f}.dl-burger{display:none}@media(max-width:860px){.dl-side{position:fixed;left:0;top:0;transform:translateX(-100%);transition:transform .25s}.dl-side.open{transform:none}.dl-burger{display:inline-flex}.dl-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:55}}";
  return React.createElement("div",{style:{minHeight:"100vh",display:"flex",background:"linear-gradient(180deg,#eef3fa 0%,#f7f9fc 40%)",fontSize:14,color:"#1a2433"}},
    React.createElement("style",null,DOFE_CSS+sideCss),
    navOpen&&React.createElement("div",{className:"dl-ov",onClick:function(){setNavOpen(false);}}),
    React.createElement("aside",{className:"dl-side"+(navOpen?" open":"")},
      React.createElement("div",{style:{background:"#fff",borderRadius:12,padding:"8px 12px",marginBottom:22,textAlign:"center"}},React.createElement("img",{src:LOGO_SRC,alt:"Dofelink",style:{height:34,maxWidth:"100%"}})),
      React.createElement("div",{style:{flex:1,overflowY:"auto"}},tabs.map(function(t){return React.createElement("button",{key:t[0],className:"dl-nav"+(tab===t[0]?" on":""),onClick:function(){setTab(t[0]);setNavOpen(false);}},React.createElement("span",{style:{fontSize:16,width:20,textAlign:"center"}},t[1]),t[2]);})),
      React.createElement("div",{style:{fontSize:11,color:"#7f93ad",textAlign:"center",paddingTop:12}},"Dofelink · by DOFE Consulting")),
    React.createElement("div",{style:{flex:1,minWidth:0}},
      React.createElement("div",{style:{background:"rgba(255,255,255,.85)",backdropFilter:"blur(8px)",borderBottom:"1px solid #e9edf3",padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},React.createElement("button",{className:"dl-burger",onClick:function(){setNavOpen(true);},style:{border:"1px solid #e3e8ef",background:"#fff",borderRadius:9,padding:"6px 11px",fontSize:16,cursor:"pointer"}},"☰"),React.createElement("div",{style:{fontSize:18,fontWeight:700,color:"#12263f"}},tab==="dashboard"?"Administration":curTab[2])),
        React.createElement("button",{onClick:onLogout,style:{padding:"8px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff",cursor:"pointer",fontSize:13,color:"#4a5565",fontWeight:500}},"Déconnexion")),
      React.createElement("div",{className:"dl-admin",style:{padding:"22px 24px 40px",maxWidth:1500,margin:"0 auto"}},
      tab!=="dashboard"&&TAB_DESC[tab]&&React.createElement("div",{style:{fontSize:14,color:"#6b7684",marginBottom:18}},TAB_DESC[tab]),
      msg&&React.createElement("div",{style:{padding:"12px 16px",borderRadius:12,background:msg.type==="ok"?"#E8F6EC":"#FDECEC",color:msg.type==="ok"?"#1E6B35":"#9B2C2C",marginBottom:16,fontSize:13.5,display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid "+(msg.type==="ok"?"#CDEBD6":"#F6CFCF")}},React.createElement("span",null,(msg.type==="ok"?"✅ ":"⚠️ ")+msg.text),React.createElement("button",{onClick:function(){setMsg(null);},style:{background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:15}},"✕")),

      tab==="dashboard"&&React.createElement(AdminDashboard,{leads:leads,companies:companies,importGroups:importGroups,go:setTab}),

      tab==="import"&&React.createElement("div",null,
        React.createElement("div",{style:{background:"#fff",borderRadius:16,border:"1px solid #eef1f6",boxShadow:"0 2px 12px rgba(20,40,80,.06)",padding:22,marginBottom:16}},
          React.createElement(CardHead,{icon:"⬆️",bg:"#E6F1FB",title:"Importer un fichier CSV",sub:"Choisissez la société destinataire et l'origine des contacts."}),
          React.createElement("div",{style:{display:"flex",gap:22,flexWrap:"wrap"}},
          React.createElement("div",{style:{flex:"3 1 460px",minWidth:0}},
          React.createElement("div",{style:{marginBottom:14}},
            React.createElement("div",{style:{fontSize:12,color:"#6b7684",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:.4}},"Société destinataire"),
            ["renovation","humidite"].map(function(nk){return React.createElement("div",{key:nk,style:{marginBottom:12}},React.createElement("div",{style:{fontSize:12,color:NETWORKS[nk].color,fontWeight:600,marginBottom:6}},NETWORKS[nk].label),React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},companies.filter(function(c){return c.network===nk;}).slice().sort(function(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true});}).map(function(c){var on=selId===c.id;return React.createElement("button",{key:c.id,onClick:function(){setSelId(c.id);},style:{padding:"6px 14px",borderRadius:999,border:"1px solid "+(on?NETWORKS[nk].color:"#e3e8ef"),background:on?NETWORKS[nk].light:"#fff",color:on?NETWORKS[nk].color:"#4a5565",fontSize:13,cursor:"pointer",fontWeight:on?600:400,boxShadow:on?"0 2px 8px rgba(0,0,0,.08)":"none"}},(on?"✓ ":"")+c.name);})));})
          ),
          selCo&&React.createElement("div",{style:{background:"#f6f8fb",borderRadius:12,padding:"11px 16px",marginBottom:16,fontSize:13,color:"#4a5565"}},"🏢 Société : ",React.createElement("b",{style:{color:NETWORKS[selCo.network].color}},selCo.name)," · "+(grouped[selCo.id]||[]).length+" lead(s) en base"),
          React.createElement("div",{style:{marginBottom:16}},
            React.createElement("div",{style:{fontSize:12,color:"#6b7684",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:.4}},"Origine (auto-détection si non sélectionnée)"),
            React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
              ["","Google Ads","Facebook","WhatsApp","Tchatbot","Contacts"].map(function(s2){
                var active=sourceOverride===s2;
                var cfg={"Google Ads":{bg:"#E8F0FE",color:"#1A73E8",ic:"🔎"},"Facebook":{bg:"#E7F0FF",color:"#1877F2",ic:"📘"},"Contacts":{bg:"#F3F4F6",color:"#555",ic:"📇"},"WhatsApp":{bg:"#E3F8EA",color:"#128C7E",ic:"💬"},"Tchatbot":{bg:"#F1E8FB",color:"#7B3FC4",ic:"🤖"},"":{ic:"✨"}};
                var c=cfg[s2]||{};
                return React.createElement("button",{key:s2,onClick:function(){setSourceOverride(s2);},style:{padding:"7px 15px",borderRadius:999,border:"1px solid "+(active?(c.color||"#185FA5"):"#e3e8ef"),background:active?(c.bg||"#E6F1FB"):"#fff",color:active?(c.color||"#185FA5"):"#4a5565",fontSize:13,cursor:"pointer",fontWeight:active?600:400,display:"inline-flex",alignItems:"center",gap:6}},React.createElement("span",null,c.ic),s2||"Auto-détection");
              })
            )
          )),
          React.createElement("input",{type:"file",accept:".csv",ref:fileRef,onChange:handleFile,style:{display:"none"}}),
          React.createElement("div",{onClick:function(){if(selId&&!uploading)fileRef.current.click();},onDragOver:function(e){e.preventDefault();},onDrop:function(e){e.preventDefault();if(selId&&!uploading&&e.dataTransfer.files&&e.dataTransfer.files.length)handleFile({target:{files:e.dataTransfer.files,value:""}});},style:{flex:"1 1 260px",minHeight:190,border:"2px dashed "+(selCo?NETWORKS[selCo.network].color:"#c9d2de"),borderRadius:16,background:selCo?NETWORKS[selCo.network].light:"#f6f8fb",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,textAlign:"center",padding:20,cursor:selCo&&!uploading?"pointer":"not-allowed",opacity:uploading?0.7:1}},
            React.createElement("div",{style:{fontSize:38}},uploading?"⏳":"☁️"),
            React.createElement("div",{style:{fontWeight:600,color:"#12263f"}},uploading?"Import en cours…":"Glissez-déposez votre fichier CSV"),
            React.createElement("div",{style:{fontSize:13,color:"#6b7684"}},"ou cliquez pour le sélectionner"),
            React.createElement("div",{style:{marginTop:6,padding:"9px 20px",borderRadius:10,background:selCo?NETWORKS[selCo.network].color:"#888",color:"#fff",fontWeight:600,fontSize:14}},"⬆ Choisir le fichier CSV")))
        ),

        React.createElement("div",{style:{background:"#fff",borderRadius:16,border:"1px solid #eef1f6",boxShadow:"0 2px 12px rgba(20,40,80,.06)",padding:22}},
          React.createElement(CardHead,{icon:"🔄",bg:"#E3F6E8",title:"Synchroniser depuis Google Sheets",badge:"Facebook",sub:"Importe automatiquement les nouveaux leads Facebook depuis le Google Sheet partagé. Les doublons sont ignorés."}),
          React.createElement(GSheetSyncPanel,{leads:leads,setLeads:setLeads,companies:companies,grouped:grouped,setMsg:setMsg})
        ),
        React.createElement("div",{style:{background:"#fff",borderRadius:16,border:"1px solid #eef1f6",boxShadow:"0 2px 12px rgba(20,40,80,.06)",padding:22,marginTop:16}},
          React.createElement(CardHead,{icon:"✍️",bg:"#FAEEDA",title:"Saisie manuelle d'un lead",sub:"Ajoutez un lead à la main (Google Ads, WhatsApp, tchatbot…). Les doublons téléphone / e-mail sont bloqués."}),
          React.createElement(ManualLeadPanel,{leads:leads,setLeads:setLeads,companies:companies,setMsg:setMsg})
        )
      ),

      tab==="imports"&&React.createElement("div",null,
        React.createElement(KpiRow,{items:[{icon:"🗂️",bg:"#E6F1FB",label:"Imports",value:importGroups.length},{icon:"👥",bg:"#E3F6E8",label:"Leads importés",value:importGroups.reduce(function(a,g){return a+g.leads.length;},0)},{icon:"🏢",bg:"#FAEEDA",label:"Sociétés concernées",value:Object.keys(importGroups.reduce(function(a,g){a[g.companyId]=1;return a;},{})).length}]}),
        importGroups.length===0&&React.createElement("div",{style:{padding:32,textAlign:"center",color:"var(--color-text-secondary)",background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)"}},"Aucun import."),
        React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
          importGroups.map(function(g){var co=companies.find(function(c){return c.id===g.companyId;}),net=co?NETWORKS[co.network]:NETWORKS.renovation;return React.createElement("div",{key:g.id,style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",padding:"12px 16px"}},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}},React.createElement("div",null,React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:4}},React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:net.color}}),React.createElement("span",{style:{fontWeight:500}},co?co.name:"Société inconnue"),React.createElement("span",{style:{fontSize:11,background:net.light,color:net.color,padding:"1px 7px",borderRadius:9}},g.leads.length+" lead"+(g.leads.length>1?"s":""))),React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}},g.label),React.createElement("div",{style:{display:"flex",gap:4,flexWrap:"wrap"}},STATUSES.filter(function(s){return g.leads.some(function(l){return l.status===s.key;});}).map(function(s){return React.createElement("span",{key:s.key,style:{fontSize:11,padding:"1px 8px",borderRadius:8,background:s.bg,color:s.color}},g.leads.filter(function(l){return l.status===s.key;}).length+" "+s.label);}))),React.createElement("button",{onClick:function(){deleteImport(g.id,g.leads.length);},style:{padding:"6px 14px",borderRadius:8,border:"1px solid #F7C1C1",background:"transparent",color:"#A32D2D",fontSize:12,cursor:"pointer",fontWeight:500}},"🗑 Supprimer")));})
        )
      ),

      tab==="overview"&&React.createElement("div",null,
        React.createElement("div",{style:{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}},
          React.createElement("div",{style:{flex:1,minWidth:120,background:"var(--color-background-primary)",borderRadius:8,padding:"12px 16px",border:"1px solid var(--color-border-tertiary)"}},React.createElement("div",{style:{fontSize:26,fontWeight:500,color:"#185FA5"}},allStats.total),React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"Total leads")),
          allStats.byStatus.map(function(s){return React.createElement("div",{key:s.key,style:{flex:1,minWidth:100,background:s.bg,borderRadius:8,padding:"12px 16px",border:"1px solid "+s.color+"33"}},React.createElement("div",{style:{fontSize:22,fontWeight:500,color:s.color}},s.count),React.createElement("div",{style:{fontSize:12,color:s.color}},s.label));})
        ),
        React.createElement(OverviewMonthlyTable,{leads:leads,companies:companies,grouped:grouped}),
        ["renovation","humidite"].map(function(nk){return React.createElement("div",{key:nk,style:{marginBottom:16}},React.createElement("div",{style:{fontSize:12,fontWeight:500,color:NETWORKS[nk].color,marginBottom:6}},NETWORKS[nk].label),React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}},companies.filter(function(c){return c.network===nk;}).slice().sort(function(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true});}).map(function(c){var cl=grouped[c.id]||[],nw=cl.filter(function(l){return l.status==="nouveau";}).length,treated=cl.filter(function(l){return l.status!=="nouveau";}).length,pct=cl.length>0?Math.round(treated/cl.length*100):0,cSt=getStatuses(c.id);return React.createElement("div",{key:c.id,style:{background:"var(--color-background-primary)",borderRadius:9,border:"1px solid var(--color-border-tertiary)",padding:"11px 14px"}},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},React.createElement("span",{style:{fontWeight:500,fontSize:13}},c.name),nw>0&&React.createElement("span",{style:{fontSize:10,background:NETWORKS[nk].light,color:NETWORKS[nk].color,borderRadius:9,padding:"1px 7px",fontWeight:500}},nw+" new")),React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}},cl.length+" lead"+(cl.length>1?"s":"")+" · "+pct+"% traités"),cl.length>0&&React.createElement("div",{style:{height:6,borderRadius:3,background:"var(--color-border-tertiary)",marginBottom:8,overflow:"hidden"}},React.createElement("div",{style:{height:"100%",width:pct+"%",background:NETWORKS[nk].color,borderRadius:3}})),React.createElement("div",{style:{display:"flex",gap:3,flexWrap:"wrap"}},cSt.filter(function(s){return cl.some(function(l){return l.status===s.key;});}).map(function(s){return React.createElement("span",{key:s.key,style:{fontSize:10,padding:"1px 6px",borderRadius:6,background:s.bg,color:s.color}},cl.filter(function(l){return l.status===s.key;}).length+" "+s.label);})));})
          ));})
      ),

      tab==="ca"&&React.createElement(CAAdminView,{key:"ca-admin-"+caRefreshKey,companies:companies,onRefresh:function(){setCaRefreshKey(function(k){return k+1;});}}),

      tab==="stats"&&React.createElement(LeadsStatsAdminView,{companies:companies}),

      tab==="connexions"&&React.createElement("div",null,
        React.createElement(KpiRow,{items:[{icon:"🔐",bg:"#E6F1FB",label:"Connexions (200 dernières)",value:loginHistory.length},{icon:"📅",bg:"#E3F6E8",label:"Aujourd'hui",value:loginHistory.filter(function(h){return h.login_at&&new Date(h.login_at).toDateString()===new Date().toDateString();}).length},{icon:"👤",bg:"#EEEDFE",label:"Utilisateurs distincts",value:Object.keys(loginHistory.reduce(function(a,h){a[(h.company_id||"")+"|"+(h.user_name||"")]=1;return a;},{})).length}]}),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginBottom:20}},
          companies.map(function(c){var net=NETWORKS[c.network],history=loginHistory.filter(function(h){return h.company_id===c.id;}),last=history[0],lastDate=last?new Date(last.login_at):null,daysSince=lastDate?Math.floor((Date.now()-lastDate)/86400000):null;var col=daysSince===null?"#9c9a94":daysSince===0?"#27500A":daysSince<=3?"#633806":"#A32D2D";var bg=daysSince===null?"#f5f5f3":daysSince===0?"#EAF3DE":daysSince<=3?"#FAEEDA":"#FCEBEB";var label=daysSince===null?"Jamais connecté":daysSince===0?"Connecté aujourd'hui":daysSince===1?"Il y a 1 jour":"Il y a "+daysSince+" jours";return React.createElement("div",{key:c.id,style:{background:"var(--color-background-primary)",borderRadius:9,border:"1px solid var(--color-border-tertiary)",padding:"10px 14px"}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:6}},React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:net.color}}),React.createElement("span",{style:{fontWeight:500,fontSize:13}},c.name)),React.createElement("div",{style:{fontSize:11,padding:"2px 8px",borderRadius:8,background:bg,color:col,display:"inline-block",marginBottom:4,fontWeight:500}},label),React.createElement("div",{style:{fontSize:11,color:"var(--color-text-tertiary)"}},history.length+" connexion"+(history.length>1?"s":"")+(lastDate?" · "+lastDate.toLocaleDateString("fr-FR")+" "+lastDate.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):"")));})
        ),
        React.createElement("div",{style:{fontWeight:500,fontSize:13,marginBottom:10}},"Journal détaillé"),
        loginHistory.length===0&&React.createElement("div",{style:{padding:24,textAlign:"center",color:"var(--color-text-secondary)",background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)"}},"Aucune connexion."),
        loginHistory.length>0&&React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",overflow:"hidden"}},
          React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
            React.createElement("thead",null,React.createElement("tr",{style:{background:"var(--color-background-secondary)",fontSize:11,color:"var(--color-text-secondary)"}},
              ["Société","Utilisateur","Rôle","Date et heure"].map(function(h){return React.createElement("th",{key:h,style:{padding:"8px 14px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},h);})
            )),
            React.createElement("tbody",null,loginHistory.map(function(h,i){
              var co=companies.find(function(c){return c.id===h.company_id;})||{name:h.company_name||"—",network:"renovation"};
              var net=NETWORKS[co.network]||NETWORKS.renovation;
              var d=new Date(h.login_at);
              var roleLabel=h.role==="admin"?"🔧 Admin":h.role==="subadmin"?"⚙️ Admin local":h.role==="commercial"?"👤 Commercial":"🏢 Société";
              var roleBg=h.role==="admin"?"#F3E8FF":h.role==="subadmin"?"#E8F0FE":h.role==="commercial"?"#E1F5EE":"var(--color-background-secondary)";
              var roleColor=h.role==="admin"?"#6B21A8":h.role==="subadmin"?"#1A73E8":h.role==="commercial"?"#0F6E56":"var(--color-text-secondary)";
              return React.createElement("tr",{key:h.id,style:{borderBottom:"1px solid var(--color-border-tertiary)",background:i%2===0?"transparent":"var(--color-background-secondary)"}},
                React.createElement("td",{style:{padding:"9px 14px",fontWeight:500}},
                  React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
                    React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:net.color}}),
                    h.company_name||co.name||"—"
                  )
                ),
                React.createElement("td",{style:{padding:"9px 14px",fontWeight:500}},h.user_name||"—"),
                React.createElement("td",{style:{padding:"9px 14px"}},
                  React.createElement("span",{style:{fontSize:11,background:roleBg,color:roleColor,padding:"2px 8px",borderRadius:9,fontWeight:500}},roleLabel)
                ),
                React.createElement("td",{style:{padding:"9px 14px",fontSize:13,color:"var(--color-text-secondary)"}},
                  d.toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})+" à "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})
                )
              );
            }))
          )
        )
      ),

      tab==="companies"&&React.createElement("div",null,
        React.createElement(KpiRow,{items:[{icon:"🏢",bg:"#FAEEDA",label:"Sociétés",value:companies.length},{icon:"🏠",bg:"#E6F1FB",label:"Atriome",value:companies.filter(function(c){return c.network==="renovation";}).length},{icon:"💧",bg:"#E3F6E8",label:"MurHumide",value:companies.filter(function(c){return c.network==="humidite";}).length}]}),
        React.createElement("div",{style:{fontSize:13,color:"#6b7684",marginBottom:12}},"Cliquez sur \"Modifier\" pour changer le mot de passe."),
        React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
          companies.map(function(c){var net=NETWORKS[c.network],isEdit=editId===c.id;return React.createElement("div",{key:c.id,style:{background:"var(--color-background-primary)",borderRadius:9,border:"1px solid "+(isEdit?net.color:"var(--color-border-tertiary)"),padding:"12px 16px"}},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}},React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:net.color}}),React.createElement("span",{style:{fontWeight:500,fontSize:14}},c.name),React.createElement("span",{style:{fontSize:11,background:net.light,color:net.color,padding:"1px 7px",borderRadius:9}},net.label),React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"Login : ",React.createElement("b",null,c.login))),React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center"}},React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},(grouped[c.id]||[]).length+" leads"),isEdit?React.createElement("button",{onClick:function(){setEditId(null);},style:{padding:"5px 12px",borderRadius:7,border:"1px solid var(--color-border-secondary)",background:"transparent",fontSize:12,cursor:"pointer",color:"var(--color-text-secondary)"}},"Annuler"):React.createElement("button",{onClick:function(){setEditId(c.id);setEditPwd(c.password);},style:{padding:"5px 12px",borderRadius:7,border:"1px solid "+net.color,background:net.light,color:net.color,fontSize:12,cursor:"pointer",fontWeight:500}},"✏ Modifier mdp"))),isEdit&&React.createElement("div",{style:{marginTop:12,padding:"12px 14px",background:"var(--color-background-secondary)",borderRadius:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}},React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}},"Actuel : ",React.createElement("b",null,c.password)),React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}},"Nouveau :"),React.createElement("input",{value:editPwd,onChange:function(e){setEditPwd(e.target.value);},onKeyDown:function(e){if(e.key==="Enter"&&editPwd)savePassword(c.id,editPwd);},placeholder:"Nouveau mot de passe",autoFocus:true,style:{padding:"6px 10px",borderRadius:7,border:"1px solid "+net.color,fontSize:13,background:"var(--color-background-primary)",color:"var(--color-text-primary)",flex:1,minWidth:180,outline:"none"}}),React.createElement("button",{onClick:function(){if(editPwd)savePassword(c.id,editPwd);},disabled:!editPwd,style:{padding:"6px 16px",borderRadius:7,border:"none",background:editPwd?net.color:"#ccc",color:"#fff",fontWeight:500,fontSize:13,cursor:editPwd?"pointer":"not-allowed"}},"✓ Enregistrer")));})
        )
      )
    )
    )
  );
}

function makeSubAdminTable(paginated,shown,page,net,selected,toggleAll,toggleSelect,commerciaux,setPanel,groupByDept,filter,counts,setFilter,search,setSearch,dateFrom,setDateFrom,dateTo,setDateTo,setGroupByDept,assignTarget,setAssignTarget,selectedCount,assign,assigning,setSelected,PAGE_SIZE,companyId){
  function renderRow(l,i){
    var comm=l.assignedTo?commerciaux.find(function(c){return c.id===l.assignedTo;}):null;
    return React.createElement("tr",{key:l.id,style:{borderBottom:"1px solid var(--color-border-tertiary)",background:selected[l.id]?net.light:i%2===0?"transparent":"var(--color-background-secondary)"}},
      React.createElement("td",{style:{padding:"9px 12px"}},React.createElement("input",{type:"checkbox",checked:!!selected[l.id],onChange:function(){toggleSelect(l.id);},style:{cursor:"pointer"}})),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:12,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}},fmtDate(l.importedAt)),
      React.createElement("td",{style:{padding:"9px 12px",fontWeight:500}},l.firstName+" "+l.lastName),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:12}},l.phone?React.createElement("a",{href:"tel:"+l.phone,style:{color:net.color,textDecoration:"none"}},l.phone):"—"),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:12}},l.email?React.createElement("a",{href:"mailto:"+l.email,style:{color:net.color,textDecoration:"none"}},l.email):"—"),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:12}},fmtVille(l)),
      React.createElement("td",{style:{padding:"9px 12px"}},React.createElement(SourceBadge,{source:l.source})),
      React.createElement("td",{style:{padding:"9px 12px"}},React.createElement(Badge,{statusKey:l.status,companyId:companyId})),
      React.createElement("td",{style:{padding:"9px 12px"}},comm?React.createElement("span",{style:{fontSize:11,background:net.light,color:net.color,padding:"2px 8px",borderRadius:8,fontWeight:500}},comm.nom):React.createElement("span",{style:{fontSize:11,color:"var(--color-text-tertiary)"}},"Non assigné")),
      React.createElement("td",{style:{padding:"9px 12px"}},React.createElement("button",{onClick:function(){setPanel(l);},style:{padding:"4px 10px",borderRadius:6,border:"1px solid "+net.color,background:"transparent",color:net.color,fontSize:11,cursor:"pointer"}},"Gérer"))
    );
  }
  function renderTable(rows){
    return React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",overflowX:"auto"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:800,fontSize:12}},
        React.createElement("thead",null,React.createElement("tr",{style:{background:"var(--color-background-secondary)",fontSize:11,color:"var(--color-text-secondary)"}},
          React.createElement("th",{style:{padding:"8px 12px",borderBottom:"1px solid var(--color-border-tertiary)"}}),
          ["Date","Contact","Téléphone","Email","CP / Ville","Origine","Statut","Assigné à","Action"].map(function(h){return React.createElement("th",{key:h,style:{padding:"8px 12px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},h);})
        )),
        React.createElement("tbody",null,rows.map(function(l,i){return renderRow(l,i);}))
      )
    );
  }
  if(!groupByDept)return renderTable(paginated);
  var groups={};shown.forEach(function(l){var d=(l.zip||"00").slice(0,2).toUpperCase();if(!groups[d])groups[d]=[];groups[d].push(l);});
  var depts=Object.keys(groups).sort();
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:16}},
    depts.length===0&&React.createElement("div",{style:{padding:24,textAlign:"center",color:"var(--color-text-secondary)"}},"Aucun lead."),
    depts.map(function(dept){var dl=groups[dept];return React.createElement("div",{key:dept},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8}},React.createElement("span",{style:{fontWeight:500,color:net.color,fontSize:14}},"📍 Département "+dept),React.createElement("span",{style:{fontSize:12,background:net.color,color:"#fff",borderRadius:9,padding:"1px 8px"}},dl.length+" lead"+(dl.length>1?"s":""))),renderTable(dl));})
  );
}

var ADMIN_THEME_CSS=".dl-admin{--color-background-primary:#fff;--color-background-secondary:#f6f8fb;--color-background-tertiary:#eef3fa;--color-border-tertiary:#e9edf3;--color-border-secondary:#d9e0ea;--color-text-secondary:#5b6573;--color-text-tertiary:#8a95a5;--color-text-primary:#1a2433}.dl-admin div[style*='border-radius: 10px'][style*='solid'],.dl-admin div[style*='border-radius: 12px'][style*='solid'],.dl-admin div[style*='border-radius: 14px'][style*='solid']{border-radius:16px!important;box-shadow:0 2px 12px rgba(20,40,80,.06);border-color:#eef1f6!important}.dl-admin table{border-collapse:collapse}.dl-admin th{text-transform:uppercase;letter-spacing:.4px;font-size:11px!important;font-weight:600!important;color:#6b7684!important;background:#f6f8fb!important}.dl-admin tbody tr{transition:background .12s}.dl-admin tbody tr:hover{background:#f6f9fd!important}.dl-admin button[style*='border-radius: 8px'],.dl-admin button[style*='border-radius: 7px'],.dl-admin button[style*='border-radius: 9px']{border-radius:10px!important}.dl-admin input:not([type=checkbox]):not([type=file]),.dl-admin select,.dl-admin textarea{border-radius:10px!important;border-color:#d9e0ea!important;background-color:#fff}.dl-admin input:focus,.dl-admin select:focus,.dl-admin textarea:focus{outline:none;border-color:#185FA5!important;box-shadow:0 0 0 3px rgba(24,95,165,.15)}.dl-admin h2,.dl-admin h3{color:#12263f}";

function SubHeader(props){
  var net=props.net,ini=(props.title||"").replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase();
  return React.createElement("div",{style:{background:"rgba(255,255,255,.85)",backdropFilter:"blur(8px)",borderBottom:"1px solid #e9edf3",padding:"12px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50,flexWrap:"wrap",gap:10}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:16}},
      React.createElement("img",{src:LOGO_SRC,alt:"Dofelink",style:{height:38}}),
      React.createElement("div",{style:{width:1,height:30,background:"#e3e8ef"}}),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff"}},React.createElement("span",{style:{width:9,height:9,borderRadius:"50%",background:net.color}}),React.createElement("span",{style:{fontWeight:600}},props.title),React.createElement("span",{style:{fontSize:11.5,background:net.light,color:net.color,padding:"2px 9px",borderRadius:999}},net.label))),
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
      React.createElement("button",{onClick:props.onLogout,style:{padding:"8px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff",cursor:"pointer",fontSize:13,color:"#4a5565",fontWeight:500}},"Déconnexion"),
      React.createElement("div",{style:{width:38,height:38,borderRadius:"50%",background:net.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}},ini)));
}

function Pills(props){
  return React.createElement("div",{style:{display:"inline-flex",gap:4,padding:5,borderRadius:14,background:"#fff",border:"1px solid #eef1f6",boxShadow:"0 2px 8px rgba(20,40,80,.04)",marginBottom:18,flexWrap:"wrap"}},
    props.items.map(function(it){var on=props.active===it[0];return React.createElement("button",{key:it[0],onClick:function(){props.onChange(it[0]);},style:{padding:"9px 20px",border:"none",borderRadius:10,background:on?props.net.color:"transparent",color:on?"#fff":"#5b6573",fontWeight:on?600:500,fontSize:14,cursor:"pointer",boxShadow:on?"0 4px 12px rgba(24,95,165,.25)":"none",transition:"all .15s"}},it[1]);}));
}

function LeadKpis(props){
  var myLeads=props.leads;
  var k=useMemo(function(){
    var now=new Date(),m0=new Date(now.getFullYear(),now.getMonth(),1),m1=new Date(now.getFullYear(),now.getMonth()-1,1),d30=new Date(now.getTime()-30*864e5),d60=new Date(now.getTime()-60*864e5);
    var cM=0,cP=0,c30=0,c60=0,nw=0,sg=0,valid=myLeads.filter(function(l){return l.status!=="spam";});
    valid.forEach(function(l){var d=parseLeadDate(l.importedAt);if(l.status==="nouveau")nw++;if(l.status==="signe")sg++;if(!d)return;if(d>=m0)cM++;else if(d>=m1)cP++;if(d>=d30)c30++;else if(d>=d60)c60++;});
    function dl(a,b){return b>0?Math.round((a-b)/b*100):null;}
    return{m:cM,mD:dl(cM,cP),d:c30,dD:dl(c30,c60),nw:nw,rate:valid.length?Math.round(sg/valid.length*100):0};
  },[myLeads]);
  function chip(d){return d!==null&&React.createElement("span",{style:{fontSize:11.5,fontWeight:600,padding:"2px 8px",borderRadius:8,background:d>=0?"#E3F6E8":"#FDECEC",color:d>=0?"#1E7B3A":"#B03A3A"}},(d>=0?"↑ +":"↓ ")+d+" %");}
  function card(icon,bg,label,val,d){return React.createElement("div",{key:label,style:{background:"#fff",borderRadius:16,boxShadow:"0 2px 12px rgba(20,40,80,.06)",border:"1px solid #eef1f6",padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flex:"1 1 200px",minWidth:190}},
    React.createElement("div",{style:{width:44,height:44,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}},icon),
    React.createElement("div",null,React.createElement("div",{style:{fontSize:12.5,color:"#6b7684"}},label),React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},React.createElement("span",{style:{fontSize:24,fontWeight:700,color:"#12263f"}},val),d!==undefined&&chip(d))));}
  return React.createElement("div",{style:{display:"flex",gap:14,flexWrap:"wrap",marginBottom:18}},card("👥","#E6F1FB","Leads du mois",k.m,k.mD),card("📅","#E3F6E8","Leads (30 jours)",k.d,k.dD),card("🔔","#FAEEDA","Leads à traiter",k.nw),card("🎯","#EEEDFE","Taux de signature",k.rate+" %"));
}

function makeSubAdminView(companyId,companyName,network,tableName,dbTable){
  return function(props){
    var leads=props.leads,setLeads=props.setLeads,companies=props.companies,onLogout=props.onLogout;
    var net=NETWORKS[network];
    var [commerciaux,setCommerciaux]=useState([]);var [loading,setLoading]=useState(true);
    var [tab,setTab]=useState("dashboard"),[navOpen,setNavOpen]=useState(false);
    var [selected,setSelected]=useState({});var [assignTarget,setAssignTarget]=useState("");var [assigning,setAssigning]=useState(false);
    var [msg,setMsg]=useState(null);var [panel,setPanel]=useState(null);
    var [filter,setFilter]=useState("tous");var [search,setSearch]=useState("");
    var [sortDesc,setSortDesc]=useState(true);var [page,setPage]=useState(1);
    var [dateFrom,setDateFrom]=useState("");var [dateTo,setDateTo]=useState("");var [groupByDept,setGroupByDept]=useState(false);
    var [newLogin,setNewLogin]=useState("");var [newPwd,setNewPwd]=useState("");var [newNom,setNewNom]=useState("");var [creating,setCreating]=useState(false);
    var myLeads=useMemo(function(){return leads.filter(function(l){return l.companyId===companyId;});},[leads]);
    useEffect(function(){dbSelect(dbTable,"order=created_at.asc").then(function(rows){setCommerciaux(rows||[]);setLoading(false);}).catch(function(){setLoading(false);});},[] );
    var shown=useMemo(function(){
      var filtered=myLeads.filter(function(l){
        var matchStatus=filter==="spam"?l.status==="spam":filter==="tous"?l.status!=="spam":l.status===filter;
        var q=search.toLowerCase();var matchSearch=!q||[l.firstName,l.lastName,l.email,l.phone,l.city,l.campaign].some(function(v){return(v||"").toLowerCase().includes(q);});
        var lDate=parseLeadDate(l.importedAt);var matchFrom=!dateFrom||!lDate||lDate>=new Date(dateFrom);var matchTo=!dateTo||!lDate||lDate<=new Date(dateTo+"T23:59:59");
        return matchStatus&&matchSearch&&matchFrom&&matchTo;
      });
      filtered.sort(function(a,b){var da=parseLeadDate(a.importedAt)||new Date(0),db=parseLeadDate(b.importedAt)||new Date(0);return sortDesc?db-da:da-db;});
      return filtered;
    },[myLeads,filter,search,sortDesc,dateFrom,dateTo]);
    var paginated=shown.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
    var selectedCount=Object.values(selected).filter(Boolean).length;
    var counts=useMemo(function(){var r={tous:myLeads.filter(function(l){return l.status!=="spam";}).length};STATUSES.forEach(function(s){r[s.key]=myLeads.filter(function(l){return l.status===s.key;}).length;});return r;},[myLeads]);
    function toggleSelect(id){setSelected(function(prev){var r=Object.assign({},prev);r[id]=!r[id];return r;});}
    function toggleAll(){var allSel=paginated.every(function(l){return selected[l.id];});setSelected(function(prev){var r=Object.assign({},prev);paginated.forEach(function(l){r[l.id]=!allSel;});return r;});}
    async function assign(){
      if(!assignTarget||selectedCount===0)return;
      var ids=Object.keys(selected).filter(function(id){return selected[id];});
      var comm=commerciaux.find(function(c){return c.id===assignTarget;});if(!comm)return;
      setAssigning(true);
      try{for(var i=0;i<ids.length;i++){await dbUpdate("leads","id=eq."+ids[i],{assigned_to:assignTarget});}setLeads(function(prev){return prev.map(function(l){return ids.indexOf(l.id)>=0?Object.assign({},l,{assignedTo:assignTarget}):l;});});setSelected({});setAssignTarget("");setMsg({type:"ok",text:"✓ "+ids.length+" lead"+(ids.length>1?"s":"")+" assigné"+(ids.length>1?"s":"")+" à "+comm.nom});}
      catch(e){setMsg({type:"error",text:"Erreur : "+e.message});}
      setAssigning(false);
    }
    async function createCommercial(){
      if(!newLogin.trim()||!newPwd.trim()||!newNom.trim())return;setCreating(true);
      var prefix=dbTable.replace("_commerciaux","")+"c_";
      var row={id:prefix+Date.now()+"_"+Math.random().toString(36).slice(2,6),nom:newNom.trim(),login:newLogin.trim(),password:newPwd.trim()};
      try{await dbInsertOne(dbTable,row);setCommerciaux(function(prev){return prev.concat(row);});setNewLogin("");setNewPwd("");setNewNom("");setMsg({type:"ok",text:"✓ Commercial "+row.nom+" créé."});}
      catch(e){setMsg({type:"error",text:"Erreur : "+e.message});}
      setCreating(false);
    }
    async function deleteCommercial(id){
      if(!window.confirm("Supprimer ce commercial ?"))return;
      await dbDelete(dbTable,"id=eq."+id);
      var al=myLeads.filter(function(l){return l.assignedTo===id;});
      for(var i=0;i<al.length;i++){await dbUpdate("leads","id=eq."+al[i].id,{assigned_to:null});}
      setLeads(function(prev){return prev.map(function(l){return l.assignedTo===id?Object.assign({},l,{assignedTo:null}):l;});});
      setCommerciaux(function(prev){return prev.filter(function(c){return c.id!==id;});});
    }
    async function saveLeadUpdate(id,status,note){await dbUpdate("leads","id=eq."+id,{status:status,note:note});setLeads(function(prev){return prev.map(function(l){return l.id===id?Object.assign({},l,{status:status,note:note}):l;});});}
    if(loading)return React.createElement("div",{style:{padding:40,textAlign:"center"}},"Chargement…");
    var navItems=[["dashboard","🏠","Tableau de bord"],["leads","👥","Leads"],["ca","💶","CA Facturé"],["stats","📊","Source de contacts"],["commerciaux","🧑‍💼","Commerciaux"]];
    var coObj={id:companyId,name:companyName,network:network};
    var ghost2={padding:"8px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff",cursor:"pointer",fontSize:13,color:"#4a5565",fontWeight:500};
    return React.createElement("div",{style:{minHeight:"100vh",display:"flex",background:"linear-gradient(180deg,#eef3fa 0%,#f7f9fc 40%)",fontSize:14,color:"#1a2433"}},
      React.createElement("style",null,DOFE_CSS+ADMIN_THEME_CSS+SIDEBAR_CSS),
      React.createElement(SideNav,{items:navItems,active:tab,onChange:setTab,open:navOpen,onClose:function(){setNavOpen(false);}}),
      React.createElement("div",{style:{flex:1,minWidth:0}},
      React.createElement("div",{style:{background:"rgba(255,255,255,.85)",backdropFilter:"blur(8px)",borderBottom:"1px solid #e9edf3",padding:"12px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50,gap:10,flexWrap:"wrap"}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},
          React.createElement("button",{className:"dl-burger",onClick:function(){setNavOpen(true);},style:{border:"1px solid #e3e8ef",background:"#fff",borderRadius:9,padding:"6px 11px",fontSize:16,cursor:"pointer"}},"☰"),
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff"}},React.createElement("span",{style:{width:9,height:9,borderRadius:"50%",background:net.color}}),React.createElement("span",{style:{fontWeight:600}},companyName+" — Admin"),React.createElement("span",{style:{fontSize:11.5,background:net.light,color:net.color,padding:"2px 9px",borderRadius:999}},net.label))),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
          React.createElement("button",{onClick:onLogout,style:ghost2},"Déconnexion"),
          React.createElement("div",{style:{width:38,height:38,borderRadius:"50%",background:net.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}},companyName.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()))),
      React.createElement("div",{className:"dl-admin",style:{padding:"22px 24px 40px",maxWidth:1500,margin:"0 auto"}},
        tab==="dashboard"&&React.createElement(CompanyDashboard,{company:coObj,net:net,myLeads:myLeads,go:setTab,onOpen:function(l){setPanel(l);}}),
        msg&&React.createElement("div",{style:{padding:"10px 14px",borderRadius:8,background:msg.type==="ok"?"#EAF3DE":"#FCEBEB",color:msg.type==="ok"?"#27500A":"#791F1F",marginBottom:14,fontSize:13,display:"flex",justifyContent:"space-between"}},msg.text,React.createElement("button",{onClick:function(){setMsg(null);},style:{background:"none",border:"none",cursor:"pointer",color:"inherit"}},"✕")),
        tab==="leads"&&React.createElement("div",null,
          selectedCount>0&&React.createElement("div",{style:{background:net.light,border:"1px solid "+net.color,borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}},
            React.createElement("span",{style:{fontWeight:500,color:net.color,fontSize:13}},selectedCount+" lead"+(selectedCount>1?"s":"")+" sélectionné"+(selectedCount>1?"s":"")),
            React.createElement("select",{value:assignTarget,onChange:function(e){setAssignTarget(e.target.value);},style:Object.assign({},inp,{flex:1,minWidth:160})},React.createElement("option",{value:""},"— Choisir un commercial —"),commerciaux.map(function(c){return React.createElement("option",{key:c.id,value:c.id},c.nom);})),
            React.createElement("button",{onClick:assign,disabled:!assignTarget||assigning,style:{padding:"7px 16px",borderRadius:8,border:"none",background:assignTarget?net.color:"#ccc",color:"#fff",fontWeight:500,fontSize:13,cursor:assignTarget?"pointer":"not-allowed"}},assigning?"…":"✓ Assigner"),
            React.createElement("button",{onClick:function(){setSelected({});},style:{padding:"7px 12px",borderRadius:8,border:"1px solid var(--color-border-secondary)",background:"transparent",fontSize:12,cursor:"pointer",color:"var(--color-text-secondary)"}},"Annuler")
          ),
          React.createElement("div",{style:{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}},
            React.createElement("button",{onClick:function(){setFilter("tous");},style:{padding:"6px 14px",borderRadius:8,border:"1px solid "+(filter==="tous"?net.color:"var(--color-border-secondary)"),background:filter==="tous"?net.light:"transparent",color:filter==="tous"?net.color:"var(--color-text-secondary)",fontSize:12,cursor:"pointer",fontWeight:filter==="tous"?500:400}},"Tous ("+counts.tous+")"),
            STATUSES.filter(function(s){return s.key!=="spam";}).map(function(s){return React.createElement("button",{key:s.key,onClick:function(){setFilter(s.key);},style:{padding:"6px 12px",borderRadius:8,border:"1px solid "+(filter===s.key?s.color:"var(--color-border-secondary)"),background:filter===s.key?s.bg:"transparent",color:filter===s.key?s.color:"var(--color-text-secondary)",fontSize:12,cursor:"pointer",fontWeight:filter===s.key?500:400}},s.label+" ("+(counts[s.key]||0)+")");})
          ),
          React.createElement("div",{style:{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}},
            React.createElement("input",{value:search,onChange:function(e){setSearch(e.target.value);},placeholder:"Rechercher par nom, email, ville, CP, campagne...",style:Object.assign({},inp,{flex:2,minWidth:200})}),
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:260}},
              React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}},"Du"),
              React.createElement("input",{type:"date",value:dateFrom,onChange:function(e){setDateFrom(e.target.value);},style:Object.assign({},inp,{flex:1})}),
              React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}},"au"),
              React.createElement("input",{type:"date",value:dateTo,onChange:function(e){setDateTo(e.target.value);},style:Object.assign({},inp,{flex:1})}),
              (dateFrom||dateTo)&&React.createElement("button",{onClick:function(){setDateFrom("");setDateTo("");},style:{padding:"5px 8px",borderRadius:6,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontSize:12,color:"var(--color-text-secondary)"}},"✕")
            ),
            React.createElement("button",{onClick:function(){setGroupByDept(function(v){return!v;});},style:{padding:"6px 12px",borderRadius:8,border:"1px solid "+(groupByDept?net.color:"var(--color-border-secondary)"),background:groupByDept?net.light:"transparent",color:groupByDept?net.color:"var(--color-text-secondary)",fontSize:12,cursor:"pointer",fontWeight:groupByDept?500:400,whiteSpace:"nowrap"}},"📍 "+(groupByDept?"Groupé par dpt":"Grouper par dpt"))
          ),
          makeSubAdminTable(paginated,shown,page,net,selected,toggleAll,toggleSelect,commerciaux,setPanel,groupByDept,filter,counts,setFilter,search,setSearch,dateFrom,setDateFrom,dateTo,setDateTo,setGroupByDept,assignTarget,setAssignTarget,selectedCount,assign,assigning,setSelected,PAGE_SIZE,companyId),
          !groupByDept&&React.createElement(Pagination,{page:page,total:shown.length,pageSize:PAGE_SIZE,onChange:function(p){setPage(p);window.scrollTo(0,0);},color:net.color})
        ),
        React.createElement("div",{style:{display:tab==="ca"?"block":"none"}},React.createElement(CAView,{company:{id:companyId,name:companyName,network:network},companies:companies||INIT_COMPANIES})),
        tab==="stats"&&React.createElement(LeadsStatsView,{company:{id:companyId,name:companyName,network:network},net:net}),
        tab==="commerciaux"&&React.createElement("div",null,
          React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",padding:20,marginBottom:16}},
            React.createElement("div",{style:{fontWeight:500,marginBottom:14}},"Créer un commercial"),
            React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
              React.createElement("input",{value:newNom,onChange:function(e){setNewNom(e.target.value);},placeholder:"Nom complet",style:Object.assign({},inp,{flex:2,minWidth:160})}),
              React.createElement("input",{value:newLogin,onChange:function(e){setNewLogin(e.target.value);},placeholder:"Login",style:Object.assign({},inp,{flex:1,minWidth:120})}),
              React.createElement("input",{value:newPwd,onChange:function(e){setNewPwd(e.target.value);},placeholder:"Mot de passe",style:Object.assign({},inp,{flex:1,minWidth:120})}),
              React.createElement("button",{onClick:createCommercial,disabled:creating||!newLogin||!newPwd||!newNom,style:{padding:"7px 16px",borderRadius:8,border:"none",background:net.color,color:"#fff",fontWeight:500,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",opacity:creating?0.7:1}},creating?"…":"+ Créer")
            )
          ),
          commerciaux.length===0
            ? React.createElement("div",{style:{padding:32,textAlign:"center",color:"var(--color-text-secondary)",background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)"}},"Aucun commercial créé.")
            : React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
                commerciaux.map(function(c){var assignedCount=myLeads.filter(function(l){return l.assignedTo===c.id;}).length;return React.createElement("div",{key:c.id,style:{background:"var(--color-background-primary)",borderRadius:9,border:"1px solid var(--color-border-tertiary)",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}},React.createElement("div",null,React.createElement("div",{style:{fontWeight:500,fontSize:14}},c.nom),React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}},"Login : ",React.createElement("b",null,c.login)," · ",assignedCount," lead"+(assignedCount>1?"s":"")+" assigné"+(assignedCount>1?"s":""))),React.createElement("button",{onClick:function(){deleteCommercial(c.id);},style:{padding:"5px 12px",borderRadius:7,border:"1px solid #F7C1C1",background:"transparent",color:"#A32D2D",fontSize:12,cursor:"pointer"}},"🗑 Supprimer"));})
              )
        )
      )
      ),
      panel&&React.createElement(LeadPanel,{lead:panel,color:net.color,companyId:companyId,onClose:function(){setPanel(null);},onSave:saveLeadUpdate})
    );
  };
}

var MH76AdminView=makeSubAdminView("c19","76 MH","humidite","mh76_commerciaux","mh76_commerciaux");
var MH30AdminView=makeSubAdminView("c14","30 MH","humidite","mh30_commerciaux","mh30_commerciaux");
var MH83AdminView=makeSubAdminView("c20","83 MH","humidite","mh83_commerciaux","mh83_commerciaux");
var ATM52AdminView=makeSubAdminView("c5","52 ATM","renovation","atm52_commerciaux","atm52_commerciaux");

function makeSubCommercialView(companyId,companyName,network,dbTable){
  return function(props){
    var commercial=props.commercial,leads=props.leads,setLeads=props.setLeads,onLogout=props.onLogout;
    var net=NETWORKS[network];
    var [panel,setPanel]=useState(null);var [ctab,setCtab]=useState("dashboard"),[cnav,setCnav]=useState(false);var [filter,setFilter]=useState("tous");var [search,setSearch]=useState("");var [sortDesc,setSortDesc]=useState(true);var [page,setPage]=useState(1);
    var myLeads=useMemo(function(){return leads.filter(function(l){return l.companyId===companyId&&l.assignedTo===commercial.id;});},[leads,commercial.id]);
    var shown=useMemo(function(){var filtered=myLeads.filter(function(l){var matchStatus=filter==="spam"?l.status==="spam":filter==="tous"?l.status!=="spam":l.status===filter;var q=search.toLowerCase();var matchSearch=!q||[l.firstName,l.lastName,l.email,l.phone,l.city,l.campaign].some(function(v){return(v||"").toLowerCase().includes(q);});return matchStatus&&matchSearch;});filtered.sort(function(a,b){var da=parseLeadDate(a.importedAt)||new Date(0),db=parseLeadDate(b.importedAt)||new Date(0);return sortDesc?db-da:da-db;});return filtered;},[myLeads,filter,search,sortDesc]);
    var counts=useMemo(function(){var r={tous:myLeads.filter(function(l){return l.status!=="spam";}).length};STATUSES.forEach(function(s){r[s.key]=myLeads.filter(function(l){return l.status===s.key;}).length;});return r;},[myLeads]);
    var paginated=shown.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
    async function saveLeadUpdate(id,status,note){await dbUpdate("leads","id=eq."+id,{status:status,note:note});setLeads(function(prev){return prev.map(function(l){return l.id===id?Object.assign({},l,{status:status,note:note}):l;});});}
    var navItems=[["dashboard","🏠","Tableau de bord"],["leads","👥","Mes leads"]];
    var coObj={id:companyId,name:companyName,network:network};
    var ghost2={padding:"8px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff",cursor:"pointer",fontSize:13,color:"#4a5565",fontWeight:500};
    return React.createElement("div",{style:{minHeight:"100vh",display:"flex",background:"linear-gradient(180deg,#eef3fa 0%,#f7f9fc 40%)",fontSize:14,color:"#1a2433"}},
      React.createElement("style",null,DOFE_CSS+ADMIN_THEME_CSS+SIDEBAR_CSS),
      React.createElement(SideNav,{items:navItems,active:ctab,onChange:setCtab,open:cnav,onClose:function(){setCnav(false);}}),
      React.createElement("div",{style:{flex:1,minWidth:0}},
      React.createElement("div",{style:{background:"rgba(255,255,255,.85)",backdropFilter:"blur(8px)",borderBottom:"1px solid #e9edf3",padding:"12px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50,gap:10,flexWrap:"wrap"}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},
          React.createElement("button",{className:"dl-burger",onClick:function(){setCnav(true);},style:{border:"1px solid #e3e8ef",background:"#fff",borderRadius:9,padding:"6px 11px",fontSize:16,cursor:"pointer"}},"☰"),
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",borderRadius:10,border:"1px solid #e3e8ef",background:"#fff"}},React.createElement("span",{style:{width:9,height:9,borderRadius:"50%",background:net.color}}),React.createElement("span",{style:{fontWeight:600}},commercial.nom+" · "+companyName),React.createElement("span",{style:{fontSize:11.5,background:net.light,color:net.color,padding:"2px 9px",borderRadius:999}},net.label))),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
          React.createElement("button",{onClick:onLogout,style:ghost2},"Déconnexion"),
          React.createElement("div",{style:{width:38,height:38,borderRadius:"50%",background:net.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}},commercial.nom.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()))),
      React.createElement("div",{className:"dl-admin",style:{padding:"22px 24px 40px",maxWidth:1500,margin:"0 auto"}},
        ctab==="dashboard"&&React.createElement(CompanyDashboard,{company:coObj,net:net,myLeads:myLeads,hideCa:true,go:setCtab,onOpen:function(l){setPanel(l);}}),
        ctab==="leads"&&React.createElement("div",null,
        React.createElement("div",{style:{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}},
          React.createElement("button",{onClick:function(){setFilter("tous");},style:{padding:"6px 14px",borderRadius:8,border:"1px solid "+(filter==="tous"?net.color:"var(--color-border-secondary)"),background:filter==="tous"?net.light:"transparent",color:filter==="tous"?net.color:"var(--color-text-secondary)",fontSize:13,cursor:"pointer",fontWeight:filter==="tous"?500:400}},"Tous ("+counts.tous+")"),
          STATUSES.filter(function(s){return s.key!=="spam";}).map(function(s){return React.createElement("button",{key:s.key,onClick:function(){setFilter(s.key);},style:{padding:"6px 14px",borderRadius:8,border:"1px solid "+(filter===s.key?s.color:"var(--color-border-secondary)"),background:filter===s.key?s.bg:"transparent",color:filter===s.key?s.color:"var(--color-text-secondary)",fontSize:13,cursor:"pointer",fontWeight:filter===s.key?500:400}},s.label+" ("+(counts[s.key]||0)+")");})
        ),
        React.createElement("input",{value:search,onChange:function(e){setSearch(e.target.value);},placeholder:"Rechercher…",style:Object.assign({},inp,{width:"100%",boxSizing:"border-box",marginBottom:12})}),
        myLeads.length===0
          ? React.createElement("div",{style:{textAlign:"center",padding:60,background:"var(--color-background-primary)",borderRadius:12,border:"1px solid var(--color-border-tertiary)",color:"var(--color-text-secondary)"}},React.createElement("div",{style:{fontSize:32,marginBottom:10}},"📭"),React.createElement("div",{style:{fontWeight:500}},"Aucun contact assigné pour le moment"))
          : React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",overflowX:"auto"}},
              React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:700}},
                React.createElement("thead",null,React.createElement("tr",{style:{background:"var(--color-background-secondary)",fontSize:11,color:"var(--color-text-secondary)"}},["Contact","Email","Téléphone","CP / Ville","Date","Origine","Statut","Action"].map(function(h){return React.createElement("th",{key:h,style:{padding:"8px 12px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},h);}))),
                React.createElement("tbody",null,paginated.map(function(l,i){return React.createElement("tr",{key:l.id,style:{borderBottom:"1px solid var(--color-border-tertiary)",background:i%2===0?"transparent":"var(--color-background-secondary)"}},React.createElement("td",{style:{padding:"9px 12px",fontWeight:500}},l.firstName+" "+l.lastName),React.createElement("td",{style:{padding:"9px 12px",fontSize:12}},l.email?React.createElement("a",{href:"mailto:"+l.email,style:{color:net.color,textDecoration:"none"}},l.email):"—"),React.createElement("td",{style:{padding:"9px 12px",fontSize:12}},l.phone?React.createElement("a",{href:"tel:"+l.phone,style:{color:net.color,textDecoration:"none"}},l.phone):"—"),React.createElement("td",{style:{padding:"9px 12px",fontSize:12}},fmtVille(l)),React.createElement("td",{style:{padding:"9px 12px",fontSize:12,color:"var(--color-text-secondary)"}},fmtDate(l.importedAt)),React.createElement("td",{style:{padding:"9px 12px"}},React.createElement(SourceBadge,{source:l.source})),React.createElement("td",{style:{padding:"9px 12px"}},React.createElement(Badge,{statusKey:l.status,companyId:companyId})),React.createElement("td",{style:{padding:"9px 12px"}},React.createElement("button",{onClick:function(){setPanel(l);},style:{padding:"4px 10px",borderRadius:6,border:"1px solid "+net.color,background:"transparent",color:net.color,fontSize:12,cursor:"pointer"}},"Gérer")));})
                )
              )
            ),
        React.createElement(Pagination,{page:page,total:shown.length,pageSize:PAGE_SIZE,onChange:function(p){setPage(p);window.scrollTo(0,0);},color:net.color})
        )
      )
      ),
      panel&&React.createElement(LeadPanel,{lead:panel,color:net.color,companyId:companyId,onClose:function(){setPanel(null);},onSave:saveLeadUpdate})
    );
  };
}

var MH76CommercialView=makeSubCommercialView("c19","76 MH","humidite","mh76_commerciaux");
var MH30CommercialView=makeSubCommercialView("c14","30 MH","humidite","mh30_commerciaux");
var MH83CommercialView=makeSubCommercialView("c20","83 MH","humidite","mh83_commerciaux");
var ATM52CommercialView=makeSubCommercialView("c5","52 ATM","renovation","atm52_commerciaux");

export default function App(){
  var [session,setSession]=useState(function(){try{var s=sessionStorage.getItem("leads_session");return s?JSON.parse(s):null;}catch(e){return null;}});
  var [leads,setLeads]=useState([]);
  var [companies,setCompanies]=useState(INIT_COMPANIES);
  var [mh76Commerciaux,setMh76Commerciaux]=useState([]);
  var [mh30Commerciaux,setMh30Commerciaux]=useState([]);
  var [mh83Commerciaux,setMh83Commerciaux]=useState([]);
  var [atm52Commerciaux,setAtm52Commerciaux]=useState([]);
  var [loading,setLoading]=useState(true);
  var [dbError,setDbError]=useState(null);
  function handleLogin(s){setSession(s);try{sessionStorage.setItem("leads_session",JSON.stringify(s));}catch(e){}}
  function handleLogout(){setSession(null);try{sessionStorage.removeItem("leads_session");}catch(e){}}
  useEffect(function(){
    async function load(){
      setLoading(true);
      try{
        var rows=await dbSelect("leads","order=created_at.desc");
        if(Array.isArray(rows))setLeads(rows.map(function(r){return Object.assign(rowToLead(r),{assignedTo:r.assigned_to||null});}));
        var cos=await dbSelect("companies");
        if(Array.isArray(cos)&&cos.length>0){setCompanies(cos.map(rowToCompany));}
        else{await dbUpsert("companies",INIT_COMPANIES.map(companyToRow));setCompanies(INIT_COMPANIES);}
        var comms=await dbSelect("mh76_commerciaux","order=created_at.asc");if(Array.isArray(comms))setMh76Commerciaux(comms);
        var comms30=await dbSelect("mh30_commerciaux","order=created_at.asc");if(Array.isArray(comms30))setMh30Commerciaux(comms30);
        var comms83=await dbSelect("mh83_commerciaux","order=created_at.asc");if(Array.isArray(comms83))setMh83Commerciaux(comms83);
        var comms52=await dbSelect("atm52_commerciaux","order=created_at.asc");if(Array.isArray(comms52))setAtm52Commerciaux(comms52);
      }catch(e){setDbError(e&&e.message?e.message:"Erreur réseau");}
      setLoading(false);
    }
    load();
  },[]);
  if(loading)return React.createElement("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:DOFE_BG,flexDirection:"column",gap:22,padding:20,boxSizing:"border-box"}},
    React.createElement("style",null,DOFE_CSS),
    React.createElement("div",{style:{background:"#fff",borderRadius:18,padding:"22px 28px",boxShadow:"0 20px 60px rgba(0,0,0,.35)",animation:"dofePulse 2s ease-in-out infinite"}},React.createElement("img",{src:LOGO_SRC,alt:"Dofelink",style:{display:"block",width:240,maxWidth:"65vw"}})),
    React.createElement("div",{style:{width:180,height:4,borderRadius:4,background:"rgba(255,255,255,.25)",overflow:"hidden"}},React.createElement("div",{style:{width:"40%",height:"100%",borderRadius:4,background:"#fff",animation:"dofeBar 1.2s ease-in-out infinite"}})),
    React.createElement("div",{style:{color:"#fff",fontWeight:500,fontSize:14}},"Chargement de vos leads…"));
  if(dbError)return React.createElement("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-background-tertiary)",flexDirection:"column",gap:12,padding:24}},React.createElement("div",{style:{fontSize:28}},"⚠️"),React.createElement("div",{style:{fontWeight:500,color:"#A32D2D"}},"Erreur de connexion Supabase"),React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)"}},dbError));
  if(!session)return React.createElement(LoginScreen,{onLogin:handleLogin,companies:companies,mh76Commerciaux:mh76Commerciaux,mh30Commerciaux:mh30Commerciaux,mh83Commerciaux:mh83Commerciaux,atm52Commerciaux:atm52Commerciaux});
  if(session.role==="admin")return React.createElement(AdminView,{leads:leads,setLeads:setLeads,companies:companies,setCompanies:setCompanies,onLogout:handleLogout});
  if(session.role==="mh76admin")return React.createElement(MH76AdminView,{leads:leads,setLeads:setLeads,companies:companies,onLogout:handleLogout});
  if(session.role==="mh30admin")return React.createElement(MH30AdminView,{leads:leads,setLeads:setLeads,companies:companies,onLogout:handleLogout});
  if(session.role==="mh83admin")return React.createElement(MH83AdminView,{leads:leads,setLeads:setLeads,companies:companies,onLogout:handleLogout});
  if(session.role==="atm52admin")return React.createElement(ATM52AdminView,{leads:leads,setLeads:setLeads,companies:companies,onLogout:handleLogout});
  if(session.role==="mh76commercial"){var comm=mh76Commerciaux.find(function(c){return c.id===session.commercialId;});if(!comm)return React.createElement(LoginScreen,{onLogin:handleLogin,companies:companies,mh76Commerciaux:mh76Commerciaux,mh30Commerciaux:mh30Commerciaux,mh83Commerciaux:mh83Commerciaux,atm52Commerciaux:atm52Commerciaux});return React.createElement(MH76CommercialView,{commercial:comm,leads:leads,setLeads:setLeads,onLogout:handleLogout});}
  if(session.role==="mh30commercial"){var comm30=mh30Commerciaux.find(function(c){return c.id===session.commercialId;});if(!comm30)return React.createElement(LoginScreen,{onLogin:handleLogin,companies:companies,mh76Commerciaux:mh76Commerciaux,mh30Commerciaux:mh30Commerciaux,mh83Commerciaux:mh83Commerciaux,atm52Commerciaux:atm52Commerciaux});return React.createElement(MH30CommercialView,{commercial:comm30,leads:leads,setLeads:setLeads,onLogout:handleLogout});}
  if(session.role==="mh83commercial"){var comm83=mh83Commerciaux.find(function(c){return c.id===session.commercialId;});if(!comm83)return React.createElement(LoginScreen,{onLogin:handleLogin,companies:companies,mh76Commerciaux:mh76Commerciaux,mh30Commerciaux:mh30Commerciaux,mh83Commerciaux:mh83Commerciaux,atm52Commerciaux:atm52Commerciaux});return React.createElement(MH83CommercialView,{commercial:comm83,leads:leads,setLeads:setLeads,onLogout:handleLogout});}
  if(session.role==="atm52commercial"){var comm52=atm52Commerciaux.find(function(c){return c.id===session.commercialId;});if(!comm52)return React.createElement(LoginScreen,{onLogin:handleLogin,companies:companies,mh76Commerciaux:mh76Commerciaux,mh30Commerciaux:mh30Commerciaux,mh83Commerciaux:mh83Commerciaux,atm52Commerciaux:atm52Commerciaux});return React.createElement(ATM52CommercialView,{commercial:comm52,leads:leads,setLeads:setLeads,onLogout:handleLogout});}
  var company=companies.find(function(c){return c.id===session.companyId;});
  if(!company)return React.createElement(LoginScreen,{onLogin:handleLogin,companies:companies,mh76Commerciaux:mh76Commerciaux,mh30Commerciaux:mh30Commerciaux,mh83Commerciaux:mh83Commerciaux,atm52Commerciaux:atm52Commerciaux});
  return React.createElement(CompanyView,{company:company,leads:leads,setLeads:setLeads,companies:companies,onLogout:handleLogout});
}
