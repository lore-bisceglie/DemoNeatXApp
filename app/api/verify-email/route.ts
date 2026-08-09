import { ensureReferralCode, verifyTenantAndGrantReferralBonus } from "@/lib/referral";
import { getTenantAdminUrl } from "@/lib/domains";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const slug = searchParams.get("slug");

    if (!token || !slug) {
      return new Response(
        `<html><body style="font-family:sans-serif;background:#050814;color:white;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><h1 style="color:#ef4444">Link non valido</h1><p>Mancano i parametri di verifica.</p></div></body></html>`,
        { status: 400, headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    const verification = await verifyTenantAndGrantReferralBonus(token, slug);
    if (!verification) {
      return new Response(
        `<html><body style="font-family:sans-serif;background:#050814;color:white;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><h1 style="color:#ef4444">Link non valido o scaduto</h1><p>Il link di verifica non è più valido. Contatta il supporto.</p></div></body></html>`,
        { status: 400, headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    if (verification.shouldSendWelcomeEmail && verification.ownerEmail) {
      let referralCode: string | null = null;
      try {
        referralCode = await ensureReferralCode(verification.tenantId);
      } catch (error) {
        console.error("[Email] Errore recupero codice invito:", error);
      }
      await sendWelcomeEmail(
        verification.ownerEmail,
        verification.ownerName || "",
        getTenantAdminUrl(verification.slug),
        referralCode,
      ).catch((error) => {
        console.error("[Email] Errore invio benvenuto dopo verifica:", error);
      });
    }

    const bonusMessage = verification.bonusCredits > 0
      ? `<p style="color:#a7f3d0">Invito confermato: hai ricevuto ${verification.bonusCredits} messaggi bonus.</p>`
      : "";
    return new Response(
      `<html><body style="font-family:sans-serif;background:#050814;color:white;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div style="max-width:400px"><h1 style="color:#10b981">Email verificata ✅</h1>${bonusMessage}<p>Ora puoi accedere alla dashboard.</p><a href="/t/${slug}/admin" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#00b4ff;color:white;border-radius:12px;text-decoration:none;font-weight:bold">Vai alla dashboard</a></div></body></html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Errore verifica email:", error);
    return new Response(
      `<html><body style="font-family:sans-serif;background:#050814;color:white;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><h1 style="color:#ef4444">Errore</h1><p>Riprova più tardi.</p></div></body></html>`,
      { status: 500, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }
}
