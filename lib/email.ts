import nodemailer from "nodemailer";
import { Resend } from "resend";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getTransporter() {
  const user = process.env.SMTP_EMAIL || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.GMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

function supportEmail() {
  return process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL || process.env.GMAIL_USER || "assistenza.neatx@gmail.com";
}

function emailShell(title: string, content: string) {
  const support = supportEmail();
  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937; line-height: 1.55;">
      <div style="padding: 24px 0; text-align: center;">
        <div style="font-size: 24px; font-weight: 800; color: #0ea5e9;">NeatX</div>
        <div style="font-size: 12px; color: #64748b;">Agenda online per professionisti</div>
      </div>
      <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px; background: #ffffff;">
        <h1 style="margin: 0 0 18px; color: #0f172a; font-size: 24px;">${title}</h1>
        ${content}
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 18px; text-align: center;">
        Serve aiuto? Rispondi a questa email oppure scrivi a
        <a href="mailto:${support}" style="color: #0284c7;">${support}</a>.
      </p>
    </div>`;
}

export async function sendEmail(options: { to: string; subject: string; html: string; replyTo?: string }) {
  const replyTo = options.replyTo || supportEmail();
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const { error } = await new Resend(resendApiKey).emails.send({
        from: process.env.EMAIL_FROM || "NeatX <assistenza@neatx.store>",
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo,
      });
      if (!error) {
        console.log(`[Email] Inviata tramite Resend a ${options.to}: ${options.subject}`);
        return true;
      }
      console.error("[Email] Resend ha rifiutato l'invio:", error.name, error.message);
    } catch (error) {
      console.error("[Email] Resend non disponibile, provo SMTP:", error instanceof Error ? error.message : "errore sconosciuto");
    }
  }

  const user = process.env.SMTP_EMAIL || process.env.GMAIL_USER;
  const transporter = getTransporter();
  if (!transporter || !user) {
    console.warn("[Email] Nessun provider email disponibile (Resend/SMTP).");
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"Lorenzo - NeatX" <${user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo,
    });
    console.log(`[Email] Inviata a ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Errore:", error);
    return false;
  }
}

export async function sendVerificationEmail(
  tenantEmail: string,
  ownerName: string,
  verifyUrl: string,
  referralBonusPending = false,
) {
  const safeName = esc(ownerName);
  return sendEmail({
    to: tenantEmail,
    subject: `Conferma la tua email per attivare NeatX`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #00b4ff;">Ciao ${safeName}, conferma la tua email ✅</h1>
        <p>Prima di iniziare, verifica che questo indirizzo email sia tuo. Basta un click:</p>
        ${referralBonusPending ? "<p><strong>Dopo la verifica riceverai 50 messaggi bonus invito, per un saldo iniziale totale di 100.</strong></p>" : ""}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #00b4ff; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Conferma la mia email</a>
        </div>
        <p style="color: #666; font-size: 13px;">Il link è personale, utilizzabile una sola volta e scade dopo 24 ore. Se non hai creato un account su NeatX, ignora questa email.</p>
        <hr style="border: none; border-top: 1px solid #e2e4e8; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999;">NeatX Software · Agenda online per professionisti</p>
      </div>`,
  });
}

export async function sendWelcomeEmail(tenantEmail: string, ownerName: string, tenantUrl: string) {
  const safeName = esc(ownerName);
  return sendEmail({
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
        <p>Hai 14 giorni di prova gratuita per testare tutto. Se hai dubbi o vuoi un consiglio, rispondi pure a questa email: ti leggo di persona.</p>
        <p>Per accedere alla dashboard, usa il link qui sopra e inserisci la password che hai scelto in registrazione.</p>
        <p>A presto,<br/><strong>Lorenzo — NeatX</strong></p>
        <hr style="border: none; border-top: 1px solid #e2e4e8; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999;">
          NeatX Software · Agenda online per professionisti<br/>
        </p>
      </div>`,
  });
}

export async function sendTrialReminder3Days(tenantEmail: string, tenantName: string, ownerName: string, adminUrl: string) {
  const safeOwner = esc(ownerName);
  const safeTenant = esc(tenantName);
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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

export async function sendPasswordResetEmail(
  tenantEmail: string,
  ownerName: string,
  resetUrl: string,
) {
  const safeName = esc(ownerName || "titolare");
  const safeUrl = esc(resetUrl);
  return sendEmail({
    to: tenantEmail,
    subject: "Reimposta la password del tuo account NeatX",
    html: emailShell(
      "Reimposta la password",
      `<p>Ciao ${safeName},</p>
       <p>Abbiamo ricevuto una richiesta per cambiare la password del tuo account NeatX.</p>
       <div style="text-align:center;margin:30px 0">
         <a href="${safeUrl}" style="background:#0ea5e9;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">Scegli una nuova password</a>
       </div>
       <p style="font-size:13px;color:#64748b">Il link è personale, utilizzabile una sola volta e scade dopo 30 minuti.</p>
       <p style="font-size:13px;color:#64748b">Se non hai richiesto tu il cambio, ignora questa email: la password attuale resterà valida.</p>`,
    ),
  });
}

export async function sendPasswordChangedEmail(
  tenantEmail: string,
  ownerName: string,
  adminUrl: string,
) {
  const safeName = esc(ownerName || "titolare");
  const safeUrl = esc(adminUrl);
  return sendEmail({
    to: tenantEmail,
    subject: "Password NeatX modificata correttamente",
    html: emailShell(
      "Password modificata",
      `<p>Ciao ${safeName},</p>
       <p>La password del tuo account NeatX è stata modificata correttamente.</p>
       <p>Per proteggerti, tutte le sessioni aperte in precedenza sono state chiuse.</p>
       <div style="text-align:center;margin:30px 0">
         <a href="${safeUrl}" style="background:#0ea5e9;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">Accedi di nuovo</a>
       </div>
       <p style="font-size:13px;color:#64748b">Se non hai effettuato tu questa modifica, contatta subito l'assistenza rispondendo a questa email.</p>`,
    ),
  });
}

export async function sendSubscriptionActivatedEmail(
  tenantEmail: string,
  tenantName: string,
  ownerName: string,
  plan: "pro" | "elite",
  interval: "month" | "year",
  adminUrl: string,
) {
  const safeOwner = esc(ownerName || "titolare");
  const safeTenant = esc(tenantName);
  const safeAdminUrl = esc(adminUrl);
  const planLabel = plan === "elite" ? "Elite" : "Pro";
  const intervalLabel = interval === "year" ? "annuale" : "mensile";
  return sendEmail({
    to: tenantEmail,
    subject: `NeatX ${planLabel} attivo per ${tenantName}`,
    html: emailShell(
      `Abbonamento ${planLabel} attivo`,
      `
        <p>Ciao ${safeOwner},</p>
        <p>il piano <strong>${planLabel} ${intervalLabel}</strong> per <strong>${safeTenant}</strong> e attivo.</p>
        <p>Puoi continuare a usare dashboard, pagina clienti, servizi, orari e gestione appuntamenti senza interruzioni.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${safeAdminUrl}" style="background: #0ea5e9; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700;">Vai alla dashboard</a>
        </div>
        <p><strong>Nota operativa:</strong> i promemoria WhatsApp sono temporaneamente disattivati. NeatX non mostra falsi invii riusciti e non consuma crediti per questa funzione finche resta disattivata.</p>
      `,
    ),
  });
}

export async function sendPaymentFailedEmail(
  tenantEmail: string,
  tenantName: string,
  ownerName: string,
  portalUrl: string,
) {
  const safeOwner = esc(ownerName || "titolare");
  const safeTenant = esc(tenantName);
  const safePortalUrl = esc(portalUrl);
  return sendEmail({
    to: tenantEmail,
    subject: `Pagamento NeatX non riuscito per ${tenantName}`,
    html: emailShell(
      `Pagamento non riuscito`,
      `
        <p>Ciao ${safeOwner},</p>
        <p>Stripe ci ha segnalato che il pagamento dell'abbonamento di <strong>${safeTenant}</strong> non e andato a buon fine.</p>
        <p>Di solito succede per carta scaduta, fondi insufficienti o autenticazione bancaria non completata.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${safePortalUrl}" style="background: #ef4444; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700;">Apri dashboard pagamenti</a>
        </div>
        <p>Stripe riprovera automaticamente. Se il pagamento non viene risolto, l'accesso al piano a pagamento potra essere sospeso.</p>
      `,
    ),
  });
}

export async function sendSubscriptionCanceledEmail(
  tenantEmail: string,
  tenantName: string,
  ownerName: string,
  paywallUrl: string,
) {
  const safeOwner = esc(ownerName || "titolare");
  const safeTenant = esc(tenantName);
  const safePaywallUrl = esc(paywallUrl);
  return sendEmail({
    to: tenantEmail,
    subject: `Abbonamento NeatX annullato per ${tenantName}`,
    html: emailShell(
      `Abbonamento annullato`,
      `
        <p>Ciao ${safeOwner},</p>
        <p>l'abbonamento NeatX di <strong>${safeTenant}</strong> e stato annullato.</p>
        <p>Il negozio e tornato al piano base. Alcune funzioni a pagamento possono essere bloccate e la dashboard puo mostrare la pagina di scelta piano.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${safePaywallUrl}" style="background: #0ea5e9; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700;">Riattiva NeatX</a>
        </div>
        <p>Se l'annullamento e stato un errore o vuoi una mano, rispondi a questa email.</p>
      `,
    ),
  });
}
