import nodemailer from "nodemailer";

export async function sendWelcomeEmail(tenantEmail: string, ownerName: string, adminPassword: string, tenantUrl: string) {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.warn("[Email] Credenziali SMTP non configurate. Ignoro l'invio della mail a", tenantEmail);
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  const subject = `Benvenuto in NeatX, ${ownerName}! Il tuo gestionale è pronto 🎉`;
  const html = `
    <div style="font-family: sans-serif; max-w-xl; margin: 0 auto; color: #333;">
      <h1 style="color: #00b4ff;">Benvenuto a bordo!</h1>
      <p>Ciao ${ownerName},</p>
      <p>Sono Tiziano, il creatore di NeatX. Volevo darti il benvenuto personale a bordo!</p>
      <p>Il tuo spazio gestionale è stato creato ed è pronto all'uso.</p>
      
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Link del tuo Negozio (da dare ai clienti):</strong> <a href="${tenantUrl}">${tenantUrl}</a></p>
        <p style="margin: 0;"><strong>Password Admin segreta:</strong> <code>${adminPassword}</code></p>
      </div>

      <p>Per qualsiasi dubbio su come impostare i tuoi orari o attivare i pagamenti online, puoi rispondere direttamente a questa mail e ti aiuterò io di persona.</p>
      <br/>
      <p>A presto e buon lavoro,<br/><strong>Tiziano - Founder di NeatX</strong></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Tiziano - NeatX" <${user}>`,
      to: tenantEmail,
      subject,
      html,
    });
    console.log(`[Email] Mail di benvenuto inviata con successo a ${tenantEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Errore invio mail tramite Gmail SMTP:", error);
    return false;
  }
}
