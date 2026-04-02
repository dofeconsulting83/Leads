import React, { useState, useRef, useMemo, useEffect } from "react";

const SUPABASE_URL  = "https://okbtkvjexxhjmbdmorgg.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYnRrdmpleHhoam1iZG1vcmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Mjk3MzcsImV4cCI6MjA5MDEwNTczN30.vCPz-5Kj3F-NdFnw27T06qU4uhuYkGSPxUeC8S9o8dQ";

const HEADERS = {
  "apikey": SUPABASE_ANON,
  "Authorization": `Bearer ${SUPABASE_ANON}`,
  "Content-Type": "application/json",
};

async function dbSelect(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query || ""}`, { headers: HEADERS });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function dbInsert(table, rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(await r.text());
}
async function dbUpdate(table, match, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
}
async function dbDelete(table, match) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: "DELETE",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
  });
  if (!r.ok) throw new Error(await r.text());
}
async function dbUpsert(table, rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(await r.text());
}

const NETWORKS = {
  renovation: { label: "Rénovation ATM", color: "#185FA5", light: "#E6F1FB" },
  humidite:   { label: "MurHumide",      color: "#0F6E56", light: "#E1F5EE" },
};

const STATUSES = [
  { key: "nouveau",  label: "Nouveau",    bg: "#E6F1FB", color: "#0C447C" },
  { key: "contacte", label: "Contacté",   bg: "#FAEEDA", color: "#633806" },
  { key: "rappeler", label: "À rappeler", bg: "#EEEDFE", color: "#3C3489" },
  { key: "gagne",    label: "Gagné",      bg: "#EAF3DE", color: "#27500A" },
  { key: "perdu",    label: "Perdu",      bg: "#FCEBEB", color: "#791F1F" },
];

const INIT_COMPANIES = [
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
  { id:"c21", name:"MH91",    network:"humidite",   login:"mh91",    password:"1234" },
];

const ADMIN = { login: "admin", password: "admin123" };

function rowToLead(r) {
  return {
    id: r.id, companyId: r.company_id,
    firstName: r.first_name, lastName: r.last_name,
    email: r.email, phone: r.phone,
    address: r.address, city: r.city, zip: r.zip,
    message: r.message, campaign: r.campaign,
    importedAt: r.imported_at,
    importId: r.import_id || null,
    importLabel: r.import_label || null,
    status: r.status || "nouveau",
    note: r.note || "",
  };
}

function leadToRow(l) {
  return {
    id: l.id, company_id: l.companyId,
    first_name: l.firstName, last_name: l.lastName,
    email: l.email, phone: l.phone,
    address: l.address, city: l.city, zip: l.zip,
    message: l.message, campaign: l.campaign,
    imported_at: l.importedAt,
    import_id: l.importId || null,
    import_label: l.importLabel || null,
    status: l.status || "nouveau",
    note: l.note || "",
  };
}

function rowToCompany(r) {
  return { id: r.id, name: r.name, network: r.network, login: r.login, password: r.password };
}
function companyToRow(c) {
  return { id: c.id, name: c.name, network: c.network, login: c.login, password: c.password };
}

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.trim().split(/\r?\n/).map(function(l) { return l.trim(); }).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  function norm(s) {
    return s.replace(/^"|"$/g,"").trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").trim();
  }
  const headers = lines[0].split(sep).map(norm);
  function idx() {
    var keys = Array.prototype.slice.call(arguments);
    return headers.findIndex(function(h) { return keys.some(function(k) { return h.includes(k); }); });
  }
  var iFullName = idx("nom complet","full name");
  var iFirst    = idx("prenom","first name");
  var iLast     = idx("last name","lastname");
  var iPhone    = idx("telephone","phone","mobile","n de tel","numero");
  var iEmail    = idx("email","mail","e mail");
  var iZip      = idx("code postal","postal","zip","cp");
  var iCity     = idx("ville","city");
  var iAddr     = idx("adresse","address","rue");
  var iMsg      = idx("message","commentaire","note","remarque","phase","description");
  var iDate     = idx("date","heure","soumis","envoi");
  var iCampaign = idx("campagne","campaign");

  function splitLine(line) {
    var res = []; var cur = ""; var inQ = false;
    for (var ci = 0; ci < line.length; ci++) {
      var ch = line[ci];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === sep && !inQ) { res.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    res.push(cur.trim());
    return res;
  }

  return lines.slice(1).map(function(line, i) {
    var cols = splitLine(line);
    function g(j) { return (j >= 0 && j < cols.length) ? cols[j].replace(/^"|"$/g,"").trim() : ""; }
    var fn = g(iFirst) || "";
    var ln = g(iLast) || "";
    if (!fn && !ln && iFullName >= 0) {
      var pts = g(iFullName).trim().split(/\s+/);
      fn = pts[0] || "";
      ln = pts.slice(1).join(" ") || "";
    }
    if (!fn && !g(iPhone) && !g(iEmail)) return null;
    return {
      id: "l_" + Date.now() + "_" + i + "_" + Math.random().toString(36).slice(2,6),
      firstName: fn || "—", lastName: ln,
      email: g(iEmail), phone: g(iPhone),
      address: g(iAddr), city: g(iCity), zip: g(iZip),
      message: g(iMsg), campaign: g(iCampaign),
      importedAt: g(iDate) || new Date().toLocaleString("fr-FR"),
      status: "nouveau", note: "", companyId: null,
      importId: null, importLabel: null,
    };
  }).filter(Boolean);
}

function exportCSV(leads, name) {
  var h = ["Prénom","Nom","Email","Téléphone","Adresse","Ville","CP","Message","Campagne","Statut","Note","Date"];
  var rows = leads.map(function(l) {
    return [l.firstName, l.lastName, l.email, l.phone, l.address, l.city, l.zip,
      l.message, l.campaign, (STATUSES.find(function(s) { return s.key===l.status; }) || STATUSES[0]).label,
      l.note, l.importedAt];
  });
  var csv = [h].concat(rows).map(function(r) {
    return r.map(function(v) { return '"' + (v||"").replace(/"/g,'""') + '"'; }).join(";");
  }).join("\n");
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8" }));
  a.download = "leads_" + name.replace(/\s/g,"_") + "_" + new Date().toISOString().slice(0,10) + ".csv";
  a.click();
}

function Badge({ statusKey }) {
  var s = STATUSES.find(function(x) { return x.key === statusKey; }) || STATUSES[0];
  return (
    <span style={{ fontSize:11, padding:"2px 9px", borderRadius:10, background:s.bg, color:s.color, fontWeight:500, whiteSpace:"nowrap" }}>
      {s.label}
    </span>
  );
}

function fmtDate(str) {
  if (!str) return "—";
  var m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return m[1]+"/"+m[2]+"/"+m[3];
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) return str.slice(0,10).split("-").reverse().join("/");
  return str.slice(0,10);
}
function fmtTime(str) {
  if (!str) return "";
  var m = str.match(/(\d{2}):(\d{2})/);
  return m ? m[1]+":"+m[2] : "";
}

var inp = {
  padding: "7px 10px", borderRadius: 8,
  border: "1px solid var(--color-border-secondary)",
  background: "var(--color-background-primary)",
  color: "var(--color-text-primary)", fontSize: 13,
};

function LoginScreen({ onLogin, companies }) {
  const [login, setLogin] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");

  function submit() {
    if (login === ADMIN.login && pass === ADMIN.password) { onLogin({ role:"admin" }); return; }
    const co = companies.find(function(c) { return c.login === login && c.password === pass; });
    if (co) { onLogin({ role:"company", companyId: co.id }); return; }
    setErr("Identifiants incorrects.");
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--color-background-tertiary)" }}>
      <div style={{ background:"var(--color-background-primary)", borderRadius:14, border:"1px solid var(--color-border-tertiary)", width:380, padding:28 }}>
        <div style={{ fontWeight:500, fontSize:17, marginBottom:2 }}>Plateforme Leads</div>
        <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:20 }}>ATM Rénovation · MurHumide</div>
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:4 }}>Identifiant</div>
          <input value={login} onChange={function(e){setLogin(e.target.value);}} placeholder="ex: atm83" style={{ ...inp, width:"100%", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:4 }}>Mot de passe</div>
          <input value={pass} type="password" onChange={function(e){setPass(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")submit();}} style={{ ...inp, width:"100%", boxSizing:"border-box" }}/>
        </div>
        {err && <div style={{ color:"#A32D2D", fontSize:12, marginBottom:10 }}>{err}</div>}
        <button onClick={submit} style={{ width:"100%", padding:"9px 0", borderRadius:8, border:"none", background:"#185FA5", color:"#fff", fontWeight:500, fontSize:14, cursor:"pointer" }}>
          Se connecter
        </button>
      </div>
    </div>
  );
}

function LeadPanel({ lead, onClose, onSave, color }) {
  const [status, setStatus] = useState(lead.status);
  const [note,   setNote]   = useState(lead.note || "");

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(2px)" }}>
      <div style={{ background:"#ffffff", borderRadius:14, width:440, maxWidth:"95vw", border:"1px solid #e0e0e0", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ background:color, padding:"14px 18px", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontWeight:500, fontSize:15 }}>{lead.firstName} {lead.lastName}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ padding:20, background:"#ffffff", color:"#1a1a18" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14, fontSize:13 }}>
            {[["📧 Email",lead.email||"—"],["📞 Téléphone",lead.phone||"—"],["📍 Ville",(lead.city||(lead.zip?"CP "+lead.zip:"—"))],["📅 Reçu le",fmtDate(lead.importedAt)]].map(function(item) {
              return (
                <div key={item[0]} style={{ background:"#f5f5f3", borderRadius:8, padding:"8px 10px" }}>
                  <div style={{ fontSize:11, color:"#6b6b67", marginBottom:2 }}>{item[0]}</div>
                  <div style={{ fontWeight:500, wordBreak:"break-all", color:"#1a1a18" }}>{item[1]}</div>
                </div>
              );
            })}
          </div>
          {lead.campaign && <div style={{ background:"#f5f5f3", borderRadius:8, padding:"8px 10px", marginBottom:10, fontSize:12 }}><span style={{ color:"#6b6b67" }}>Campagne : </span><b style={{color:"#1a1a18"}}>{lead.campaign}</b></div>}
          {lead.message  && <div style={{ background:"#f5f5f3", borderRadius:8, padding:"8px 10px", marginBottom:14, fontSize:13 }}><div style={{ fontSize:11, color:"#6b6b67", marginBottom:2 }}>Message</div><div style={{ fontStyle:"italic", color:"#1a1a18" }}>"{lead.message}"</div></div>}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, color:"#6b6b67", marginBottom:6 }}>Statut</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {STATUSES.map(function(s) {
                return (
                  <button key={s.key} onClick={function(){setStatus(s.key);}} style={{ padding:"4px 12px", borderRadius:8, border:"1px solid "+(status===s.key?s.color:"#d0d0cc"), background:status===s.key?s.bg:"transparent", color:status===s.key?s.color:"#6b6b67", fontSize:12, cursor:"pointer", fontWeight:status===s.key?500:400 }}>{s.label}</button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:"#6b6b67", marginBottom:4 }}>Note interne</div>
            <textarea value={note} onChange={function(e){setNote(e.target.value);}} rows={3} placeholder="Ajouter une note..." style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #d0d0cc", background:"#fff", color:"#1a1a18", fontSize:13, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}/>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ padding:"7px 16px", borderRadius:8, border:"1px solid #d0d0cc", background:"transparent", cursor:"pointer", fontSize:13, color:"#1a1a18" }}>Annuler</button>
            <button onClick={function(){onSave(lead.id,status,note);onClose();}} style={{ padding:"7px 16px", borderRadius:8, border:"none", background:color, color:"#fff", fontWeight:500, fontSize:13, cursor:"pointer" }}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadsTable({ shown, net, onPanel, groupByDept }) {
  const cols = ["Contact","Email","Date","Ville","Téléphone","Campagne / Message","Statut","Note","Action"];

  function renderRow(l, i) {
    return (
      <tr key={l.id} style={{ borderBottom:"1px solid var(--color-border-tertiary)", background:i%2===0?"transparent":"var(--color-background-secondary)" }}>
        <td style={{ padding:"9px 12px" }}>
          <div style={{ fontWeight:500 }}>{l.firstName} {l.lastName}</div>
        </td>
        <td style={{ padding:"9px 12px", fontSize:12 }}>
          {l.email ? <a href={"mailto:"+l.email} style={{ color:net.color, textDecoration:"none" }}>{l.email}</a> : <span style={{ color:"var(--color-text-tertiary)" }}>—</span>}
        </td>
        <td style={{ padding:"9px 12px", fontSize:12, color:"var(--color-text-secondary)", whiteSpace:"nowrap" }}>
          {fmtDate(l.importedAt)}
          <div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{fmtTime(l.importedAt)}</div>
        </td>
        <td style={{ padding:"9px 12px", fontSize:13 }}>
          {l.city||"—"}{l.zip?<span style={{ fontSize:11, color:"var(--color-text-secondary)" }}> {l.zip}</span>:null}
        </td>
        <td style={{ padding:"9px 12px", fontSize:13, whiteSpace:"nowrap" }}>
          {l.phone ? <a href={"tel:"+l.phone} style={{ color:net.color, textDecoration:"none" }}>{l.phone}</a> : "—"}
        </td>
        <td style={{ padding:"9px 12px", fontSize:12, color:"var(--color-text-secondary)", maxWidth:180 }}>
          {l.campaign && <div style={{ fontWeight:500, color:"var(--color-text-primary)", marginBottom:2 }}>{l.campaign}</div>}
          {l.message ? '"'+l.message.slice(0,60)+(l.message.length>60?"…":"")+'"' : "—"}
        </td>
        <td style={{ padding:"9px 12px" }}><Badge statusKey={l.status}/></td>
        <td style={{ padding:"9px 12px", fontSize:12, color:"var(--color-text-secondary)", maxWidth:140 }}>
          {l.note ? l.note.slice(0,50)+(l.note.length>50?"…":"") : <span style={{ color:"var(--color-text-tertiary)" }}>—</span>}
        </td>
        <td style={{ padding:"9px 12px" }}>
          <button onClick={function(){onPanel(l);}} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid "+net.color, background:"transparent", color:net.color, fontSize:12, cursor:"pointer", fontWeight:500 }}>Gérer</button>
        </td>
      </tr>
    );
  }

  function renderTableShell(rows, extra) {
    return (
      <div style={{ background:"var(--color-background-primary)", borderRadius:10, border:"1px solid var(--color-border-tertiary)", overflowX:"auto", ...extra }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:800 }}>
          <thead>
            <tr style={{ background:"var(--color-background-secondary)", fontSize:11, color:"var(--color-text-secondary)" }}>
              {cols.map(function(h) {
                return <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:500, borderBottom:"1px solid var(--color-border-tertiary)", whiteSpace:"nowrap" }}>{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {rows}
            {shown.length===0 && <tr><td colSpan={9} style={{ padding:24, textAlign:"center", color:"var(--color-text-secondary)", fontSize:13 }}>Aucun lead ne correspond.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  if (!groupByDept) {
    return renderTableShell(shown.map(function(l,i){return renderRow(l,i);}));
  }

  // Group by department
  var groups = {};
  shown.forEach(function(l) {
    var dept = (l.zip||"00").slice(0,2).toUpperCase();
    if (!groups[dept]) groups[dept] = [];
    groups[dept].push(l);
  });
  var sortedDepts = Object.keys(groups).sort();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {sortedDepts.map(function(dept) {
        var dLeads = groups[dept];
        return (
          <div key={dept}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontWeight:500, color:net.color, fontSize:14 }}>📍 Département {dept}</span>
              <span style={{ fontSize:12, background:net.color, color:"#fff", borderRadius:9, padding:"1px 8px" }}>{dLeads.length} lead{dLeads.length>1?"s":""}</span>
            </div>
            {renderTableShell(dLeads.map(function(l,i){return renderRow(l,i);}), { marginBottom:0 })}
          </div>
        );
      })}
      {sortedDepts.length===0 && <div style={{ padding:24, textAlign:"center", color:"var(--color-text-secondary)", fontSize:13 }}>Aucun lead ne correspond.</div>}
    </div>
  );
}

function CompanyView({ company, leads, setLeads, onLogout }) {
  const net = NETWORKS[company.network];
  const [filter,      setFilter]   = useState("tous");
  const [search,      setSearch]   = useState("");
  const [dateFrom,    setDateFrom] = useState("");
  const [dateTo,      setDateTo]   = useState("");
  const [panel,       setPanel]    = useState(null);
  const [groupByDept, setGroupByDept] = useState(false);
  const [sortDesc,    setSortDesc] = useState(true);

  const myLeads = useMemo(function() {
    return leads.filter(function(l) { return l.companyId === company.id; });
  }, [leads, company.id]);

  function parseLeadDate(str) {
    if (!str) return null;
    var m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return new Date(m[3]+"-"+m[2]+"-"+m[1]);
    var d = new Date(str);
    return isNaN(d) ? null : d;
  }

  const shown = useMemo(function() {
    var filtered = myLeads.filter(function(l) {
      var matchStatus = filter === "tous" || l.status === filter;
      var q = search.toLowerCase();
      var matchSearch = !q || [l.firstName,l.lastName,l.email,l.phone,l.city,l.message,l.campaign].some(function(v){return (v||"").toLowerCase().includes(q);});
      var lDate = parseLeadDate(l.importedAt);
      var matchFrom = !dateFrom || !lDate || lDate >= new Date(dateFrom);
      var matchTo   = !dateTo   || !lDate || lDate <= new Date(dateTo+"T23:59:59");
      return matchStatus && matchSearch && matchFrom && matchTo;
    });
    filtered.sort(function(a, b) {
      var da = parseLeadDate(a.importedAt) || new Date(0);
      var db = parseLeadDate(b.importedAt) || new Date(0);
      return sortDesc ? db - da : da - db;
    });
    return filtered;
  }, [myLeads, filter, search, dateFrom, dateTo, sortDesc]);

  const counts = useMemo(function() {
    var r = { tous: myLeads.length };
    STATUSES.forEach(function(s) { r[s.key] = myLeads.filter(function(l){return l.status===s.key;}).length; });
    return r;
  }, [myLeads]);

  async function saveLeadUpdate(id, status, note) {
    await dbUpdate("leads", "id=eq."+id, { status: status, note: note });
    setLeads(function(prev) { return prev.map(function(l) { return l.id===id ? Object.assign({},l,{status:status,note:note}) : l; }); });
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--color-background-tertiary)", fontSize:14 }}>
      <div style={{ background:"var(--color-background-primary)", borderBottom:"1px solid var(--color-border-tertiary)", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:net.color }}/>
          <span style={{ fontWeight:500, fontSize:15 }}>{company.name}</span>
          <span style={{ fontSize:12, background:net.light, color:net.color, padding:"2px 8px", borderRadius:10 }}>{net.label}</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={function(){exportCSV(myLeads,company.name);}} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid var(--color-border-secondary)", background:"transparent", cursor:"pointer", fontSize:12, color:"var(--color-text-secondary)" }}>⬇ Exporter CSV</button>
          <button onClick={onLogout} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid var(--color-border-secondary)", background:"transparent", cursor:"pointer", fontSize:12, color:"var(--color-text-secondary)" }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ padding:16 }}>
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
          <button onClick={function(){setFilter("tous");}} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid "+(filter==="tous"?net.color:"var(--color-border-secondary)"), background:filter==="tous"?net.light:"transparent", color:filter==="tous"?net.color:"var(--color-text-secondary)", fontSize:13, cursor:"pointer", fontWeight:filter==="tous"?500:400 }}>
            Tous ({counts.tous})
          </button>
          {STATUSES.map(function(s) {
            return (
              <button key={s.key} onClick={function(){setFilter(s.key);}} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid "+(filter===s.key?s.color:"var(--color-border-secondary)"), background:filter===s.key?s.bg:"transparent", color:filter===s.key?s.color:"var(--color-text-secondary)", fontSize:13, cursor:"pointer", fontWeight:filter===s.key?500:400 }}>
                {s.label} ({counts[s.key]||0})
              </button>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
          <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Rechercher par nom, email, ville, campagne..." style={{ ...inp, flex:2, minWidth:200 }}/>
          <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, minWidth:260 }}>
            <span style={{ fontSize:12, color:"var(--color-text-secondary)", whiteSpace:"nowrap" }}>Du</span>
            <input type="date" value={dateFrom} onChange={function(e){setDateFrom(e.target.value);}} style={{ ...inp, flex:1 }}/>
            <span style={{ fontSize:12, color:"var(--color-text-secondary)", whiteSpace:"nowrap" }}>au</span>
            <input type="date" value={dateTo} onChange={function(e){setDateTo(e.target.value);}} style={{ ...inp, flex:1 }}/>
            {(dateFrom||dateTo) && <button onClick={function(){setDateFrom("");setDateTo("");}} style={{ padding:"5px 8px", borderRadius:6, border:"1px solid var(--color-border-secondary)", background:"transparent", cursor:"pointer", fontSize:12, color:"var(--color-text-secondary)" }}>✕</button>}
          </div>
          <button onClick={function(){setGroupByDept(function(v){return !v;});}} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid "+(groupByDept?net.color:"var(--color-border-secondary)"), background:groupByDept?net.light:"transparent", color:groupByDept?net.color:"var(--color-text-secondary)", fontSize:12, cursor:"pointer", fontWeight:groupByDept?500:400, whiteSpace:"nowrap" }}>
            📍 {groupByDept ? "Groupé par dpt" : "Grouper par dpt"}
          </button>
        </div>

        {myLeads.length === 0 ? (
          <div style={{ textAlign:"center", padding:60, background:"var(--color-background-primary)", borderRadius:12, border:"1px solid var(--color-border-tertiary)", color:"var(--color-text-secondary)" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
            <div style={{ fontWeight:500, marginBottom:4 }}>Aucun lead pour le moment</div>
            <div style={{ fontSize:13 }}>L'administrateur n'a pas encore importé votre fichier CSV.</div>
          </div>
        ) : (
          <LeadsTable shown={shown} net={net} onPanel={function(l){setPanel(l);}} groupByDept={groupByDept} sortDesc={sortDesc} onToggleSort={function(){setSortDesc(function(v){return !v;});}} />
        )}
      </div>

      {panel && <LeadPanel lead={panel} color={net.color} onClose={function(){setPanel(null);}} onSave={saveLeadUpdate}/>}
    </div>
  );
}

function AdminView({ leads, setLeads, companies, setCompanies, onLogout }) {
  const fileRef = useRef();
  const [selId,     setSelId]    = useState(companies[0] ? companies[0].id : "");
  const [msg,       setMsg]      = useState(null);
  const [tab,       setTab]      = useState("import");
  const [editId,    setEditId]   = useState(null);
  const [editPwd,   setEditPwd]  = useState("");
  const [uploading, setUploading]= useState(false);

  const selCo = companies.find(function(c) { return c.id === selId; });

  async function handleFile(e) {
    var f = e.target.files[0];
    if (!f || !selId) return;
    var importId    = "imp_" + Date.now();
    var importLabel = (selCo ? selCo.name : "") + " — " + f.name + " — " + new Date().toLocaleString("fr-FR");
    var reader = new FileReader();
    reader.onload = async function(ev) {
      var parsed = parseCSV(ev.target.result);
      if (!parsed.length) { setMsg({ type:"error", text:"Fichier invalide ou vide." }); return; }
      setUploading(true);
      var withCo = parsed.map(function(l) { return Object.assign({},l,{companyId:selId,importId:importId,importLabel:importLabel}); });
      try {
        await dbInsert("leads", withCo.map(leadToRow));
        setLeads(function(prev) { return withCo.concat(prev); });
        setMsg({ type:"ok", text:"✓ "+parsed.length+" lead(s) importé(s) pour "+(selCo?selCo.name:"")+"." });
      } catch(err) {
        setMsg({ type:"error", text:"Erreur import : "+err.message });
      }
      setUploading(false);
      e.target.value = "";
    };
    reader.readAsText(f, "UTF-8");
  }

  async function savePassword(coId, pwd) {
    await dbUpdate("companies", "id=eq."+coId, { password: pwd });
    setCompanies(function(prev) { return prev.map(function(c) { return c.id===coId ? Object.assign({},c,{password:pwd}) : c; }); });
    setEditId(null);
  }

  async function deleteImport(importId, count) {
    if (!window.confirm("Supprimer les "+count+" leads de cet import ?")) return;
    try {
      await dbDelete("leads", "import_id=eq."+importId);
      setLeads(function(prev) { return prev.filter(function(l) { return l.importId !== importId; }); });
      setMsg({ type:"ok", text:"✓ Import supprimé ("+count+" leads retirés)." });
    } catch(err) {
      setMsg({ type:"error", text:"Erreur suppression : "+err.message });
    }
  }

  const grouped = useMemo(function() {
    var r = {};
    companies.forEach(function(c) { r[c.id] = leads.filter(function(l){return l.companyId===c.id;}); });
    return r;
  }, [leads, companies]);

  const importGroups = useMemo(function() {
    var g = {};
    leads.forEach(function(l) {
      if (!l.importId) return;
      if (!g[l.importId]) g[l.importId] = { id:l.importId, label:l.importLabel, companyId:l.companyId, leads:[] };
      g[l.importId].leads.push(l);
    });
    return Object.values(g).sort(function(a,b){return b.id.localeCompare(a.id);});
  }, [leads]);

  const allStats = useMemo(function() {
    return {
      total: leads.length,
      byStatus: STATUSES.map(function(s) { return Object.assign({},s,{count:leads.filter(function(l){return l.status===s.key;}).length}); }),
    };
  }, [leads]);

  return (
    <div style={{ minHeight:"100vh", background:"var(--color-background-tertiary)", fontSize:14 }}>
      <div style={{ background:"var(--color-background-primary)", borderBottom:"1px solid var(--color-border-tertiary)", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:500, fontSize:15 }}>🛠 Administration · Plateforme Leads</div>
        <button onClick={onLogout} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid var(--color-border-secondary)", background:"transparent", cursor:"pointer", fontSize:12, color:"var(--color-text-secondary)" }}>Déconnexion</button>
      </div>

      <div style={{ padding:16 }}>
        <div style={{ display:"flex", gap:6, marginBottom:16, borderBottom:"1px solid var(--color-border-tertiary)", paddingBottom:10 }}>
          {[["import","Importer CSV"],["imports","Historique imports"],["overview","Vue d'ensemble"],["companies","Sociétés"]].map(function(item) {
            return (
              <button key={item[0]} onClick={function(){setTab(item[0]);}} style={{ padding:"6px 16px", borderRadius:8, border:"none", background:tab===item[0]?"var(--color-background-secondary)":"transparent", fontWeight:tab===item[0]?500:400, cursor:"pointer", fontSize:13, color:"var(--color-text-primary)" }}>{item[1]}</button>
            );
          })}
        </div>

        {msg && (
          <div style={{ padding:"10px 14px", borderRadius:8, background:msg.type==="ok"?"#EAF3DE":"#FCEBEB", color:msg.type==="ok"?"#27500A":"#791F1F", marginBottom:14, fontSize:13, display:"flex", justifyContent:"space-between" }}>
            {msg.text}
            <button onClick={function(){setMsg(null);}} style={{ background:"none", border:"none", cursor:"pointer", color:"inherit" }}>✕</button>
          </div>
        )}

        {tab==="import" && (
          <div style={{ background:"var(--color-background-primary)", borderRadius:10, border:"1px solid var(--color-border-tertiary)", padding:20 }}>
            <div style={{ fontWeight:500, marginBottom:14 }}>Importer un fichier CSV Google Ads</div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:6 }}>Société destinataire</div>
              {["renovation","humidite"].map(function(netKey) {
                return (
                  <div key={netKey} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, color:NETWORKS[netKey].color, fontWeight:500, marginBottom:4 }}>{NETWORKS[netKey].label}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {companies.filter(function(c){return c.network===netKey;}).map(function(c) {
                        return (
                          <button key={c.id} onClick={function(){setSelId(c.id);}} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid "+(selId===c.id?NETWORKS[netKey].color:"var(--color-border-secondary)"), background:selId===c.id?NETWORKS[netKey].light:"transparent", color:selId===c.id?NETWORKS[netKey].color:"var(--color-text-secondary)", fontSize:12, cursor:"pointer", fontWeight:selId===c.id?500:400 }}>{c.name}</button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {selCo && (
              <div style={{ background:"var(--color-background-secondary)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12 }}>
                Société : <b style={{ color:NETWORKS[selCo.network].color }}>{selCo.name}</b> · {(grouped[selCo.id]||[]).length} lead(s) en base
              </div>
            )}
            <div style={{ background:"var(--color-background-secondary)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"var(--color-text-secondary)" }}>
              <b style={{ color:"var(--color-text-primary)" }}>Format Google Ads accepté :</b> Nom complet, N° de téléphone, Code postal, Ville, Nom de la campagne, Phase du lead, Date et heure de l'envoi.
            </div>
            <input type="file" accept=".csv" ref={fileRef} onChange={handleFile} style={{ display:"none" }}/>
            <button onClick={function(){if(selId&&!uploading)fileRef.current.click();}} style={{ padding:"9px 20px", borderRadius:8, border:"none", background:selCo?NETWORKS[selCo.network].color:"#888", color:"#fff", fontWeight:500, fontSize:14, cursor:selCo&&!uploading?"pointer":"not-allowed", opacity:uploading?0.7:1 }}>
              {uploading ? "Import en cours…" : "⬆ Choisir le fichier CSV"}
            </button>
          </div>
        )}

        {tab==="imports" && (
          <div>
            <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:12 }}>
              {importGroups.length} import(s) · Supprimez un import entier en cas d'erreur de société.
            </div>
            {importGroups.length === 0 && (
              <div style={{ padding:32, textAlign:"center", color:"var(--color-text-secondary)", background:"var(--color-background-primary)", borderRadius:10, border:"1px solid var(--color-border-tertiary)" }}>
                Aucun import enregistré.
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {importGroups.map(function(g) {
                var co  = companies.find(function(c){return c.id===g.companyId;});
                var net = co ? NETWORKS[co.network] : NETWORKS.renovation;
                return (
                  <div key={g.id} style={{ background:"var(--color-background-primary)", borderRadius:10, border:"1px solid var(--color-border-tertiary)", padding:"12px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:net.color }}/>
                          <span style={{ fontWeight:500 }}>{co ? co.name : "Société inconnue"}</span>
                          <span style={{ fontSize:11, background:net.light, color:net.color, padding:"1px 7px", borderRadius:9 }}>{g.leads.length} lead{g.leads.length>1?"s":""}</span>
                        </div>
                        <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:6 }}>{g.label}</div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {STATUSES.filter(function(s){return g.leads.some(function(l){return l.status===s.key;});}).map(function(s) {
                            return <span key={s.key} style={{ fontSize:11, padding:"1px 8px", borderRadius:8, background:s.bg, color:s.color }}>{g.leads.filter(function(l){return l.status===s.key;}).length} {s.label}</span>;
                          })}
                        </div>
                      </div>
                      <button onClick={function(){deleteImport(g.id,g.leads.length);}} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #F7C1C1", background:"transparent", color:"#A32D2D", fontSize:12, cursor:"pointer", fontWeight:500, whiteSpace:"nowrap" }}>
                        🗑 Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="overview" && (
          <div>
            <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:120, background:"var(--color-background-primary)", borderRadius:8, padding:"12px 16px", border:"1px solid var(--color-border-tertiary)" }}>
                <div style={{ fontSize:26, fontWeight:500, color:"#185FA5" }}>{allStats.total}</div>
                <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>Total leads</div>
              </div>
              {allStats.byStatus.map(function(s) {
                return (
                  <div key={s.key} style={{ flex:1, minWidth:100, background:s.bg, borderRadius:8, padding:"12px 16px", border:"1px solid "+s.color+"33" }}>
                    <div style={{ fontSize:22, fontWeight:500, color:s.color }}>{s.count}</div>
                    <div style={{ fontSize:12, color:s.color }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
            {["renovation","humidite"].map(function(netKey) {
              return (
                <div key={netKey} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:NETWORKS[netKey].color, marginBottom:6 }}>{NETWORKS[netKey].label}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:8 }}>
                    {companies.filter(function(c){return c.network===netKey;}).map(function(c) {
                      var cl = grouped[c.id]||[];
                      var nw = cl.filter(function(l){return l.status==="nouveau";}).length;
                      var treated = cl.filter(function(l){return l.status!=="nouveau";}).length;
                      var pct = cl.length > 0 ? Math.round(treated/cl.length*100) : 0;
                      return (
                        <div key={c.id} style={{ background:"var(--color-background-primary)", borderRadius:9, border:"1px solid var(--color-border-tertiary)", padding:"11px 14px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                            <span style={{ fontWeight:500, fontSize:13 }}>{c.name}</span>
                            {nw>0 && <span style={{ fontSize:10, background:NETWORKS[netKey].light, color:NETWORKS[netKey].color, borderRadius:9, padding:"1px 7px", fontWeight:500 }}>{nw} new</span>}
                          </div>
                          <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:8 }}>{cl.length} lead{cl.length>1?"s":""} · {pct}% traités</div>
                          {cl.length > 0 && (
                            <div style={{ height:6, borderRadius:3, background:"var(--color-border-tertiary)", marginBottom:8, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:pct+"%", background:NETWORKS[netKey].color, borderRadius:3 }}/>
                            </div>
                          )}
                          <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                            {STATUSES.filter(function(s){return cl.some(function(l){return l.status===s.key;});}).map(function(s) {
                              return <span key={s.key} style={{ fontSize:10, padding:"1px 6px", borderRadius:6, background:s.bg, color:s.color }}>{cl.filter(function(l){return l.status===s.key;}).length} {s.label}</span>;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="companies" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {companies.map(function(c) {
              var net = NETWORKS[c.network];
              return (
                <div key={c.id} style={{ background:"var(--color-background-primary)", borderRadius:9, border:"1px solid var(--color-border-tertiary)", padding:"11px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:net.color }}/>
                    <span style={{ fontWeight:500 }}>{c.name}</span>
                    <span style={{ fontSize:11, background:net.light, color:net.color, padding:"1px 7px", borderRadius:9 }}>{net.label}</span>
                    <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>Login : <b>{c.login}</b></span>
                    {editId===c.id ? (
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <input value={editPwd} onChange={function(e){setEditPwd(e.target.value);}} placeholder="Nouveau mot de passe" style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--color-border-secondary)", fontSize:12, background:"var(--color-background-primary)", color:"var(--color-text-primary)", width:160 }}/>
                        <button onClick={function(){savePassword(c.id,editPwd||c.password);}} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:net.color, color:"#fff", fontSize:12, cursor:"pointer" }}>OK</button>
                        <button onClick={function(){setEditId(null);}} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--color-border-secondary)", background:"transparent", fontSize:12, cursor:"pointer", color:"var(--color-text-secondary)" }}>✕</button>
                      </div>
                    ) : (
                      <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>mdp : <b>{c.password}</b></span>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{(grouped[c.id]||[]).length} leads</span>
                    <button onClick={function(){setEditId(c.id);setEditPwd(c.password);}} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid var(--color-border-secondary)", background:"transparent", fontSize:12, cursor:"pointer", color:"var(--color-text-secondary)" }}>Changer mdp</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [session,   setSession]   = useState(null);
  const [leads,     setLeads]     = useState([]);
  const [companies, setCompanies] = useState(INIT_COMPANIES);
  const [loading,   setLoading]   = useState(true);
  const [dbError,   setDbError]   = useState(null);

  useEffect(function() {
    async function load() {
      setLoading(true);
      try {
        await dbUpsert("companies", INIT_COMPANIES.map(companyToRow));
        var rows = await dbSelect("leads", "order=created_at.desc");
        if (Array.isArray(rows)) setLeads(rows.map(rowToLead));
        var cos = await dbSelect("companies");
        if (Array.isArray(cos) && cos.length > 0) setCompanies(cos.map(rowToCompany));
      } catch(e) {
        setDbError(e && e.message ? e.message : "Erreur réseau");
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--color-background-tertiary)", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:28 }}>⏳</div>
      <div style={{ fontWeight:500 }}>Connexion à la base de données…</div>
      <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>Supabase · okbtkvjexxhjmbdmorgg</div>
    </div>
  );

  if (dbError) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--color-background-tertiary)", flexDirection:"column", gap:12, padding:24 }}>
      <div style={{ fontSize:28 }}>⚠️</div>
      <div style={{ fontWeight:500, color:"#A32D2D" }}>Erreur de connexion Supabase</div>
      <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{dbError}</div>
    </div>
  );

  if (!session) return <LoginScreen onLogin={function(s){setSession(s);}} companies={companies}/>;
  if (session.role === "admin") return <AdminView leads={leads} setLeads={setLeads} companies={companies} setCompanies={setCompanies} onLogout={function(){setSession(null);}}/>;
  var company = companies.find(function(c) { return c.id === session.companyId; });
  return <CompanyView company={company} leads={leads} setLeads={setLeads} onLogout={function(){setSession(null);}}/>;
}
