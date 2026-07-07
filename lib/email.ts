import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
// It won't throw if missing immediately, but will fail gracefully when sending
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// The generic sender email (you must verify a domain on Resend later, e.g. hello@neatx.store)
// For now, Resend allows sending from onboarding@resend.dev to the registered email address during testing
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function sendWelcomeEmail(tenantEmail: string, tenantName: string, adminPassword: string, tenantUrl: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Skipping welcome email to", tenantEmail);
    return false;
  }

  try {
    const data = await resend.emails.send({
      from: `NeatX <${FROM_EMAIL}>`,
      to: [tenantEmail],
      subject: `Benvenuto in NeatX, ${tenantName}! Il tuo gestionale è pronto 🎉`,
      html: `
        <div style="font-family: sans-serif; max-w-xl; margin: 0 auto; color: #333;">
          <h1 style="color: #00b4ff;">Benvenuto a bordo!</h1>
          <p>Ciao,</p>
          <p>Il tuo spazio gestionale per <strong>${tenantName}</strong> è stato creato ed è pronto all'uso.</p>
          
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Link di Accesso:</strong> <a href="${tenantUrl}">${tenantUrl}</a></p>
            <p style="margin: 0;"><strong>Password Admin:</strong> <code>${adminPassword}</code></p>
          </div>

          <p>Usa il link qui sopra per accedere alla tua bacheca privata e iniziare a configurare i tuoi servizi e i tuoi orari.</p>
          <br/>
          <p>Buon lavoro,<br/><strong>Il Team di NeatX</strong></p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email via Resend:", error);
    return false;
  }
}
