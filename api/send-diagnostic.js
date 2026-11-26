import { caller, logAudit } from "../lib/dofelinkAuth.js";

// Envoi du rapport de diagnostic au client par e-mail (Brevo). Réservé aux utilisateurs connectés.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) return res.status(500).json({ error: "Configuration e-mail manquante (BREVO_API_KEY)." });
  const me = caller(req);
  if (!me) return res.status(401).json({ error: "Non authentifié." });
  const b = req.body || {};
  const to = String(b.to || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ error: "Adresse e-mail invalide." });
  if (me.role !== "admin" && me.company_id !== b.companyId) return res.status(403).json({ error: "Interdit." });
  const html = String(b.html || "");
  if (!html || html.length > 1500000) return res.status(400).json({ error: "Rapport vide ou trop volumineux." });
  const esc = (v) => String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const intro = esc(b.message).replace(/\n/g, "<br/>");
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: String(b.companyName || "Dofelink").slice(0, 60), email: "service.administratif@dofe-consulting.com" },
        to: [{ email: to, name: String(b.toName || "").slice(0, 80) || undefined }],
        subject: String(b.subject || "Votre rapport de diagnostic").slice(0, 150),
        htmlContent: html.replace(/<body[^>]*>/i, (m) => m + (intro ? '<div style="font-family:Arial,sans-serif;font-size:14px;margin-bottom:16px">' + intro + '</div><hr style="border:none;border-top:1px solid #e3e8ef;margin:0 0 16px"/>' : "")),
      }),
    });
    if (!r.ok) return res.status(502).json({ error: "L'envoi a échoué (" + r.status + ")." });
    await logAudit(me, "diagnostic.emailed", "diagnostic", String(b.diagnosticId || ""), { to });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
