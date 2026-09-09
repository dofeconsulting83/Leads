export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { commercialNom, companyName, companyEmail, loginAt } = req.body;
  if (!companyEmail || !commercialNom) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) return res.status(500).json({ error: "Clé Brevo manquante" });

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Plateforme Leads",
          email: "service.administratif@dofe-consulting.com",
        },
        to: [{ email: companyEmail, name: companyName }],
        subject: `👤 ${commercialNom} vient de se connecter — ${companyName}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <div style="background: #0F6E56; padding: 20px 24px; border-radius: 10px 10px 0 0;">
              <h2 style="color: #ffffff; margin: 0; font-size: 18px;">👤 Connexion commercial</h2>
            </div>
            <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <p style="font-size: 15px; color: #1a1a18;">Bonjour,</p>
              <p style="font-size: 15px; color: #1a1a18;">
                Le commercial <b style="color: #0F6E56;">${commercialNom}</b> vient de se connecter sur la plateforme Leads (<b>${companyName}</b>).
              </p>
              <p style="font-size: 13px; color: #6b6b67;">
                📅 ${loginAt || new Date().toLocaleString("fr-FR")}
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="https://leads-coral.vercel.app" style="background: #0F6E56; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                  Accéder à la plateforme →
                </a>
              </div>
              <p style="font-size: 12px; color: #9c9a94; margin-top: 24px;">
                Cet email a été envoyé automatiquement par la Plateforme Leads.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: "Erreur Brevo : " + err });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
