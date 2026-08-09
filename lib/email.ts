import nodemailer from "nodemailer";
import { Resend } from "resend";

export type EmailTemplate = {
  subject: string;
  html: string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function emailShell(title: string, content: string, preview = title) {
  const support = esc(supportEmail());
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preview)}</div>
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.55;">
      <div style="padding:24px 0;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#0ea5e9;">NeatX</div>
        <div style="font-size:12px;color:#64748b;">Agenda online per professionisti</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:16px;padding:28px;background:#ffffff;">
        <h1 style="margin:0 0 18px;color:#0f172a;font-size:24px;">${esc(title)}</h1>
        ${content}
      </div>
      <p style="font-size:12px;color:#64748b;margin-top:18px;text-align:center;">
        Serve aiuto? Rispondi a questa email oppure scrivi a
        <a href="mailto:${support}" style="color:#0284c7;">${support}</a>.
      </p>
    </div>`;
}

function actionButton(url: string, label: string, color = "#0ea5e9") {
  return `<div style="text-align:center;margin:30px 0;">
    <a href="${esc(url)}" style="background:${color};color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;">${esc(label)}</a>
  </div>`;
}

export async function sendEmail(options: { to: string; subject: string; html: string; replyTo?: string }) {
  if (process.env.MOCK_EMAIL === "true" || process.env.NODE_ENV === "test") {
    console.log(`[Email Mock] Simulated email to ${options.to}: ${options.subject}`);
    return true;
  }

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

export function buildVerificationEmail(ownerName: string, verifyUrl: string, referralBonusPending = false): EmailTemplate {
  const bonus = referralBonusPending
    ? "<p><strong>Dopo la verifica riceverai 50 messaggi bonus invito, per un saldo iniziale totale di 100.</strong></p>"
    : "";
  return {
    subject: "Conferma la tua email per attivare NeatX",
    html: emailShell(
      "Conferma la tua email",
      `<p>Ciao ${esc(ownerName)},</p>
       <p>Prima di iniziare, verifica che questo indirizzo email sia tuo.</p>
       ${bonus}
       ${actionButton(verifyUrl, "Conferma la mia email")}
       <p style="font-size:13px;color:#64748b;">Il link è personale, utilizzabile una sola volta e scade dopo 24 ore. Se non hai creato un account su NeatX, ignora questa email.</p>`,
      "Conferma il tuo indirizzo email per completare l'attivazione di NeatX.",
    ),
  };
}

export async function sendVerificationEmail(tenantEmail: string, ownerName: string, verifyUrl: string, referralBonusPending = false) {
  return sendEmail({ to: tenantEmail, ...buildVerificationEmail(ownerName, verifyUrl, referralBonusPending) });
}

export function buildWelcomeEmail(ownerName: string, tenantUrl: string, referralCode?: string | null): EmailTemplate {
  const safeUrl = esc(tenantUrl);
  const referralBlock = referralCode
    ? `<div style="background:#0b1221;border:1px solid #1e2b4a;border-radius:12px;padding:20px;margin:20px 0;">
         <p style="margin:0 0 8px 0;font-weight:bold;color:#00b4ff;">🎁 Invita un collega e guadagna messaggi gratis</p>
         <p style="margin:0 0 12px 0;font-size:14px;color:#334155;">Porta un collega su NeatX con il tuo link personale: lui parte con <strong>100 crediti</strong>, e tu ricevi <strong>100 crediti</strong> appena attiva il suo primo abbonamento. Nessun limite.</p>
         <p style="margin:0;font-size:14px;color:#334155;">Il tuo link personale:<br>
           <a href="https://neatx.store/registrazione?ref=${esc(referralCode)}" style="color:#0284c7;font-weight:bold;word-break:break-all;">https://neatx.store/registrazione?ref=${esc(referralCode)}</a>
         </p>
       </div>`
    : "";
  return {
    subject: `Benvenuto in NeatX, ${ownerName}! Il tuo gestionale è pronto`,
    html: emailShell(
      "Benvenuto in NeatX!",
      `<p>Ciao ${esc(ownerName)},</p>
       <p>Sono Lorenzo, ho creato NeatX per aiutare professionisti come te a gestire le prenotazioni in modo più semplice.</p>
       <p>Servizi, staff e pagina di prenotazione sono pronti per essere controllati e personalizzati.</p>
       <div style="background:#f4f4f5;padding:20px;border-radius:10px;margin:20px 0;">
         <p style="margin:0;"><strong>Link del tuo negozio:</strong><br><a href="${safeUrl}" style="color:#0284c7;">${safeUrl}</a></p>
       </div>
       ${referralBlock}
       <p>Hai 14 giorni di prova gratuita. Per accedere alla dashboard usa il link qui sopra e la password scelta durante la registrazione.</p>
       <p>A presto,<br><strong>Lorenzo — NeatX</strong></p>`,
      "Il tuo spazio NeatX è pronto: controlla servizi, staff e pagina di prenotazione.",
    ),
  };
}

export async function sendWelcomeEmail(tenantEmail: string, ownerName: string, tenantUrl: string, referralCode?: string | null) {
  return sendEmail({ to: tenantEmail, ...buildWelcomeEmail(ownerName, tenantUrl, referralCode) });
}

export function buildTrialReminder3DaysEmail(tenantName: string, ownerName: string, adminUrl: string): EmailTemplate {
  return {
    subject: `NeatX: la prova di ${tenantName} scade tra 3 giorni`,
    html: emailShell(
      "La prova scade tra 3 giorni",
      `<p>Ciao ${esc(ownerName)},</p>
       <p>La prova gratuita di <strong>${esc(tenantName)}</strong> scade tra <strong>3 giorni</strong>.</p>
       <p>Alla scadenza l'accesso alla dashboard e le funzioni del piano saranno limitati. I dati resteranno salvati e potrai riattivare NeatX in qualsiasi momento.</p>
       ${actionButton(adminUrl, "Scegli il piano", "#10b981")}
       <p style="font-size:13px;color:#64748b;">Pro costa 29 € al mese o 290 € all'anno. Elite costa 59 € al mese o 590 € all'anno.</p>`,
      `La prova di ${tenantName} scade tra 3 giorni; i dati resteranno salvati.`,
    ),
  };
}

export async function sendTrialReminder3Days(tenantEmail: string, tenantName: string, ownerName: string, adminUrl: string) {
  return sendEmail({ to: tenantEmail, ...buildTrialReminder3DaysEmail(tenantName, ownerName, adminUrl) });
}

export function buildTrialReminder1DayEmail(tenantName: string, ownerName: string, adminUrl: string): EmailTemplate {
  return {
    subject: `Ultimo giorno: la prova NeatX di ${tenantName} scade domani`,
    html: emailShell(
      "Ultimo giorno di prova",
      `<p>Ciao ${esc(ownerName)},</p>
       <p>Domani scade la prova gratuita di <strong>${esc(tenantName)}</strong>.</p>
       <p>Con un piano attivo continui a usare:</p>
       <ul>
         <li>agenda e prenotazioni online;</li>
         <li>gestione di servizi, staff, orari e sedi;</li>
         <li>storico clienti, note e no-show.</li>
       </ul>
       <p><strong>I dati non vengono cancellati alla scadenza.</strong> L'accesso e alcune funzioni saranno limitati finché non scegli un piano.</p>
       ${actionButton(adminUrl, "Scegli il piano", "#10b981")}
       <p style="font-size:13px;color:#64748b;">Pro costa 29 € al mese o 290 € all'anno. Elite costa 59 € al mese o 590 € all'anno.</p>`,
      `Domani scade la prova di ${tenantName}; i dati non verranno cancellati.`,
    ),
  };
}

export async function sendTrialReminder1Day(tenantEmail: string, tenantName: string, ownerName: string, adminUrl: string) {
  return sendEmail({ to: tenantEmail, ...buildTrialReminder1DayEmail(tenantName, ownerName, adminUrl) });
}

export function buildTrialExpiredOfferEmail(tenantName: string, ownerName: string, paywallUrl: string): EmailTemplate {
  return {
    subject: `NeatX: puoi riattivare ${tenantName} quando vuoi`,
    html: emailShell(
      "Il tuo gestionale è pronto per ripartire",
      `<p>Ciao ${esc(ownerName)},</p>
       <p>La prova di <strong>${esc(tenantName)}</strong> è scaduta, ma i tuoi dati sono ancora salvati.</p>
       <p>Riattivando l'abbonamento ritroverai:</p>
       <ul>
         <li>servizi, staff e orari già configurati;</li>
         <li>il link di prenotazione pronto per tornare online;</li>
         <li>dati, clienti e appuntamenti già inseriti.</li>
       </ul>
       ${actionButton(paywallUrl, "Scegli il piano")}`,
      `${tenantName} è pronto per essere riattivato senza perdere i dati già inseriti.`,
    ),
  };
}

export async function sendTrialExpiredOffer(tenantEmail: string, tenantName: string, ownerName: string, paywallUrl: string) {
  return sendEmail({ to: tenantEmail, ...buildTrialExpiredOfferEmail(tenantName, ownerName, paywallUrl) });
}

export function buildPasswordResetEmail(ownerName: string, resetUrl: string): EmailTemplate {
  return {
    subject: "Reimposta la password del tuo account NeatX",
    html: emailShell(
      "Reimposta la password",
      `<p>Ciao ${esc(ownerName || "titolare")},</p>
       <p>Abbiamo ricevuto una richiesta per cambiare la password del tuo account NeatX.</p>
       ${actionButton(resetUrl, "Scegli una nuova password")}
       <p style="font-size:13px;color:#64748b;">Il link è personale, utilizzabile una sola volta e scade dopo 30 minuti.</p>
       <p style="font-size:13px;color:#64748b;">Se non hai richiesto tu il cambio, ignora questa email: la password attuale resterà valida.</p>`,
      "Usa il link personale entro 30 minuti per scegliere una nuova password.",
    ),
  };
}

export async function sendPasswordResetEmail(tenantEmail: string, ownerName: string, resetUrl: string) {
  return sendEmail({ to: tenantEmail, ...buildPasswordResetEmail(ownerName, resetUrl) });
}

export function buildPasswordChangedEmail(ownerName: string, adminUrl: string): EmailTemplate {
  return {
    subject: "Password NeatX modificata correttamente",
    html: emailShell(
      "Password modificata",
      `<p>Ciao ${esc(ownerName || "titolare")},</p>
       <p>La password del tuo account NeatX è stata modificata correttamente.</p>
       <p>Per proteggerti, tutte le sessioni aperte in precedenza sono state chiuse.</p>
       ${actionButton(adminUrl, "Accedi di nuovo")}
       <p style="font-size:13px;color:#64748b;">Se non hai effettuato tu questa modifica, contatta subito l'assistenza rispondendo a questa email.</p>`,
    ),
  };
}

export async function sendPasswordChangedEmail(tenantEmail: string, ownerName: string, adminUrl: string) {
  return sendEmail({ to: tenantEmail, ...buildPasswordChangedEmail(ownerName, adminUrl) });
}

export function buildSubscriptionActivatedEmail(
  tenantName: string,
  ownerName: string,
  plan: "pro" | "elite",
  interval: "month" | "year",
  adminUrl: string,
): EmailTemplate {
  const planLabel = plan === "elite" ? "Elite" : "Pro";
  const intervalLabel = interval === "year" ? "annuale" : "mensile";
  return {
    subject: `NeatX ${planLabel} attivo per ${tenantName}`,
    html: emailShell(
      `Abbonamento ${planLabel} attivo`,
      `<p>Ciao ${esc(ownerName || "titolare")},</p>
       <p>Il piano <strong>${planLabel} ${intervalLabel}</strong> per <strong>${esc(tenantName)}</strong> è attivo.</p>
       <p>Puoi continuare a usare dashboard, pagina clienti, servizi, orari e gestione appuntamenti senza interruzioni.</p>
       ${actionButton(adminUrl, "Vai alla dashboard")}
       <p><strong>Nota operativa:</strong> i promemoria WhatsApp sono temporaneamente disattivati. NeatX non mostra falsi invii riusciti e non consuma crediti per questa funzione finché resta disattivata.</p>`,
    ),
  };
}

export async function sendSubscriptionActivatedEmail(
  tenantEmail: string,
  tenantName: string,
  ownerName: string,
  plan: "pro" | "elite",
  interval: "month" | "year",
  adminUrl: string,
) {
  return sendEmail({ to: tenantEmail, ...buildSubscriptionActivatedEmail(tenantName, ownerName, plan, interval, adminUrl) });
}

export function buildPaymentFailedEmail(tenantName: string, ownerName: string, portalUrl: string): EmailTemplate {
  return {
    subject: `Pagamento NeatX non riuscito per ${tenantName}`,
    html: emailShell(
      "Pagamento non riuscito",
      `<p>Ciao ${esc(ownerName || "titolare")},</p>
       <p>Stripe ci ha segnalato che il pagamento dell'abbonamento di <strong>${esc(tenantName)}</strong> non è andato a buon fine.</p>
       <p>Di solito succede per carta scaduta, fondi insufficienti o autenticazione bancaria non completata.</p>
       ${actionButton(portalUrl, "Apri dashboard pagamenti", "#ef4444")}
       <p>Stripe riproverà automaticamente. Se il pagamento non viene risolto, l'accesso al piano a pagamento potrà essere sospeso.</p>`,
    ),
  };
}

export async function sendPaymentFailedEmail(tenantEmail: string, tenantName: string, ownerName: string, portalUrl: string) {
  return sendEmail({ to: tenantEmail, ...buildPaymentFailedEmail(tenantName, ownerName, portalUrl) });
}

export function buildSubscriptionCanceledEmail(tenantName: string, ownerName: string, paywallUrl: string): EmailTemplate {
  return {
    subject: `Abbonamento NeatX annullato per ${tenantName}`,
    html: emailShell(
      "Abbonamento annullato",
      `<p>Ciao ${esc(ownerName || "titolare")},</p>
       <p>L'abbonamento NeatX di <strong>${esc(tenantName)}</strong> è stato annullato.</p>
       <p>Il negozio è tornato al piano base. Alcune funzioni a pagamento possono essere bloccate e la dashboard può mostrare la pagina di scelta piano.</p>
       <p><strong>I dati non sono stati cancellati.</strong></p>
       ${actionButton(paywallUrl, "Riattiva NeatX")}
       <p>Se l'annullamento è stato un errore o vuoi una mano, rispondi a questa email.</p>`,
    ),
  };
}

export async function sendSubscriptionCanceledEmail(tenantEmail: string, tenantName: string, ownerName: string, paywallUrl: string) {
  return sendEmail({ to: tenantEmail, ...buildSubscriptionCanceledEmail(tenantName, ownerName, paywallUrl) });
}
