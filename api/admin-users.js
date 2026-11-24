import { SB_KEY, CO_OF_TABLE, sbRest, svcHeaders, caller, logAudit, hashPassword, checkPassword } from "../../lib/dofelinkAuth";

// Autorisation vérifiée CÔTÉ SERVEUR : admin = tout ; subadmin = uniquement les commerciaux de SA société.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!SB_KEY) return res.status(500).json({ error: "Configuration serveur incomplète." });
  const me = caller(req);
  if (!me) return res.status(401).json({ error: "Non authentifié." });
  const b = req.body || {};
  try {
    if (b.action === "set_password" && b.kind === "company") {
      if (me.role !== "admin") return res.status(403).json({ error: "Interdit." });
      const bad = checkPassword(b.password); if (bad) return res.status(400).json({ error: bad });
      const co = ((await sbRest("companies?id=eq." + encodeURIComponent(b.companyId) + "&select=id,login")) || [])[0];
      if (!co) return res.status(404).json({ error: "Société introuvable." });
      await saveCred({ kind: "company", company_id: co.id, ref_table: null, ref_id: co.id, login: co.login }, b.password);
      await logAudit(me, "user.password_reset", "company", co.id, null);
      return res.status(200).json({ ok: true });
    }
    const coId = CO_OF_TABLE[b.table];
    if (["set_password", "create_commercial", "delete_commercial"].includes(b.action)) {
      if (!coId) return res.status(400).json({ error: "Table inconnue." });
      if (!(me.role === "admin" || (me.role === "subadmin" && me.company_id === coId))) return res.status(403).json({ error: "Interdit." });
      if (b.action !== "delete_commercial") { const bad = checkPassword(b.password); if (bad) return res.status(400).json({ error: bad }); }
      if (b.action === "delete_commercial") {
        await sbRest("credentials?kind=eq.commercial&ref_table=eq." + b.table + "&ref_id=eq." + encodeURIComponent(b.commercialId), { method: "DELETE", headers: svcHeaders({ Prefer: "return=minimal" }) });
        await logAudit(me, "user.deleted", b.table, b.commercialId, null);
        return res.status(200).json({ ok: true });
      }
      let login = String(b.login || "").trim();
      if (b.action === "set_password") {
        const row = ((await sbRest(b.table + "?id=eq." + encodeURIComponent(b.commercialId) + "&select=id,login")) || [])[0];
        if (!row) return res.status(404).json({ error: "Commercial introuvable." });
        login = row.login;
      } else {
        if (!login) return res.status(400).json({ error: "Login requis." });
        const clash = (await sbRest("credentials?kind=eq.commercial&company_id=eq." + coId + "&login_lc=eq." + encodeURIComponent(login.toLowerCase()) + "&select=id")) || [];
        if (clash.length) return res.status(409).json({ error: "Ce login existe déjà." });
      }
      await saveCred({ kind: "commercial", company_id: coId, ref_table: b.table, ref_id: b.commercialId, login }, b.password);
      await logAudit(me, b.action === "create_commercial" ? "user.created" : "user.password_reset", b.table, b.commercialId, null);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Action inconnue." });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

async function saveCred(c, pw) {
  let q = "credentials?kind=eq." + c.kind + "&ref_id=eq." + encodeURIComponent(c.ref_id) + (c.ref_table ? "&ref_table=eq." + c.ref_table : "&ref_table=is.null");
  const ex = ((await sbRest(q + "&select=id")) || [])[0];
  const data = { login: c.login, password_hash: hashPassword(pw), password: null };
  if (ex) await sbRest("credentials?id=eq." + ex.id, { method: "PATCH", headers: svcHeaders({ Prefer: "return=minimal" }), body: JSON.stringify(data) });
  else await sbRest("credentials", { method: "POST", headers: svcHeaders({ Prefer: "return=minimal" }), body: JSON.stringify(Object.assign({ kind: c.kind, company_id: c.company_id, ref_table: c.ref_table, ref_id: c.ref_id }, data)) });
}
