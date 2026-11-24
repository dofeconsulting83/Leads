import { SB_KEY, JWT_SECRET, sbRest, svcHeaders, signJwt, uuidFor, verifyPassword, hashPassword } from "../../lib/dofelinkAuth";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ORDER = { admin: 0, subadmin: 1, commercial: 2, company: 3 };   // même priorité que l'ancienne connexion
const TTL = 12 * 3600;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!SB_KEY || !JWT_SECRET) return res.status(500).json({ error: "Configuration serveur incomplète." });
  const login = String((req.body && req.body.login) || "").trim().toLowerCase();
  const password = String((req.body && req.body.password) || "");
  if (!login || !password || login.length > 80 || password.length > 200) return res.status(400).json({ error: "Identifiants incorrects." });
  try {
    const rows = ((await sbRest("credentials?login_lc=eq." + encodeURIComponent(login) + "&select=*")) || []).sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
    for (const c of rows) {
      if (!verifyPassword(c, password)) continue;
      // Première connexion réussie : on remplace le mot de passe en clair par son empreinte (le mot de passe reste identique pour l'utilisateur)
      if (!c.password_hash && process.env.HASH_ON_LOGIN !== "0") {
        try { await sbRest("credentials?id=eq." + c.id, { method: "PATCH", headers: svcHeaders({ Prefer: "return=minimal" }), body: JSON.stringify({ password_hash: hashPassword(password), password: null }) }); } catch (e) {}
      }
      const profile = { role: c.kind, company_id: c.company_id || null, commercial_table: c.ref_table || null, commercial_id: c.kind === "commercial" ? c.ref_id : null };
      const now = Math.floor(Date.now() / 1000);
      const token = signJwt({ aud: "authenticated", role: "authenticated", sub: uuidFor(c.id), iat: now, exp: now + TTL,
        app_role: c.kind, company_id: profile.company_id, commercial_table: profile.commercial_table, commercial_id: profile.commercial_id });
      try {   // journal de connexion écrit côté serveur
        let companyName = "Administration", userName = "Admin";
        if (c.company_id) { const co = ((await sbRest("companies?id=eq." + c.company_id + "&select=name")) || [])[0]; companyName = co ? co.name : c.company_id; }
        if (c.kind === "company") userName = companyName;
        if (c.kind === "subadmin") userName = "Admin " + companyName;
        if (c.kind === "commercial") { const cm = ((await sbRest(c.ref_table + "?id=eq." + encodeURIComponent(c.ref_id) + "&select=nom")) || [])[0]; userName = cm ? cm.nom : c.login; }
        await sbRest("login_history", { method: "POST", headers: svcHeaders({ Prefer: "return=minimal" }),
          body: JSON.stringify({ id: "lh_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), company_id: c.company_id || "admin", company_name: companyName, role: c.kind, user_name: userName }) });
      } catch (e) {}
      return res.status(200).json({ access_token: token, expires_in: TTL, profile });
    }
    await sleep(500);
    return res.status(401).json({ error: "Identifiants incorrects." });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
