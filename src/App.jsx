import React, { useState, useRef, useMemo, useEffect } from "react";

const SUPABASE_URL  = "https://okbtkvjexxhjmbdmorgg.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYnRrdmpleHhoam1iZG1vcmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Mjk3MzcsImV4cCI6MjA5MDEwNTczN30.vCPz-5Kj3F-NdFnw27T06qU4uhuYkGSPxUeC8S9o8dQ";
const HEADERS = { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON, "Content-Type": "application/json" };

async function dbSelect(table, query) {
  // Supabase limite à 1000 par défaut — on pagine pour tout récupérer
  var allRows = [];
  var offset = 0;
  var pageSize = 1000;
  while (true) {
    var q = (query || "") + "&limit=" + pageSize + "&offset=" + offset;
    var r = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + q, {
      headers: Object.assign({}, HEADERS, { "Prefer": "count=none" })
    });
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
  // Insérer par lots de 500 pour éviter les timeouts sur gros fichiers
  var batchSize = 500;
  for (var i = 0; i < rows.length; i += batchSize) {
    var batch = rows.slice(i, i + batchSize);
    var r = await fetch(SUPABASE_URL + "/rest/v1/" + table, {
      method: "POST",
      headers: Object.assign({}, HEADERS, { "Prefer": "return=minimal" }),
      body: JSON.stringify(batch)
    });
    if (!r.ok) throw new Error(await r.text());
  }
}
async function dbInsertOne(table, row) {
  var r = await fetch(SUPABASE_URL + "/rest/v1/" + table, { method: "POST", headers: Object.assign({}, HEADERS, { "Prefer": "return=minimal" }), body: JSON.stringify(row) });
  if (!r.ok) throw new Error(await r.text());
}
async function dbUpdate(table, match, data) {
  var r = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + match, { method: "PATCH", headers: Object.assign({}, HEADERS, { "Prefer": "return=minimal" }), body: JSON.stringify(data) });
  if (!r.ok) throw new Error(await r.text());
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
  renovation: { label: "Rénovation ATM", color: "#185FA5", light: "#E6F1FB" },
  humidite:   { label: "MurHumide",      color: "#0F6E56", light: "#E1F5EE" }
};
var STATUSES = [
  { key: "nouveau",  label: "Nouveau",    bg: "#E6F1FB", color: "#0C447C" },
  { key: "contacte", label: "Contacté",   bg: "#FAEEDA", color: "#633806" },
  { key: "rappeler", label: "À rappeler", bg: "#EEEDFE", color: "#3C3489" },
  { key: "gagne",    label: "Gagné",      bg: "#EAF3DE", color: "#27500A" },
  { key: "perdu",    label: "Perdu",      bg: "#FCEBEB", color: "#791F1F" },
  { key: "spam",     label: "Spam",       bg: "#F0F0F0", color: "#666666" }
];
var INIT_COMPANIES = [
  { id:"c1",  name:"Atriome", network:"renovation", login:"atriome", password:"1234" },
  { id:"c2",  name:"13 ATM",  network:"renovation", login:"atm13",   password:"1234" },
  { id:"c3",  name:"14 ATM",  network:"renovation", login:"atm14",   password:"1234" },
  { id:"c4",  name:"35 ATM",  network:"renovation", login:"atm35",   password:"1234" },
  { id:"c5",  name:"52 ATM",  network:"renovation", login:"atm52",   password:"1234" },
  { id:"c6",  name:"56 ATM",  network:"renovation", login:"atm56",   password:"1234" },
  { id:"c7",  name:"60 ATM",  network:"renovation", login:"atm60",   password:"1234" },
  { id:"c8",  name:"69 ATM",  network:"renovation", login:"atm69",   password:"1234" },
  { id:"c9",  name:"78 ATM",  network:"renovation", login:"atm78",   password:"1234" },
  { id:"c10", name:"83 ATM",  network:"renovation", login:"atm83",   password:"1234" },
  { id:"c11", name:"84 ATM",  network:"renovation", login:"atm84",   password:"1234" },
  { id:"c12", name:"94 ATM",  network:"renovation", login:"atm94",   password:"1234" },
  { id:"c13", name:"95 ATMR", network:"renovation", login:"atmr95",  password:"1234" },
  { id:"c14", name:"MH30",    network:"humidite",   login:"mh30",    password:"1234" },
  { id:"c15", name:"MH44",    network:"humidite",   login:"mh44",    password:"1234" },
  { id:"c16", name:"MH56",    network:"humidite",   login:"mh56",    password:"1234" },
  { id:"c17", name:"MH59",    network:"humidite",   login:"mh59",    password:"1234" },
  { id:"c18", name:"MH69",    network:"humidite",   login:"mh69",    password:"1234" },
  { id:"c19", name:"MH76",    network:"humidite",   login:"mh76",    password:"1234" },
  { id:"c20", name:"MH83",    network:"humidite",   login:"mh83",    password:"1234" },
  { id:"c21", name:"MH91",    network:"humidite",   login:"mh91",    password:"1234" }
];
var ADMIN = { login: "admin", password: "admin123" };
var PAGE_SIZE = 20;

function rowToLead(r) {
  return { id:r.id, companyId:r.company_id, firstName:r.first_name, lastName:r.last_name, email:r.email, phone:r.phone, address:r.address, city:r.city, zip:r.zip, message:r.message, campaign:r.campaign, importedAt:r.imported_at, importId:r.import_id||null, importLabel:r.import_label||null, status:r.status||"nouveau", note:r.note||"" };
}
function leadToRow(l) {
  return { id:l.id, company_id:l.companyId, first_name:l.firstName, last_name:l.lastName, email:l.email, phone:l.phone, address:l.address, city:l.city, zip:l.zip, message:l.message, campaign:l.campaign, imported_at:l.importedAt, import_id:l.importId||null, import_label:l.importLabel||null, status:l.status||"nouveau", note:l.note||"" };
}
function rowToCompany(r) { return { id:r.id, name:r.name, network:r.network, login:r.login, password:r.password }; }
function companyToRow(c) { return { id:c.id, name:c.name, network:c.network, login:c.login, password:c.password }; }

function parseLeadDate(str) {
  if (!str) return null;
  var m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(m[3] + "-" + m[2] + "-" + m[1]);
  var d = new Date(str);
  return isNaN(d) ? null : d;
}
function fmtDate(str) {
  if (!str) return "—";
  var m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return m[1] + "/" + m[2] + "/" + m[3];
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) return str.slice(0,10).split("-").reverse().join("/");
  return str.slice(0,10);
}
function fmtTime(str) {
  if (!str) return "";
  var m = str.match(/(\d{2}):(\d{2})/);
  return m ? m[1] + ":" + m[2] : "";
}

// Parser format Google Ads (standard)
function parseCSV(text) {
  var clean = text.replace(/^\uFEFF/, "");
  var lines = clean.trim().split(/\r?\n/).map(function(l){ return l.trim(); }).filter(Boolean);
  if (lines.length < 2) return [];
  var sep = lines[0].includes(";") ? ";" : ",";
  function norm(s) { return s.replace(/^"|"$/g,"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").trim(); }
  var headers = lines[0].split(sep).map(norm);
  function idx() { var keys = Array.prototype.slice.call(arguments); return headers.findIndex(function(h){ return keys.some(function(k){ return h.includes(k); }); }); }
  var iFullName=idx("nom complet","full name"), iFirst=idx("prenom","first name"), iLast=idx("last name","lastname");
  var iPhone=idx("telephone","phone","mobile","n de tel","numero"), iEmail=idx("email","mail","e mail");
  var iZip=idx("code postal","postal","zip","cp"), iCity=idx("ville","city"), iAddr=idx("adresse","address","rue");
  var iMsg=idx("message","commentaire","note","remarque","phase","description"), iDate=idx("date","heure","soumis","envoi"), iCampaign=idx("campagne","campaign");
  function splitLine(line) {
    var res=[], cur="", inQ=false;
    for (var ci=0; ci<line.length; ci++) { var ch=line[ci]; if(ch==='"'){inQ=!inQ;continue;} if(ch===sep&&!inQ){res.push(cur.trim());cur="";continue;} cur+=ch; }
    res.push(cur.trim()); return res;
  }
  return lines.slice(1).map(function(line, i) {
    var cols=splitLine(line);
    function g(j){ return (j>=0&&j<cols.length)?cols[j].replace(/^"|"$/g,"").trim():""; }
    var fn=g(iFirst)||"", ln=g(iLast)||"";
    if (!fn&&!ln&&iFullName>=0) { var pts=g(iFullName).trim().split(/\s+/); fn=pts[0]||""; ln=pts.slice(1).join(" ")||""; }
    if (!fn&&!g(iPhone)&&!g(iEmail)) return null;
    return { id:"l_"+Date.now()+"_"+i+"_"+Math.random().toString(36).slice(2,6), firstName:fn||"—", lastName:ln, email:g(iEmail), phone:g(iPhone), address:g(iAddr), city:g(iCity), zip:g(iZip), message:g(iMsg), campaign:g(iCampaign), importedAt:g(iDate)||new Date().toLocaleString("fr-FR"), status:"nouveau", note:"", companyId:null, importId:null, importLabel:null };
  }).filter(Boolean);
}

// Détection format MH59 / contacts entreprises (colonnes : Activity;Nom;Adresse;Code postal;Ville;Téléphone;Mobile;Mail...)
function isContactFormat(headers) {
  return headers.some(function(h){ return h.includes("activity")||h.includes("siren")||h.includes("siret")||h.includes("naf"); });
}
function parseContactCSV(text) {
  // Gère encodage CP1252 / ISO-8859 via remplacement basique
  var clean = text.replace(/^\uFEFF/, "");
  var lines = clean.trim().split(/\r?\n/).map(function(l){ return l.trim(); }).filter(Boolean);
  if (lines.length < 2) return [];
  var sep = ";";
  function norm(s) { return s.replace(/^"|"$/g,"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").trim(); }
  var headers = lines[0].split(sep).map(norm);
  function idx() { var keys=Array.prototype.slice.call(arguments); return headers.findIndex(function(h){ return keys.some(function(k){ return h.includes(k); }); }); }
  var iNom=idx("nom"), iAddr=idx("addresse","adresse","address"), iZip=idx("code postal","postal","cp");
  var iCity=idx("ville","city"), iPhone=idx("telephone"), iMobile=idx("mobile"), iEmail=idx("mail","email");
  var iActivity=idx("activity","activit");
  function splitLine(line) {
    var res=[], cur="", inQ=false;
    for (var ci=0; ci<line.length; ci++) { var ch=line[ci]; if(ch==='"'){inQ=!inQ;continue;} if(ch===sep&&!inQ){res.push(cur.trim());cur="";continue;} cur+=ch; }
    res.push(cur.trim()); return res;
  }
  return lines.slice(1).map(function(line, i) {
    var cols=splitLine(line);
    function g(j){ return (j>=0&&j<cols.length)?cols[j].replace(/^"|"$/g,"").trim():""; }
    var nom=g(iNom)||"—";
    var phone=g(iMobile)||g(iPhone); // priorité mobile
    var email=g(iEmail);
    var city=g(iCity), zip=g(iZip), addr=g(iAddr);
    var activity=g(iActivity);
    if(!nom&&!phone&&!email) return null;
    return {
      id:"l_"+Date.now()+"_"+i+"_"+Math.random().toString(36).slice(2,6),
      firstName:nom, lastName:"",
      email:email, phone:phone,
      address:addr, city:city, zip:zip,
      message:activity?"Activité : "+activity:"",
      campaign:"Import contact entreprise",
      importedAt:new Date().toLocaleString("fr-FR"),
      status:"nouveau", note:"", companyId:null, importId:null, importLabel:null
    };
  }).filter(Boolean);
}

// Auto-détection du format CSV
function parseAutoCSV(text) {
  var clean = text.replace(/^\uFEFF/, "");
  var firstLine = (clean.split(/\r?\n/)[0]||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  var headers = firstLine.split(";").map(function(h){ return h.replace(/^"|"$/g,"").trim(); });
  if (isContactFormat(headers)) return { leads: parseContactCSV(text), format: "contact" };
  return { leads: parseCSV(text), format: "googleads" };
}

function exportCSV(leads, name) {
  var h=["Prénom","Nom","Email","Téléphone","Adresse","Ville","CP","Message","Campagne","Statut","Note","Date"];
  var rows=leads.map(function(l){ return [l.firstName,l.lastName,l.email,l.phone,l.address,l.city,l.zip,l.message,l.campaign,(STATUSES.find(function(s){return s.key===l.status;})||STATUSES[0]).label,l.note,l.importedAt]; });
  var csv=[h].concat(rows).map(function(r){ return r.map(function(v){ return '"'+(v||"").replace(/"/g,'""')+'"'; }).join(";"); }).join("\n");
  var a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
  a.download="leads_"+name.replace(/\s/g,"_")+"_"+new Date().toISOString().slice(0,10)+".csv"; a.click();
}

var inp = { padding:"7px 10px", borderRadius:8, border:"1px solid var(--color-border-secondary)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontSize:13 };

function Badge(props) {
  var s = STATUSES.find(function(x){ return x.key===props.statusKey; }) || STATUSES[0];
  return React.createElement("span", { style:{ fontSize:11, padding:"2px 9px", borderRadius:10, background:s.bg, color:s.color, fontWeight:500, whiteSpace:"nowrap" } }, s.label);
}

function Pagination(props) {
  var page=props.page, total=props.total, pageSize=props.pageSize, onChange=props.onChange;
  var totalPages = Math.max(1, Math.ceil(total/pageSize));
  if (totalPages <= 1) return null;
  var pages = [];
  for (var i=1; i<=totalPages; i++) pages.push(i);
  return React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:6, justifyContent:"center", marginTop:16, flexWrap:"wrap" } },
    React.createElement("button", { onClick:function(){onChange(page-1);}, disabled:page<=1, style:{ padding:"5px 12px", borderRadius:7, border:"1px solid var(--color-border-secondary)", background:"transparent", cursor:page<=1?"not-allowed":"pointer", fontSize:13, color:"var(--color-text-secondary)", opacity:page<=1?0.4:1 } }, "←"),
    pages.map(function(p){
      var active = p===page;
      return React.createElement("button", { key:p, onClick:function(){onChange(p);}, style:{ padding:"5px 10px", borderRadius:7, border:"1px solid "+(active?props.color:"var(--color-border-secondary)"), background:active?props.color:"transparent", color:active?"#fff":"var(--color-text-secondary)", cursor:"pointer", fontSize:13, fontWeight:active?500:400, minWidth:34 } }, p);
    }),
    React.createElement("button", { onClick:function(){onChange(page+1);}, disabled:page>=totalPages, style:{ padding:"5px 12px", borderRadius:7, border:"1px solid var(--color-border-secondary)", background:"transparent", cursor:page>=totalPages?"not-allowed":"pointer", fontSize:13, color:"var(--color-text-secondary)", opacity:page>=totalPages?0.4:1 } }, "→"),
    React.createElement("span", { style:{ fontSize:12, color:"var(--color-text-secondary)", marginLeft:8 } }, "Page "+page+" / "+totalPages+" · "+total+" lead"+(total>1?"s":""))
  );
}

function LoginScreen(props) {
  var onLogin=props.onLogin, companies=props.companies;
  var [login,setLogin]=useState(""), [pass,setPass]=useState(""), [err,setErr]=useState("");
  function submit() {
    if (login===ADMIN.login&&pass===ADMIN.password) { onLogin({role:"admin"}); return; }
    var co=companies.find(function(c){ return c.login===login&&c.password===pass; });
    if (co) {
      dbInsertOne("login_history",{ id:"lh_"+Date.now()+"_"+Math.random().toString(36).slice(2,6), company_id:co.id, company_name:co.name }).catch(function(){});
      onLogin({role:"company",companyId:co.id}); return;
    }
    setErr("Identifiants incorrects.");
  }
  return React.createElement("div", { style:{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--color-background-tertiary)" } },
    React.createElement("div", { style:{ background:"var(--color-background-primary)", borderRadius:14, border:"1px solid var(--color-border-tertiary)", width:380, padding:28 } },
      React.createElement("div", { style:{ fontWeight:500, fontSize:17, marginBottom:2 } }, "Plateforme Leads"),
      React.createElement("div", { style:{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:20 } }, "ATM Rénovation · MurHumide"),
      React.createElement("div", { style:{ marginBottom:10 } },
        React.createElement("div", { style:{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:4 } }, "Identifiant"),
        React.createElement("input", { value:login, onChange:function(e){setLogin(e.target.value);}, placeholder:"ex: atm83", style:Object.assign({},inp,{width:"100%",boxSizing:"border-box"}) })
      ),
      React.createElement("div", { style:{ marginBottom:14 } },
        React.createElement("div", { style:{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:4 } }, "Mot de passe"),
        React.createElement("input", { value:pass, type:"password", onChange:function(e){setPass(e.target.value);}, onKeyDown:function(e){if(e.key==="Enter")submit();}, style:Object.assign({},inp,{width:"100%",boxSizing:"border-box"}) })
      ),
      err&&React.createElement("div", { style:{ color:"#A32D2D", fontSize:12, marginBottom:10 } }, err),
      React.createElement("button", { onClick:submit, style:{ width:"100%", padding:"9px 0", borderRadius:8, border:"none", background:"#185FA5", color:"#fff", fontWeight:500, fontSize:14, cursor:"pointer" } }, "Se connecter")
    )
  );
}

function LeadPanel(props) {
  var lead=props.lead, onClose=props.onClose, onSave=props.onSave, color=props.color;
  var [status,setStatus]=useState(lead.status), [note,setNote]=useState(lead.note||"");
  var items=[["📧 Email",lead.email||"—"],["📞 Téléphone",lead.phone||"—"],["📍 Ville",lead.city||(lead.zip?"CP "+lead.zip:"—")],["📅 Reçu le",fmtDate(lead.importedAt)]];
  return React.createElement("div", { style:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(2px)" } },
    React.createElement("div", { style:{ background:"#ffffff", borderRadius:14, width:440, maxWidth:"95vw", border:"1px solid #e0e0e0", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" } },
      React.createElement("div", { style:{ background:color, padding:"14px 18px", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" } },
        React.createElement("div", { style:{ fontWeight:500, fontSize:15 } }, lead.firstName+" "+lead.lastName),
        React.createElement("button", { onClick:onClose, style:{ background:"none", border:"none", color:"#fff", fontSize:18, cursor:"pointer" } }, "✕")
      ),
      React.createElement("div", { style:{ padding:20, background:"#ffffff", color:"#1a1a18" } },
        React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14, fontSize:13 } },
          items.map(function(item){
            return React.createElement("div", { key:item[0], style:{ background:"#f5f5f3", borderRadius:8, padding:"8px 10px" } },
              React.createElement("div", { style:{ fontSize:11, color:"#6b6b67", marginBottom:2 } }, item[0]),
              React.createElement("div", { style:{ fontWeight:500, wordBreak:"break-all", color:"#1a1a18" } }, item[1])
            );
          })
        ),
        lead.campaign&&React.createElement("div", { style:{ background:"#f5f5f3", borderRadius:8, padding:"8px 10px", marginBottom:10, fontSize:12 } }, React.createElement("span",{style:{color:"#6b6b67"}},"Campagne : "), React.createElement("b",{style:{color:"#1a1a18"}},lead.campaign)),
        lead.message&&React.createElement("div", { style:{ background:"#f5f5f3", borderRadius:8, padding:"8px 10px", marginBottom:14, fontSize:13 } },
          React.createElement("div",{style:{fontSize:11,color:"#6b6b67",marginBottom:2}},"Message"),
          React.createElement("div",{style:{fontStyle:"italic",color:"#1a1a18"}},'"'+lead.message+'"')
        ),
        React.createElement("div", { style:{ marginBottom:12 } },
          React.createElement("div",{style:{fontSize:11,color:"#6b6b67",marginBottom:6}},"Statut"),
          React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
            STATUSES.map(function(s){
              return React.createElement("button",{key:s.key,onClick:function(){setStatus(s.key);},style:{padding:"4px 12px",borderRadius:8,border:"1px solid "+(status===s.key?s.color:"#d0d0cc"),background:status===s.key?s.bg:"transparent",color:status===s.key?s.color:"#6b6b67",fontSize:12,cursor:"pointer",fontWeight:status===s.key?500:400}},s.label);
            })
          )
        ),
        React.createElement("div",{style:{marginBottom:16}},
          React.createElement("div",{style:{fontSize:11,color:"#6b6b67",marginBottom:4}},"Note interne"),
          React.createElement("textarea",{value:note,onChange:function(e){setNote(e.target.value);},rows:3,placeholder:"Ajouter une note...",style:{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #d0d0cc",background:"#fff",color:"#1a1a18",fontSize:13,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}})
        ),
        React.createElement("div",{style:{display:"flex",gap:8,justifyContent:"flex-end"}},
          React.createElement("button",{onClick:onClose,style:{padding:"7px 16px",borderRadius:8,border:"1px solid #d0d0cc",background:"transparent",cursor:"pointer",fontSize:13,color:"#1a1a18"}},"Annuler"),
          React.createElement("button",{onClick:function(){onSave(lead.id,status,note);onClose();},style:{padding:"7px 16px",borderRadius:8,border:"none",background:color,color:"#fff",fontWeight:500,fontSize:13,cursor:"pointer"}},"Enregistrer")
        )
      )
    )
  );
}

function LeadsTable(props) {
  var leads=props.leads, net=props.net, onPanel=props.onPanel, groupByDept=props.groupByDept, sortDesc=props.sortDesc, onToggleSort=props.onToggleSort;

  function renderRow(l, i) {
    return React.createElement("tr", { key:l.id, style:{ borderBottom:"1px solid var(--color-border-tertiary)", background:i%2===0?"transparent":"var(--color-background-secondary)" } },
      React.createElement("td",{style:{padding:"9px 12px",minWidth:120}},React.createElement("div",{style:{fontWeight:500}},l.firstName+" "+l.lastName)),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:12,minWidth:180,maxWidth:220}},
        l.email ? React.createElement("a",{href:"mailto:"+l.email,style:{color:net.color,textDecoration:"none",wordBreak:"break-all"}},l.email) : React.createElement("span",{style:{color:"var(--color-text-tertiary)"}},"—")
      ),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:12,color:"var(--color-text-secondary)",whiteSpace:"nowrap",width:95}},
        fmtDate(l.importedAt), React.createElement("div",{style:{fontSize:11,color:"var(--color-text-tertiary)"}},fmtTime(l.importedAt))
      ),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:13,width:90,maxWidth:100}},
        React.createElement("div",{style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},l.city||"—"),
        l.zip?React.createElement("span",{style:{fontSize:11,color:"var(--color-text-secondary)"}},l.zip):null
      ),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:13,whiteSpace:"nowrap"}},
        l.phone?React.createElement("a",{href:"tel:"+l.phone,style:{color:net.color,textDecoration:"none"}},l.phone):"—"
      ),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:12,color:"var(--color-text-secondary)",maxWidth:180}},
        l.campaign&&React.createElement("div",{style:{fontWeight:500,color:"var(--color-text-primary)",marginBottom:2}},l.campaign),
        l.message?'"'+l.message.slice(0,60)+(l.message.length>60?"…":"")+'"':"—"
      ),
      React.createElement("td",{style:{padding:"9px 12px"}},React.createElement(Badge,{statusKey:l.status})),
      React.createElement("td",{style:{padding:"9px 12px",fontSize:12,color:"var(--color-text-secondary)",maxWidth:140}},
        l.note?l.note.slice(0,50)+(l.note.length>50?"…":""):React.createElement("span",{style:{color:"var(--color-text-tertiary)"}},"—")
      ),
      React.createElement("td",{style:{padding:"9px 12px"}},
        React.createElement("button",{onClick:function(){onPanel(l);},style:{padding:"4px 10px",borderRadius:6,border:"1px solid "+net.color,background:"transparent",color:net.color,fontSize:12,cursor:"pointer",fontWeight:500}},"Gérer")
      )
    );
  }

  var headCols = [["Contact",null],["Email",null],["Date","sort"],["Ville",null],["Téléphone",null],["Campagne / Message",null],["Statut",null],["Note",null],["Action",null]];
  function renderHead() {
    return React.createElement("tr", { style:{ background:"var(--color-background-secondary)", fontSize:11, color:"var(--color-text-secondary)" } },
      headCols.map(function(item){
        var isSort=item[1]==="sort";
        return React.createElement("th",{key:item[0],onClick:isSort?onToggleSort:undefined,style:{padding:"8px 12px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap",cursor:isSort?"pointer":"default",userSelect:"none"}},
          isSort ? React.createElement("span",{style:{display:"inline-flex",alignItems:"center",gap:4}},item[0],React.createElement("span",{style:{fontSize:14,color:net.color,fontWeight:700}},sortDesc?"↓":"↑")) : item[0]
        );
      })
    );
  }

  function renderTable(rowList, extraStyle) {
    return React.createElement("div",{style:Object.assign({background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",overflowX:"auto"},extraStyle||{})},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:800}},
        React.createElement("thead",null,renderHead()),
        React.createElement("tbody",null,
          rowList,
          leads.length===0&&React.createElement("tr",null,React.createElement("td",{colSpan:9,style:{padding:24,textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}},"Aucun lead ne correspond."))
        )
      )
    );
  }

  if (!groupByDept) return renderTable(leads.map(function(l,i){return renderRow(l,i);}));

  var groups={};
  leads.forEach(function(l){ var d=(l.zip||"00").slice(0,2).toUpperCase(); if(!groups[d])groups[d]=[]; groups[d].push(l); });
  var depts=Object.keys(groups).sort();
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:16}},
    depts.length===0&&React.createElement("div",{style:{padding:24,textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}},"Aucun lead ne correspond."),
    depts.map(function(dept){
      var dl=groups[dept];
      return React.createElement("div",{key:dept},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8}},
          React.createElement("span",{style:{fontWeight:500,color:net.color,fontSize:14}},"📍 Département "+dept),
          React.createElement("span",{style:{fontSize:12,background:net.color,color:"#fff",borderRadius:9,padding:"1px 8px"}},dl.length+" lead"+(dl.length>1?"s":""))
        ),
        renderTable(dl.map(function(l,i){return renderRow(l,i);}))
      );
    })
  );
}

function CompanyView(props) {
  var company=props.company, leads=props.leads, setLeads=props.setLeads, onLogout=props.onLogout;
  var net = NETWORKS[company.network];
  var [filter,setFilter]=useState("tous"), [search,setSearch]=useState("");
  var [dateFrom,setDateFrom]=useState(""), [dateTo,setDateTo]=useState("");
  var [panel,setPanel]=useState(null), [groupByDept,setGroupByDept]=useState(false);
  var [sortDesc,setSortDesc]=useState(true), [page,setPage]=useState(1);

  var myLeads = useMemo(function(){ return leads.filter(function(l){ return l.companyId===company.id; }); },[leads,company.id]);

  var shown = useMemo(function(){
    var filtered=myLeads.filter(function(l){
      // Le filtre "tous" exclut le spam par défaut
      var matchStatus = filter==="spam" ? l.status==="spam" : filter==="tous" ? l.status!=="spam" : l.status===filter;
      var q=search.toLowerCase();
      var matchSearch=!q||[l.firstName,l.lastName,l.email,l.phone,l.city,l.zip,l.message,l.campaign].some(function(v){return (v||"").toLowerCase().includes(q);});
      var lDate=parseLeadDate(l.importedAt);
      var matchFrom=!dateFrom||!lDate||lDate>=new Date(dateFrom);
      var matchTo=!dateTo||!lDate||lDate<=new Date(dateTo+"T23:59:59");
      return matchStatus&&matchSearch&&matchFrom&&matchTo;
    });
    filtered.sort(function(a,b){ var da=parseLeadDate(a.importedAt)||new Date(0), db=parseLeadDate(b.importedAt)||new Date(0); return sortDesc?db-da:da-db; });
    return filtered;
  },[myLeads,filter,search,dateFrom,dateTo,sortDesc]);

  // Reset page when filters change
  useEffect(function(){ setPage(1); },[filter,search,dateFrom,dateTo,sortDesc,groupByDept]);

  var totalPages = Math.max(1,Math.ceil(shown.length/PAGE_SIZE));
  var paginated = shown.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  var counts=useMemo(function(){ var r={tous:myLeads.length}; STATUSES.forEach(function(s){r[s.key]=myLeads.filter(function(l){return l.status===s.key;}).length;}); return r; },[myLeads]);

  async function saveLeadUpdate(id,status,note) {
    await dbUpdate("leads","id=eq."+id,{status:status,note:note});
    setLeads(function(prev){return prev.map(function(l){return l.id===id?Object.assign({},l,{status:status,note:note}):l;});});
  }

  function changePage(p) { if(p>=1&&p<=totalPages){setPage(p);window.scrollTo(0,0);} }

  return React.createElement("div",{style:{minHeight:"100vh",background:"var(--color-background-tertiary)",fontSize:14}},
    // Header
    React.createElement("div",{style:{background:"var(--color-background-primary)",borderBottom:"1px solid var(--color-border-tertiary)",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
        React.createElement("div",{style:{width:10,height:10,borderRadius:"50%",background:net.color}}),
        React.createElement("span",{style:{fontWeight:500,fontSize:15}},company.name),
        React.createElement("span",{style:{fontSize:12,background:net.light,color:net.color,padding:"2px 8px",borderRadius:10}},net.label)
      ),
      React.createElement("div",{style:{display:"flex",gap:8}},
        React.createElement("button",{onClick:function(){exportCSV(myLeads,company.name);},style:{padding:"6px 12px",borderRadius:8,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontSize:12,color:"var(--color-text-secondary)"}},"⬇ Exporter CSV"),
        React.createElement("button",{onClick:onLogout,style:{padding:"6px 12px",borderRadius:8,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontSize:12,color:"var(--color-text-secondary)"}},"Déconnexion")
      )
    ),
    React.createElement("div",{style:{padding:16}},
      // Filtres statut
      React.createElement("div",{style:{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}},
        React.createElement("button",{onClick:function(){setFilter("tous");},style:{padding:"6px 14px",borderRadius:8,border:"1px solid "+(filter==="tous"?net.color:"var(--color-border-secondary)"),background:filter==="tous"?net.light:"transparent",color:filter==="tous"?net.color:"var(--color-text-secondary)",fontSize:13,cursor:"pointer",fontWeight:filter==="tous"?500:400}},"Tous ("+counts.tous+")"),
        STATUSES.map(function(s){ return React.createElement("button",{key:s.key,onClick:function(){setFilter(s.key);},style:{padding:"6px 14px",borderRadius:8,border:"1px solid "+(filter===s.key?s.color:"var(--color-border-secondary)"),background:filter===s.key?s.bg:"transparent",color:filter===s.key?s.color:"var(--color-text-secondary)",fontSize:13,cursor:"pointer",fontWeight:filter===s.key?500:400}},s.label+" ("+(counts[s.key]||0)+")"); })
      ),
      // Recherche + dates + groupement
      React.createElement("div",{style:{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}},
        React.createElement("input",{value:search,onChange:function(e){setSearch(e.target.value);},placeholder:"Rechercher par nom, email, ville, campagne...",style:Object.assign({},inp,{flex:2,minWidth:200})}),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:260}},
          React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}},"Du"),
          React.createElement("input",{type:"date",value:dateFrom,onChange:function(e){setDateFrom(e.target.value);},style:Object.assign({},inp,{flex:1})}),
          React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}},"au"),
          React.createElement("input",{type:"date",value:dateTo,onChange:function(e){setDateTo(e.target.value);},style:Object.assign({},inp,{flex:1})}),
          (dateFrom||dateTo)&&React.createElement("button",{onClick:function(){setDateFrom("");setDateTo("");},style:{padding:"5px 8px",borderRadius:6,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontSize:12,color:"var(--color-text-secondary)"}},"✕")
        ),
        React.createElement("button",{onClick:function(){setGroupByDept(function(v){return !v;});},style:{padding:"6px 12px",borderRadius:8,border:"1px solid "+(groupByDept?net.color:"var(--color-border-secondary)"),background:groupByDept?net.light:"transparent",color:groupByDept?net.color:"var(--color-text-secondary)",fontSize:12,cursor:"pointer",fontWeight:groupByDept?500:400,whiteSpace:"nowrap"}},"📍 "+(groupByDept?"Groupé par dpt":"Grouper par dpt"))
      ),
      myLeads.length===0
        ? React.createElement("div",{style:{textAlign:"center",padding:60,background:"var(--color-background-primary)",borderRadius:12,border:"1px solid var(--color-border-tertiary)",color:"var(--color-text-secondary)"}},
            React.createElement("div",{style:{fontSize:32,marginBottom:10}},"📭"),
            React.createElement("div",{style:{fontWeight:500,marginBottom:4}},"Aucun lead pour le moment"),
            React.createElement("div",{style:{fontSize:13}},"L'administrateur n'a pas encore importé votre fichier CSV.")
          )
        : React.createElement(React.Fragment,null,
            React.createElement(LeadsTable,{leads:paginated,net:net,onPanel:function(l){setPanel(l);},groupByDept:groupByDept,sortDesc:sortDesc,onToggleSort:function(){setSortDesc(function(v){return !v;});}}),
            React.createElement(Pagination,{page:page,total:shown.length,pageSize:PAGE_SIZE,onChange:changePage,color:net.color})
          )
    ),
    panel&&React.createElement(LeadPanel,{lead:panel,color:net.color,onClose:function(){setPanel(null);},onSave:saveLeadUpdate})
  );
}

function AdminView(props) {
  var leads=props.leads, setLeads=props.setLeads, companies=props.companies, setCompanies=props.setCompanies, onLogout=props.onLogout;
  var fileRef=useRef();
  var [selId,setSelId]=useState(companies[0]?companies[0].id:""), [msg,setMsg]=useState(null);
  var [tab,setTab]=useState("import"), [editId,setEditId]=useState(null), [editPwd,setEditPwd]=useState("");
  var [uploading,setUploading]=useState(false), [loginHistory,setLoginHistory]=useState([]);

  useEffect(function(){
    dbSelect("login_history","order=login_at.desc&limit=200").then(function(rows){if(Array.isArray(rows))setLoginHistory(rows);}).catch(function(){});
  },[]);

  var selCo=companies.find(function(c){return c.id===selId;});

  async function handleFile(e) {
    var f=e.target.files[0]; if(!f||!selId) return;
    var importId="imp_"+Date.now();
    var importLabel=(selCo?selCo.name:"")+" — "+f.name+" — "+new Date().toLocaleString("fr-FR");

    // Essayer d'abord UTF-8, puis CP1252 si le résultat semble mal encodé
    function readWithEncoding(encoding) {
      return new Promise(function(resolve, reject) {
        var reader=new FileReader();
        reader.onload=function(ev){ resolve(ev.target.result); };
        reader.onerror=reject;
        reader.readAsText(f, encoding);
      });
    }

    try {
      // Lire en UTF-8 d'abord
      var text = await readWithEncoding("UTF-8");
      // Vérifier si le texte semble mal encodé (caractères de remplacement)
      if (text.includes("\uFFFD") || (text.includes("Activity") && text.includes("�"))) {
        text = await readWithEncoding("windows-1252");
      }

      var result=parseAutoCSV(text);
      var parsed=result.leads, format=result.format;
      if(!parsed.length){setMsg({type:"error",text:"Fichier invalide ou vide."});return;}
      var existing=leads.filter(function(l){return l.companyId===selId;});
      var existingKeys={};
      existing.forEach(function(l){ if(l.phone)existingKeys[l.phone.replace(/\s/g,"")]=true; if(l.email)existingKeys[l.email.toLowerCase().trim()]=true; });
      var newLeads=parsed.filter(function(l){
        var phone=(l.phone||"").replace(/\s/g,""), email=(l.email||"").toLowerCase().trim();
        if(phone&&existingKeys[phone])return false;
        if(email&&existingKeys[email])return false;
        return true;
      });
      var skipped=parsed.length-newLeads.length;
      if(!newLeads.length){setMsg({type:"ok",text:"✓ Aucun nouveau lead ("+skipped+" déjà présent"+(skipped>1?"s":"")+" en base)."});e.target.value="";return;}
      setUploading(true);
      var withCo=newLeads.map(function(l){return Object.assign({},l,{companyId:selId,importId:importId,importLabel:importLabel});});
      try {
        await dbInsert("leads",withCo.map(leadToRow));
        setLeads(function(prev){return withCo.concat(prev);});
        var formatLabel=format==="contact"?" (format contacts entreprises)":"";
        var txt="✓ "+newLeads.length+" nouveau"+(newLeads.length>1?"x":"")+" lead"+(newLeads.length>1?"s":"")+" importé"+(newLeads.length>1?"s":"")+formatLabel+" pour "+(selCo?selCo.name:"");
        if(skipped>0)txt+=" · "+skipped+" doublon"+(skipped>1?"s":"")+" ignoré"+(skipped>1?"s":"");
        setMsg({type:"ok",text:txt+"."});
      } catch(err){setMsg({type:"error",text:"Erreur import : "+err.message});}
      setUploading(false); e.target.value="";
    } catch(err) {
      setMsg({type:"error",text:"Erreur lecture fichier : "+err.message});
    }
  }

  async function savePassword(coId,pwd){
    await dbUpdate("companies","id=eq."+coId,{password:pwd});
    setCompanies(function(prev){return prev.map(function(c){return c.id===coId?Object.assign({},c,{password:pwd}):c;});});
    setEditId(null);
  }
  async function deleteImport(importId,count){
    if(!window.confirm("Supprimer les "+count+" leads de cet import ?"))return;
    try{await dbDelete("leads","import_id=eq."+importId);setLeads(function(prev){return prev.filter(function(l){return l.importId!==importId;});});setMsg({type:"ok",text:"✓ Import supprimé ("+count+" leads retirés)."});}
    catch(err){setMsg({type:"error",text:"Erreur : "+err.message});}
  }

  var grouped=useMemo(function(){var r={};companies.forEach(function(c){r[c.id]=leads.filter(function(l){return l.companyId===c.id;});});return r;},[leads,companies]);
  var importGroups=useMemo(function(){
    var g={};
    leads.forEach(function(l){if(!l.importId)return;if(!g[l.importId])g[l.importId]={id:l.importId,label:l.importLabel,companyId:l.companyId,leads:[]};g[l.importId].leads.push(l);});
    return Object.values(g).sort(function(a,b){return b.id.localeCompare(a.id);});
  },[leads]);
  var allStats=useMemo(function(){return{total:leads.length,byStatus:STATUSES.map(function(s){return Object.assign({},s,{count:leads.filter(function(l){return l.status===s.key;}).length});})};},[leads]);

  var tabs=[["import","Importer CSV"],["imports","Historique imports"],["overview","Vue d'ensemble"],["connexions","Connexions"],["companies","Sociétés"]];

  return React.createElement("div",{style:{minHeight:"100vh",background:"var(--color-background-tertiary)",fontSize:14}},
    React.createElement("div",{style:{background:"var(--color-background-primary)",borderBottom:"1px solid var(--color-border-tertiary)",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
      React.createElement("div",{style:{fontWeight:500,fontSize:15}},"🛠 Administration · Plateforme Leads"),
      React.createElement("button",{onClick:onLogout,style:{padding:"6px 12px",borderRadius:8,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontSize:12,color:"var(--color-text-secondary)"}},"Déconnexion")
    ),
    React.createElement("div",{style:{padding:16}},
      React.createElement("div",{style:{display:"flex",gap:6,marginBottom:16,borderBottom:"1px solid var(--color-border-tertiary)",paddingBottom:10,flexWrap:"wrap"}},
        tabs.map(function(item){return React.createElement("button",{key:item[0],onClick:function(){setTab(item[0]);},style:{padding:"6px 16px",borderRadius:8,border:"none",background:tab===item[0]?"var(--color-background-secondary)":"transparent",fontWeight:tab===item[0]?500:400,cursor:"pointer",fontSize:13,color:"var(--color-text-primary)"}},item[1]);})
      ),
      msg&&React.createElement("div",{style:{padding:"10px 14px",borderRadius:8,background:msg.type==="ok"?"#EAF3DE":"#FCEBEB",color:msg.type==="ok"?"#27500A":"#791F1F",marginBottom:14,fontSize:13,display:"flex",justifyContent:"space-between"}},
        msg.text,React.createElement("button",{onClick:function(){setMsg(null);},style:{background:"none",border:"none",cursor:"pointer",color:"inherit"}},"✕")
      ),

      // ── IMPORT ──
      tab==="import"&&React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",padding:20}},
        React.createElement("div",{style:{fontWeight:500,marginBottom:14}},"Importer un fichier CSV Google Ads"),
        React.createElement("div",{style:{marginBottom:14}},
          React.createElement("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6}},"Société destinataire"),
          ["renovation","humidite"].map(function(nk){
            return React.createElement("div",{key:nk,style:{marginBottom:10}},
              React.createElement("div",{style:{fontSize:11,color:NETWORKS[nk].color,fontWeight:500,marginBottom:4}},NETWORKS[nk].label),
              React.createElement("div",{style:{display:"flex",gap:4,flexWrap:"wrap"}},
                companies.filter(function(c){return c.network===nk;}).map(function(c){
                  return React.createElement("button",{key:c.id,onClick:function(){setSelId(c.id);},style:{padding:"5px 11px",borderRadius:7,border:"1px solid "+(selId===c.id?NETWORKS[nk].color:"var(--color-border-secondary)"),background:selId===c.id?NETWORKS[nk].light:"transparent",color:selId===c.id?NETWORKS[nk].color:"var(--color-text-secondary)",fontSize:12,cursor:"pointer",fontWeight:selId===c.id?500:400}},c.name);
                })
              )
            );
          })
        ),
        selCo&&React.createElement("div",{style:{background:"var(--color-background-secondary)",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12}},"Société : ",React.createElement("b",{style:{color:NETWORKS[selCo.network].color}},selCo.name)," · "+(grouped[selCo.id]||[]).length+" lead(s) en base"),
        React.createElement("div",{style:{background:"var(--color-background-secondary)",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"var(--color-text-secondary)"}},React.createElement("b",{style:{color:"var(--color-text-primary)"}},"Format Google Ads accepté : "),"Nom complet, N° de téléphone, Code postal, Ville, Nom de la campagne, Phase du lead, Date et heure de l'envoi."),
        React.createElement("input",{type:"file",accept:".csv",ref:fileRef,onChange:handleFile,style:{display:"none"}}),
        React.createElement("button",{onClick:function(){if(selId&&!uploading)fileRef.current.click();},style:{padding:"9px 20px",borderRadius:8,border:"none",background:selCo?NETWORKS[selCo.network].color:"#888",color:"#fff",fontWeight:500,fontSize:14,cursor:selCo&&!uploading?"pointer":"not-allowed",opacity:uploading?0.7:1}},uploading?"Import en cours…":"⬆ Choisir le fichier CSV")
      ),

      // ── HISTORIQUE IMPORTS ──
      tab==="imports"&&React.createElement("div",null,
        React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12}},importGroups.length+" import(s) · Supprimez un import entier en cas d'erreur."),
        importGroups.length===0&&React.createElement("div",{style:{padding:32,textAlign:"center",color:"var(--color-text-secondary)",background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)"}},"Aucun import enregistré."),
        React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
          importGroups.map(function(g){
            var co=companies.find(function(c){return c.id===g.companyId;}), net=co?NETWORKS[co.network]:NETWORKS.renovation;
            return React.createElement("div",{key:g.id,style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",padding:"12px 16px"}},
              React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}},
                React.createElement("div",null,
                  React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:4}},
                    React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:net.color}}),
                    React.createElement("span",{style:{fontWeight:500}},co?co.name:"Société inconnue"),
                    React.createElement("span",{style:{fontSize:11,background:net.light,color:net.color,padding:"1px 7px",borderRadius:9}},g.leads.length+" lead"+(g.leads.length>1?"s":""))
                  ),
                  React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}},g.label),
                  React.createElement("div",{style:{display:"flex",gap:4,flexWrap:"wrap"}},
                    STATUSES.filter(function(s){return g.leads.some(function(l){return l.status===s.key;});}).map(function(s){
                      return React.createElement("span",{key:s.key,style:{fontSize:11,padding:"1px 8px",borderRadius:8,background:s.bg,color:s.color}},g.leads.filter(function(l){return l.status===s.key;}).length+" "+s.label);
                    })
                  )
                ),
                React.createElement("button",{onClick:function(){deleteImport(g.id,g.leads.length);},style:{padding:"6px 14px",borderRadius:8,border:"1px solid #F7C1C1",background:"transparent",color:"#A32D2D",fontSize:12,cursor:"pointer",fontWeight:500,whiteSpace:"nowrap"}},"🗑 Supprimer")
              )
            );
          })
        )
      ),

      // ── VUE D'ENSEMBLE ──
      tab==="overview"&&React.createElement("div",null,
        // Totaux globaux
        React.createElement("div",{style:{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}},
          React.createElement("div",{style:{flex:1,minWidth:120,background:"var(--color-background-primary)",borderRadius:8,padding:"12px 16px",border:"1px solid var(--color-border-tertiary)"}},
            React.createElement("div",{style:{fontSize:26,fontWeight:500,color:"#185FA5"}},allStats.total),
            React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"Total leads")
          ),
          allStats.byStatus.map(function(s){return React.createElement("div",{key:s.key,style:{flex:1,minWidth:100,background:s.bg,borderRadius:8,padding:"12px 16px",border:"1px solid "+s.color+"33"}},React.createElement("div",{style:{fontSize:22,fontWeight:500,color:s.color}},s.count),React.createElement("div",{style:{fontSize:12,color:s.color}},s.label));})
        ),

        // Tableau leads par société par mois
        React.createElement("div",{style:{marginBottom:20}},
          React.createElement("div",{style:{fontWeight:500,fontSize:14,marginBottom:12}},"Leads par société par mois"),
          (function(){
            // Construire la liste des 6 derniers mois
            var months=[];
            for(var i=5;i>=0;i--){
              var d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i);
              months.push({ key:d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"), label:d.toLocaleDateString("fr-FR",{month:"short",year:"numeric"}) });
            }
            // Pour chaque lead, trouver son mois
            function getMonth(l){
              var d=parseLeadDate(l.importedAt); if(!d)return null;
              return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
            }
            return React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",overflowX:"auto"}},
              React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:500}},
                React.createElement("thead",null,
                  React.createElement("tr",{style:{background:"var(--color-background-secondary)",fontSize:11,color:"var(--color-text-secondary)"}},
                    React.createElement("th",{style:{padding:"8px 14px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}},"Société"),
                    React.createElement("th",{style:{padding:"8px 14px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}},"Réseau"),
                    months.map(function(m){return React.createElement("th",{key:m.key,style:{padding:"8px 14px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}},m.label);}),
                    React.createElement("th",{style:{padding:"8px 14px",textAlign:"center",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}},"Total")
                  )
                ),
                React.createElement("tbody",null,
                  companies.map(function(c,ci){
                    var net=NETWORKS[c.network];
                    var cl=grouped[c.id]||[];
                    var monthlyCounts=months.map(function(m){ return cl.filter(function(l){return getMonth(l)===m.key;}).length; });
                    var total=cl.length;
                    return React.createElement("tr",{key:c.id,style:{borderBottom:"1px solid var(--color-border-tertiary)",background:ci%2===0?"transparent":"var(--color-background-secondary)"}},
                      React.createElement("td",{style:{padding:"9px 14px",fontWeight:500,fontSize:13}},
                        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
                          React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:net.color}}),
                          c.name
                        )
                      ),
                      React.createElement("td",{style:{padding:"9px 14px"}},
                        React.createElement("span",{style:{fontSize:11,background:net.light,color:net.color,padding:"1px 7px",borderRadius:9}},net.label)
                      ),
                      monthlyCounts.map(function(count,mi){
                        return React.createElement("td",{key:months[mi].key,style:{padding:"9px 14px",textAlign:"center",fontSize:13,fontWeight:count>0?500:400,color:count>0?net.color:"var(--color-text-tertiary)"}},count>0?count:"—");
                      }),
                      React.createElement("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:13,fontWeight:500,color:"#185FA5"}},total||"—")
                    );
                  }),
                  // Ligne totaux
                  React.createElement("tr",{style:{background:"var(--color-background-secondary)",fontWeight:500,borderTop:"2px solid var(--color-border-secondary)"}},
                    React.createElement("td",{style:{padding:"9px 14px",fontSize:13,fontWeight:500}},"TOTAL"),
                    React.createElement("td",{style:{padding:"9px 14px"}}),
                    months.map(function(m){
                      var total=leads.filter(function(l){
                        var d=parseLeadDate(l.importedAt); if(!d)return false;
                        return (d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"))===m.key;
                      }).length;
                      return React.createElement("td",{key:m.key,style:{padding:"9px 14px",textAlign:"center",fontSize:13,fontWeight:500,color:"#185FA5"}},total||"—");
                    }),
                    React.createElement("td",{style:{padding:"9px 14px",textAlign:"center",fontSize:13,fontWeight:500,color:"#185FA5"}},leads.length||"—")
                  )
                )
              )
            );
          })()
        ),

        // Cartes par réseau
        ["renovation","humidite"].map(function(nk){
          return React.createElement("div",{key:nk,style:{marginBottom:16}},
            React.createElement("div",{style:{fontSize:12,fontWeight:500,color:NETWORKS[nk].color,marginBottom:6}},NETWORKS[nk].label),
            React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}},
              companies.filter(function(c){return c.network===nk;}).map(function(c){
                var cl=grouped[c.id]||[], nw=cl.filter(function(l){return l.status==="nouveau";}).length;
                var treated=cl.filter(function(l){return l.status!=="nouveau";}).length;
                var pct=cl.length>0?Math.round(treated/cl.length*100):0;
                return React.createElement("div",{key:c.id,style:{background:"var(--color-background-primary)",borderRadius:9,border:"1px solid var(--color-border-tertiary)",padding:"11px 14px"}},
                  React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},
                    React.createElement("span",{style:{fontWeight:500,fontSize:13}},c.name),
                    nw>0&&React.createElement("span",{style:{fontSize:10,background:NETWORKS[nk].light,color:NETWORKS[nk].color,borderRadius:9,padding:"1px 7px",fontWeight:500}},nw+" new")
                  ),
                  React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}},cl.length+" lead"+(cl.length>1?"s":"")+" · "+pct+"% traités"),
                  cl.length>0&&React.createElement("div",{style:{height:6,borderRadius:3,background:"var(--color-border-tertiary)",marginBottom:8,overflow:"hidden"}},React.createElement("div",{style:{height:"100%",width:pct+"%",background:NETWORKS[nk].color,borderRadius:3}})),
                  React.createElement("div",{style:{display:"flex",gap:3,flexWrap:"wrap"}},
                    STATUSES.filter(function(s){return cl.some(function(l){return l.status===s.key;});}).map(function(s){
                      return React.createElement("span",{key:s.key,style:{fontSize:10,padding:"1px 6px",borderRadius:6,background:s.bg,color:s.color}},cl.filter(function(l){return l.status===s.key;}).length+" "+s.label);
                    })
                  )
                );
              })
            )
          );
        })
      ),

      // ── CONNEXIONS ──
      tab==="connexions"&&React.createElement("div",null,
        React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12}},loginHistory.length+" connexion(s) enregistrée(s)"),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginBottom:20}},
          companies.map(function(c){
            var net=NETWORKS[c.network];
            var history=loginHistory.filter(function(h){return h.company_id===c.id;});
            var last=history[0], lastDate=last?new Date(last.login_at):null;
            var daysSince=lastDate?Math.floor((Date.now()-lastDate)/86400000):null;
            var col=daysSince===null?"#9c9a94":daysSince===0?"#27500A":daysSince<=3?"#633806":"#A32D2D";
            var bg=daysSince===null?"#f5f5f3":daysSince===0?"#EAF3DE":daysSince<=3?"#FAEEDA":"#FCEBEB";
            var label=daysSince===null?"Jamais connecté":daysSince===0?"Connecté aujourd'hui":daysSince===1?"Il y a 1 jour":"Il y a "+daysSince+" jours";
            return React.createElement("div",{key:c.id,style:{background:"var(--color-background-primary)",borderRadius:9,border:"1px solid var(--color-border-tertiary)",padding:"10px 14px"}},
              React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:6}},
                React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:net.color}}),
                React.createElement("span",{style:{fontWeight:500,fontSize:13}},c.name)
              ),
              React.createElement("div",{style:{fontSize:11,padding:"2px 8px",borderRadius:8,background:bg,color:col,display:"inline-block",marginBottom:4,fontWeight:500}},label),
              React.createElement("div",{style:{fontSize:11,color:"var(--color-text-tertiary)"}},history.length+" connexion"+(history.length>1?"s":"")+(lastDate?" · "+lastDate.toLocaleDateString("fr-FR")+" "+lastDate.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):""))
            );
          })
        ),
        React.createElement("div",{style:{fontWeight:500,fontSize:13,marginBottom:10}},"Journal détaillé"),
        loginHistory.length===0&&React.createElement("div",{style:{padding:24,textAlign:"center",color:"var(--color-text-secondary)",background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)"}},"Aucune connexion enregistrée."),
        loginHistory.length>0&&React.createElement("div",{style:{background:"var(--color-background-primary)",borderRadius:10,border:"1px solid var(--color-border-tertiary)",overflow:"hidden"}},
          React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
            React.createElement("thead",null,React.createElement("tr",{style:{background:"var(--color-background-secondary)",fontSize:11,color:"var(--color-text-secondary)"}},
              ["Société","Réseau","Date et heure"].map(function(h){return React.createElement("th",{key:h,style:{padding:"8px 14px",textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)"}},h);})
            )),
            React.createElement("tbody",null,loginHistory.map(function(h,i){
              var co=companies.find(function(c){return c.id===h.company_id;}), net=co?NETWORKS[co.network]:NETWORKS.renovation;
              var d=new Date(h.login_at);
              return React.createElement("tr",{key:h.id,style:{borderBottom:"1px solid var(--color-border-tertiary)",background:i%2===0?"transparent":"var(--color-background-secondary)"}},
                React.createElement("td",{style:{padding:"9px 14px",fontWeight:500}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:net.color}}),h.company_name||"—")),
                React.createElement("td",{style:{padding:"9px 14px"}},React.createElement("span",{style:{fontSize:11,background:net.light,color:net.color,padding:"1px 7px",borderRadius:9}},net.label)),
                React.createElement("td",{style:{padding:"9px 14px",fontSize:13,color:"var(--color-text-secondary)"}},d.toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})+" à "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}))
              );
            }))
          )
        )
      ),

      // ── SOCIÉTÉS ──
      tab==="companies"&&React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
        companies.map(function(c){
          var net=NETWORKS[c.network];
          return React.createElement("div",{key:c.id,style:{background:"var(--color-background-primary)",borderRadius:9,border:"1px solid var(--color-border-tertiary)",padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}},
              React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:net.color}}),
              React.createElement("span",{style:{fontWeight:500}},c.name),
              React.createElement("span",{style:{fontSize:11,background:net.light,color:net.color,padding:"1px 7px",borderRadius:9}},net.label),
              React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"Login : ",React.createElement("b",null,c.login)),
              editId===c.id
                ? React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center"}},
                    React.createElement("input",{value:editPwd,onChange:function(e){setEditPwd(e.target.value);},placeholder:"Nouveau mot de passe",style:{padding:"4px 8px",borderRadius:6,border:"1px solid var(--color-border-secondary)",fontSize:12,background:"var(--color-background-primary)",color:"var(--color-text-primary)",width:160}}),
                    React.createElement("button",{onClick:function(){savePassword(c.id,editPwd||c.password);},style:{padding:"4px 10px",borderRadius:6,border:"none",background:net.color,color:"#fff",fontSize:12,cursor:"pointer"}},"OK"),
                    React.createElement("button",{onClick:function(){setEditId(null);},style:{padding:"4px 8px",borderRadius:6,border:"1px solid var(--color-border-secondary)",background:"transparent",fontSize:12,cursor:"pointer",color:"var(--color-text-secondary)"}},"✕")
                  )
                : React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"mdp : ",React.createElement("b",null,c.password))
            ),
            React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center"}},
              React.createElement("span",{style:{fontSize:12,color:"var(--color-text-secondary)"}},(grouped[c.id]||[]).length+" leads"),
              React.createElement("button",{onClick:function(){setEditId(c.id);setEditPwd(c.password);},style:{padding:"4px 10px",borderRadius:6,border:"1px solid var(--color-border-secondary)",background:"transparent",fontSize:12,cursor:"pointer",color:"var(--color-text-secondary)"}},"Changer mdp")
            )
          );
        })
      )
    )
  );
}

export default function App() {
  var [session,setSession]=useState(null), [leads,setLeads]=useState([]);
  var [companies,setCompanies]=useState(INIT_COMPANIES), [loading,setLoading]=useState(true), [dbError,setDbError]=useState(null);

  useEffect(function(){
    async function load(){
      setLoading(true);
      try{
        await dbUpsert("companies",INIT_COMPANIES.map(companyToRow));
        var rows=await dbSelect("leads","order=created_at.desc");
        if(Array.isArray(rows))setLeads(rows.map(rowToLead));
        var cos=await dbSelect("companies");
        if(Array.isArray(cos)&&cos.length>0)setCompanies(cos.map(rowToCompany));
      }catch(e){setDbError(e&&e.message?e.message:"Erreur réseau");}
      setLoading(false);
    }
    load();
  },[]);

  if(loading)return React.createElement("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-background-tertiary)",flexDirection:"column",gap:12}},
    React.createElement("div",{style:{fontSize:28}},"⏳"),
    React.createElement("div",{style:{fontWeight:500}},"Connexion à la base de données…"),
    React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)"}},"Supabase · okbtkvjexxhjmbdmorgg")
  );
  if(dbError)return React.createElement("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-background-tertiary)",flexDirection:"column",gap:12,padding:24}},
    React.createElement("div",{style:{fontSize:28}},"⚠️"),
    React.createElement("div",{style:{fontWeight:500,color:"#A32D2D"}},"Erreur de connexion Supabase"),
    React.createElement("div",{style:{fontSize:12,color:"var(--color-text-secondary)"}},dbError)
  );
  if(!session)return React.createElement(LoginScreen,{onLogin:function(s){setSession(s);},companies:companies});
  if(session.role==="admin")return React.createElement(AdminView,{leads:leads,setLeads:setLeads,companies:companies,setCompanies:setCompanies,onLogout:function(){setSession(null);}});
  var company=companies.find(function(c){return c.id===session.companyId;});
  return React.createElement(CompanyView,{company:company,leads:leads,setLeads:setLeads,onLogout:function(){setSession(null);}});
}
