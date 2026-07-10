import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

async function send(options: { to: string; subject: string; html: string }) {
  const user = process.env.SMTP_EMAIL;
  const transporter = getTransporter();
  if (!transporter || !user) {
    console.warn("[Email] SMTP non configurato.");
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"Lorenzo - NeatX" <${user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[Email] Inviata a ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Errore:", error);
    return false;
  }
}

export async function sendWelcomeEmail(tenantEmail: string, ownerName: string, adminPassword: string, tenantUrl: string) {
  return send({
    to: tenantEmail,
    subject: `Benvenuto in NeatX, ${ownerName}! Il tuo gestionale e pronto 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #00b4ff;">Benvenuto a bordo!</h1>
        <p>Ciao ${ownerName},</p>
        <p>Sono Lorenzo, il creatore di NeatX. Il tuo spazio gestionale e pronto all'uso.</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>Link del tuo Negozio:</strong> <a href="${tenantUrl}">${tenantUrl}</a></p>
          <p><strong>Password Admin:</strong> <code>${adminPassword}</code></p>
        </div>
        <p>Tra 7 giorni il trial scade. Ti mando un promemoria prima.</p>
        <p>A presto,<br/><strong>Lorenzo - NeatX</strong></p>
      </div>`,
  });
}

export async function sendTrialReminder3Days(tenantEmail: string, tenantName: string, ownerName: string, adminUrl: string) {
  return send({
    to: tenantEmail,
    subject: `NeatX: la prova di ${tenantName} scade tra 3 giorni`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #f59e0b;">⏳ Il tuo trial sta per scadere</h2>
        <p>Ciao ${ownerName},</p>
        <p>La prova gratuita di <strong>${tenantName}</strong> scade tra <strong>3 giorni</strong>.</p>
        <p>Se non attivi un abbonamento, perderai l'accesso al gestionale e i tuoi clienti non potranno piu prenotare.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${adminUrl}" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Attiva piano da 29€</a>
        </div>
        <p style="color: #666; font-size: 13px;">Se hai domande, rispondi a questa email.</p>
      </div>`,
  });
}

export async function sendTrialReminder1Day(tenantEmail: string, tenantName: string, ownerName: string, adminUrl: string) {
  return send({
    to: tenantEmail,
    subject: `ULTIMO GIORNO - La prova NeatX di ${tenantName} scade domani`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #ef4444;">🚨 Ultimo giorno!</h2>
        <p>Ciao ${ownerName},</p>
        <p>Domani scade la prova gratuita di <strong>${tenantName}</strong>.</p>
        <p><strong>Se non attivi ora, perderai:</strong></p>
        <ul>
          <li>Il link di prenotazione dei tuoi clienti</li>
          <li>Tutti gli appuntamenti in agenda</li>
          <li>I promemoria automatici anti no-show</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${adminUrl}" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Mantieni tutto - Attiva ora</a>
        </div>
        <p style="color: #666; font-size: 13px;">Pro a 29€/mese o Elite a 59€/mese. Disdici quando vuoi.</p>
      </div>`,
  });
}

export async function sendTrialExpiredOffer(tenantEmail: string, tenantName: string, ownerName: string, paywallUrl: string) {
  return send({
    to: tenantEmail,
    subject: `NeatX: ${tenantName} e ancora in tempo per riattivare`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #00b4ff;">Il tuo gestionale ti aspetta</h2>
        <p>Ciao ${ownerName},</p>
        <p>La prova di <strong>${tenantName}</strong> e scaduta, ma i tuoi dati sono ancora li.</p>
        <p>Attivando l'abbonamento riparti subito senza perdere nulla:</p>
        <ul>
          <li>Servizi, staff e orari gia configurati</li>
          <li>Link di prenotazione gia attivo</li>
          <li>Clienti che possono prenotare ora</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paywallUrl}" style="background: #00b4ff; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Riattiva ora - 29€/mese</a>
        </div>
        <p style="color: #666; font-size: 13px;">Se hai bisogno di aiuto, rispondi a questa email.</p>
      </div>`,
  });
}
