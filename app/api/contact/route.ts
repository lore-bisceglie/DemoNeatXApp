import { checkRequestRateLimit } from "@/lib/request-rate-limit";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const rate = await checkRequestRateLimit(request, "contact", 10, 60 * 60);
    if (!rate.success) {
      return Response.json({ error: "Troppe richieste" }, { status: 429 });
    }
    const { name, email, message } = await request.json();

    if (
      !name || !email || !message ||
      typeof name !== "string" || name.length > 100 ||
      typeof email !== "string" || email.length > 254 ||
      typeof message !== "string" || message.length > 5000
    ) {
      return Response.json({ error: "Campi mancanti" }, { status: 400 });
    }

    const target = process.env.CONTACT_EMAIL || process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL || "assistenza.neatx@gmail.com";
    const safeSubjectName = name.replace(/[\r\n]+/g, " ");
    const sent = await sendEmail({
      to: target,
      replyTo: email,
      subject: `Nuovo contatto da ${safeSubjectName}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;color:#333;">
          <h2 style="color:#00b4ff;">Nuova richiesta di contatto</h2>
          <p><strong>Nome:</strong> ${esc(name)}</p>
          <p><strong>Email:</strong> ${esc(email)}</p>
          <p><strong>Messaggio:</strong></p>
          <blockquote style="background:#f4f4f5;padding:16px;border-radius:8px;white-space:pre-wrap;">${esc(message)}</blockquote>
        </div>`,
    });

    if (!sent) {
      return Response.json({ error: "Servizio email temporaneamente non disponibile" }, { status: 503 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Errore interno" }, { status: 500 });
  }
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
