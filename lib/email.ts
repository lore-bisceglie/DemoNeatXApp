import nodemailer from "nodemailer";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

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

export async function sendVerificationEmail(tenantEmail: string, ownerName: string, verifyUrl: string) {
  const safeName = esc(ownerName);
  return send({
    to: tenantEmail,
    subject: `Conferma la tua email per attivare NeatX`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #00b4ff;">Ciao ${safeName}, conferma la tua email ✅</h1>
        <p>Prima di iniziare, verifica che questo indirizzo email sia tuo. Basta un click:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #00b4ff; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Conferma la mia email</a>
        </div>
        <p style="color: #666; font-size: 13px;">Se non hai creato un account su NeatX, ignora questa email.</p>
        <hr style="border: none; border-top: 1px solid #e2e4e8; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999;">NeatX Software · Agenda online per professionisti</p>
      </div>`,
  });
}

export async function sendWelcomeEmail(tenantEmail: string, ownerName: string, adminPassword: string, tenantUrl: string) {
  const safeName = esc(ownerName);
  return send({
    to: tenantEmail,
    subject: `Benvenuto in NeatX, ${ownerName}! Il tuo gestionale è pronto 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #00b4ff;">Ciao ${safeName}, benvenuto in NeatX! 🎉</h1>
        <p>Sono Lorenzo, ho creato NeatX per aiutare professionisti come te a liberarsi dal caos delle prenotazioni via telefono e WhatsApp.</p>
        <p>Ho già preparato tutto per te: servizi, staff e una pagina di prenotazione funzionante. Entra e provala subito.</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>🔗 Link del tuo negozio:</strong><br/><a href="${tenantUrl}" style="color: #00b4ff;">${tenantUrl}</a></p>
        </div>
        <p>Hai 7 giorni di prova gratuita per testare tutto. Se hai dubbi o vuoi un consiglio, rispondi pure a questa email: ti leggo di persona.</p>
        <p>Per accedere alla dashboard, usa il link qui sopra e inserisci la password che hai scelto in registrazione.</p>
        <p>A presto,<br/><strong>Lorenzo — NeatX</strong></p>
        <hr style="border: none; border-top: 1px solid #e2e4e8; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999;">
          NeatX Software · Agenda online per professionisti<br/>
          Se non vuoi più ricevere email, clicca <a href="%unsubscribe_url%" style="color: #999;">qui</a>.
        </p>
      </div>`,
  });
}

export async function sendTrialReminder3Days(tenantEmail: string, tenantName: string, ownerName: string, adminUrl: string) {
  const safeOwner = esc(ownerName);
  const safeTenant = esc(tenantName);
  return send({
    to: tenantEmail,
    subject: `NeatX: la prova di ${tenantName} scade tra 3 giorni`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #f59e0b;">⏳ Il tuo trial sta per scadere</h2>
        <p>Ciao ${safeOwner},</p>
        <p>La prova gratuita di <strong>${safeTenant}</strong> scade tra <strong>3 giorni</strong>.</p>
        <p>Se non attivi un abbonamento, perderai l'accesso al gestionale e i tuoi clienti non potranno più prenotare.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${adminUrl}" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Attiva piano da 29€</a>
        </div>
        <p style="color: #666; font-size: 13px;">Se hai domande, rispondi a questa email.</p>
      </div>`,
  });
}

export async function sendTrialReminder1Day(tenantEmail: string, tenantName: string, ownerName: string, adminUrl: string) {
  const safeOwner = esc(ownerName);
  const safeTenant = esc(tenantName);
  return send({
    to: tenantEmail,
    subject: `ULTIMO GIORNO - La prova NeatX di ${tenantName} scade domani`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #ef4444;">🚨 Ultimo giorno!</h2>
        <p>Ciao ${safeOwner},</p>
        <p>Domani scade la prova gratuita di <strong>${safeTenant}</strong>.</p>
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
  const safeOwner = esc(ownerName);
  const safeTenant = esc(tenantName);
  return send({
    to: tenantEmail,
    subject: `NeatX: ${tenantName} è ancora in tempo per riattivare`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #00b4ff;">Il tuo gestionale ti aspetta</h2>
        <p>Ciao ${safeOwner},</p>
        <p>La prova di <strong>${safeTenant}</strong> è scaduta, ma i tuoi dati sono ancora lì.</p>
        <p>Attivando l'abbonamento riparti subito senza perdere nulla:</p>
        <ul>
          <li>Servizi, staff e orari già configurati</li>
          <li>Link di prenotazione già attivo</li>
          <li>Clienti che possono prenotare ora</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paywallUrl}" style="background: #00b4ff; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Riattiva ora - 29€/mese</a>
        </div>
        <p style="color: #666; font-size: 13px;">Se hai bisogno di aiuto, rispondi a questa email.</p>
      </div>`,
  });
}
