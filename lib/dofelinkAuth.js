// Utilitaires serveur. Jamais importé côté navigateur.
import crypto from "crypto";
export const SB_URL = process.env.SUPABASE_URL || "https://okbtkvjexxhjmbdmorgg.supabase.co";
export const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;   // clé service_role (Vercel uniquement)
export const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;     // Supabase > Settings > API > JWT Secret
export const CO_OF_TABLE = { mh76_commerciaux: "c19", mh30_commerciaux: "c14", mh83_commerciaux: "c20", atm52_commerciaux: "c5" };

export function svcHeaders(extra) {
  return Object.assign({ apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" }, extra || {});
}
export async function sbRest(path, opts) {
  const r = await fetch(SB_URL + "/rest/v1/" + path, Object.assign({ headers: svcHeaders() }, opts || {}));
  const t = await r.text();
  if (!r.ok) throw new Error(t);
  return t ? JSON.parse(t) : null;
}

/* ---- Jetons (JWT HS256, acceptés par Supabase/PostgREST et appliqués par la RLS) ---- */
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
export function signJwt(claims) {
  const h = b64({ alg: "HS256", typ: "JWT" }), p = b64(claims);
  return h + "." + p + "." + crypto.createHmac("sha256", JWT_SECRET).update(h + "." + p).digest("base64url");
}
export function verifyJwt(tok) {
  const [h, p, s] = String(tok || "").split(".");
  if (!s || !JWT_SECRET) return null;
  const e = crypto.createHmac("sha256", JWT_SECRET).update(h + "." + p).digest("base64url");
  const a = Buffer.from(s), b = Buffer.from(e);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const c = JSON.parse(Buffer.from(p, "base64url").toString()); return c.exp && c.exp < Date.now() / 1000 ? null : c; } catch (e2) { return null; }
}
export function uuidFor(seed) {
  const x = crypto.createHash("sha1").update("dofelink:" + seed).digest("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-4${x.slice(13, 16)}-a${x.slice(17, 20)}-${x.slice(20, 32)}`;
}

/* ---- Mots de passe ---- */
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return "scrypt$" + salt + "$" + crypto.scryptSync(pw, salt, 32).toString("hex");
}
function safeEq(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }
export function verifyPassword(cred, pw) {
  if (cred.password_hash) {
    const [, salt, h] = cred.password_hash.split("$");
    return safeEq(crypto.scryptSync(pw, salt, 32).toString("hex"), h);
  }
  return cred.password != null && safeEq(cred.password, pw);
}
export function checkPassword(p) { return typeof p === "string" && p.length >= 4 ? null : "Mot de passe trop court (4 caractères minimum)."; }

/* ---- Appelant d'une API (vérifié par signature, jamais par déclaration du client) ---- */
export function caller(req) {
  const h = req.headers.authorization || "";
  const c = verifyJwt(h.startsWith("Bearer ") ? h.slice(7) : "");
  return c && c.app_role ? { user_id: c.sub, role: c.app_role, company_id: c.company_id || null } : null;
}
export async function logAudit(me, action, objectType, objectId, details) {
  try {
    await sbRest("audit_log", { method: "POST", headers: svcHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({ user_id: me.user_id, role: me.role, company_id: me.company_id, action, object_type: objectType, object_id: objectId, details }) });
  } catch (e) { /* l'audit ne bloque jamais l'action */ }
}
