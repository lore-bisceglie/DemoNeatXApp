import { NextResponse } from "next/server";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";
import { prisma } from "@/lib/prisma";
import {
  addMinutes,
  dateFromOffset,
  getDemoShopTemplate,
  sanitizeSlug,
} from "@/lib/demoShopTemplates";
import { getTenantAdminUrl, getTenantPublicUrl } from "@/lib/domains";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";

import { buildMapsLink, normalizeInstagramUrl, normalizeOptionalUrl, normalizeTikTokUrl, normalizeWhatsappPhone } from "@/lib/contact";

const TRIAL_DAYS = 14;

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

async function uniqueSlug(base: string) {
  const root = sanitizeSlug(base);

  const existing = await prisma.tenant.findUnique({ where: { slug: root } });
  if (!existing) return root;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.random().toString(36).substring(2, 6);
    const slug = `${root}-${suffix}`;
    const trial = await prisma.tenant.findUnique({ where: { slug } });
    if (!trial) return slug;
  }

  return `${root}-${Date.now().toString(36)}`;
}

async function sendTelegramNotification(tenant: any, ownerName: string, category: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = `🚨 <b>NUOVO NEGOZIO</b> 🚨\n\n` +
    `👤 <b>${ownerName}</b>\n` +
    `🏪 <b>${tenant.name}</b>\n` +
    `📍 ${tenant.city} | ${category}\n` +
    `📞 ${tenant.phone}\n\n` +
    `<a href="https://wa.me/${tenant.phone.replace(/[^0-9]/g, '')}">📱 Scrivi su WhatsApp</a>`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Attiva Manualmente", callback_data: `approve_${tenant.id}` },
              { text: "🔴 Elimina (Spam)", callback_data: `delete_${tenant.id}` }
            ]
          ]
        }
      })
    });
  } catch (e) {
    console.error("Telegram notification failed", e);
  }
}

export async function POST(req: Request) {
  try {
    const rate = await checkRequestRateLimit(req, "onboarding", 5, 60 * 60);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Troppe registrazioni da questa rete. Riprova più tardi." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }
    const body = await req.json();
    if (body.legalAccepted !== true) {
      return NextResponse.json(
        { error: "Accetta Privacy Policy e Termini di servizio per continuare." },
        { status: 400 },
      );
    }
    const businessName = cleanText(body.businessName || body.name);
    const category = cleanText(body.category || body.template, "barber");
    const city = cleanText(body.city);
    const ownerName = cleanText(body.ownerName);
    const email = cleanText(body.email).toLowerCase();
    const password = cleanText(body.password);
    const phone = normalizeWhatsappPhone(body.phone);
    const address = cleanText(body.address, city) || city;
    const description = cleanText(body.description);
    const trialDays = TRIAL_DAYS;
    const instagramUrl = normalizeInstagramUrl(body.instagramUrl);
    const tiktokUrl = normalizeTikTokUrl(body.tiktokUrl);
    const websiteUrl = null;
    const bookingUrl = null;
    const mapsLink = normalizeOptionalUrl(body.mapsLink) || buildMapsLink(address);
    const rawLogo = typeof body.logoUrl === "string" ? body.logoUrl.trim() : "";
    const logoUrl =
      rawLogo && (rawLogo.startsWith("http") || rawLogo.startsWith("data:image/"))
        ? rawLogo
        : null;
    const themeColor = cleanText(body.themeColor) || "cyan";

    if (!businessName || !category || !city || !ownerName || !password || !phone || !email) {
      return NextResponse.json(
        { error: "Inserisci nome attività, categoria, città, email, nome, password e numero WhatsApp." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La password deve avere almeno 8 caratteri." }, { status: 400 });
    }

    const disposableDomains = new Set([
      "10minutemail.com","10minutemail.net","10minutemail.org","mailinator.com","mailinator.net",
      "guerrillamail.com","guerrillamail.net","guerrillamail.org","sharklasers.com","grr.la",
      "temp-mail.org","temp-mail.ru","tempmail.net","tempmail.org","tempmail.io",
      "throwaway.email","throwaway.mail","throwawaymail.com","throwawaymail.net",
      "yopmail.com","yopmail.fr","yopmail.net","yopmail.org",
      "maildrop.cc","getairmail.com","getairmail.net","airmail.cc",
      "spam4.me","spamgourmet.com","spam.la","spam.care",
      "trashmail.com","trashmail.net","trashmail.org","trashmail.me",
      "fakeinbox.com","fake-mail.net","fake-mail.com","fakemail.net",
      "mailexpire.com","mailexpire.net","mailnator.com","mailnator.net",
      "mail-tester.com","mytemp.email","mytemp-mail.com","tempemail.co",
      "tempmailo.com","tempmail.space","tempmail.dev","tempmail.net",
      "emailondeck.com","emailondeck.net","inboxkitten.com","inboxbear.com",
      "mohmal.com","mohmal.net","mohmal.org","mohmal.in",
      "burner.email","burnermail.io","burner.kiwi",
      "mailmetrash.com","maildrop.cf","maildrop.ga","maildrop.gq","maildrop.ml",
      "dispostable.com","dispostable.net",
      "mail.td","gmail.cm","cmail.com","hmail.com","hmail.org",
      "0-mail.com","00mail.com","0815.ru","0815.ru","0815.su",
      "027168.com","1-8.biz","1000rebates.stream","100likers.com",
      "123-m.com","12host.info","12storage.com","1ce.us",
      "1chuan.com","1clck2.com","1mail.ml","1pad.de","1s.fr",
      "1st-software.com","1thecity.biz","2.1c.xyz","2-ch.space",
      "2-mail.com","2.prreply.ml","2anom.com","2ch.daemon.asia","2ch.tc",
      "2emai.com","2eme.de","2nd-mail.xyz","2o10.com","2p-mail.com",
      "2sea.com","2sea.org","2y2.eu","3.1c.xyz","3.fackme.gq",
      "3g.1c.xyz","3l6.com","3mail.ga","3trtretgfr.de","4-mail.com",
      "4.pookmail.com","4an.daemon.asia","4gf.daemon.asia","4mail.ga",
      "4tb.host","4wxf.com","5.1c.xyz","5.pookmail.com","5am5ung.xyz",
      "5mail.ga","5x25.com","6-6-6.1c.xyz","6.ip6.li","6.pookmail.com",
      "60-minuten-mail.de","6mail.ga","6paq.com","7.pookmail.com",
      "7tags.com","8.pookmail.com","9.pookmail.com","9mail.cf",
      "99experts.com","99mail.cf","99nic.xyz","a-bc.net","a.bc",
      "a.bc","a.mailcker.com","a.safe-mail.gq","a.safe-mail.net",
      "abcmail.email","abour.space","aboutmail.ml","absoluteweb.org",
      "abusemail.de","abusive-email.com","abv,mail.com","accesscam.org",
      "acceso.correo.care","acm.tf","acmeco.tk","acrossgracealley.com",
      "activist.com","ag.us.to","agtx.org","ahk.jp","ahmadidik.com",
      "ai.hsg.ml","aifu.cf","aim.com","airforce.email","airmailbox.website",
      "akademiyauspexa.xyz","akgq701.com","al-qaeda.us","albion2017.com",
      "alexbox.online","alimunjaya.xyz","alivance.com","aliyah.su",
      "alldirectbuy.com","allen.nom.za","allergist.com","allthegoodnamesaretaken.org",
      "alph.wtf","ama-trans.de","amail.com","amail4.me","amazon-aws.com",
      "amelabs.com","ametiks.com","amoksystems.com","amor.mail",
      "ampleplex.com","amxy.rocks","an.id.au","anappthat.com","andetne.ws",
      "andreabest.space","angelic.com","animail.net","animalhouse.com",
      "animalwoman.net","anjing.cool","annafashion.xyz","annuairesmaigrir.com",
      "ano-mail.net","anon-mail.de","anonbox.net","anonmail.top",
      "anonmail.de","anonmail.top","anonymail.dk","anonymbox.com",
      "anonymized.org","anonyms.app","anonymous.to","anoxemion.com",
      "antholit.com","antispam24.de","antispam.de","antongulenko.com",
      "anyalias.com","aol.com","apkmd.com","appc.se","appinventor.nl",
      "appixie.com","apps.dj","arduino.hk","arnext.glitch.me",
      "aroundmail.com","art-en-ligne.pro","artman.cf","arur01.tk",
      "as.ke","asdasd.nl","asdasd.ru","ashikmail.ml","ask-mail.com",
      "asurare.com","at.hm","at0mik.org","ato.check.com","augmentation.cloud",
      "ausgefallen.info","auto-matic.ga","autograph.tv","autotwollow.com",
      "avast.com","avju.eu","avr.ovh","awatum.de","awiki.org",
      "ax80.com","axiz.org","axon7zte.com","azazazatashkent.tk",
      "azcomputerworks.com","azmeil.tk","b.yertxenor.tk","b0.nu",
      "b1of96u.com","b2bx.net","b2cmail.de","badhus.org",
      "banit.club","banit.me","bareed.ws","barry.pw","bastore.pro",
      "baxomale.ht.cx","bazaaboom.com","bbhost.us","bcaoo.com",
      "bcast.ws","bcb.ro","bcc.ro","bco.bml.de","bco.ro",
      "bdmuzic.pw","beaconmessenger.com","bearsarefuzzy.com",
      "beddley.com","beefmilk.com","belamail.org","belljonestiz.com",
      "benipaula.org","bestchoiceusedcar.com","bestlistbase.com",
      "bestoption25.club","bestparadize.com","bestsoundeffects.com",
      "besttopdeals.store","besttoecuncelasdfsdf.space",
      "bfo.kr","bgtmail.com","bho.hu","bidet.cc","big1.us",
      "bigprofessor.so","bigstring.com","bigwhoop.co.za","bij.pl",
      "binka.me","binkmail.com","binnary.com","binpo.ovh",
      "bio-muesli.info","bio-muesli.net","birchmail.tk","birdsfly.com",
      "biscutt.com","biz.st","bizmail.ml","bkkmail.ga",
      "blackmail.ml","blackmarket.tf","blackworld.info",
      "blade15.base.pk","blink182.net","block-chain.tech",
      "bloggersxmi.com","blogos.net","blow-job.nut.cc","blubb.cl",
      "bluebottle.com","bluerobot.info","blugmail.top","blutmail.me",
      "bnote.com","boardermail.com","boatist.com","bodhi.laugh",
      "bogotadc.info","bofthew.com","bomb8.com","bongobongo.ml",
      "bonobo.co.ua","bookthemmove.com","boots.space","bopunkten.se",
      "botz.online","boun.cr","bouncr.com","boxformail.com","boximail.com",
      "boxturtle.net","boxy.lol","brandbuzz.xyz","brandon.tk",
      "brasx.org","breadtimes.press","breakthru.com","brefmail.com",
      "brennendesreich.de","briggsmarcus.com","britishintelligence.co.uk",
      "broadbandninja.com","browniesgourmet.xyz","bsamail.de","bubblenut.com",
      "buchhandlung24.com","bugmenot.com","bugmenot.ml","buhesc.xyz",
      "bukwos.xyz","bulkorg.ml","bullbeer.net","bum.net",
      "bumpymail.com","bunchofidiots.com","bundy.xyz","bungabunga.xyz",
      "bunsenhoneydew.com","buratinable.tk","burn-me-gently.net",
      "bund.us","bundy.xyz","bussiness777.xyz","buzzcompact.com",
      "bwa33.net","bx9.xyz","by8006l.com","byebyemail.com","byom.de",
      "c.andreihusanu.ro","c.hcacai.cf","c.kes.tk","c.la","c.nut.emailused.ga",
      "c4an.xyz","c51vsgq.com","cachedot.net","cadollo.com","cafecar.xyz",
      "caisel.com","californiafitnessdeals.com","camator.com","camping-grill.info",
      "candymail.de","canyouhearus.com","canyouhearmen.com","car101.pro",
      "carbtc.net","card.zp.ua","careless-whisper.com","cartersar.com",
      "casarefoo.tk","casema.nl","casualdx.com","cavi.mx","cbair.com",
      "cbes.net","ccg.ovh","ccko.me","ccmail.ga","cde.one",
      "cdpa.cc","ceed.se","cek.pm","cellier.xyz","centermail.com",
      "centermail.net","centrallosana.ga","cetpass.com","cflog.xyz",
      "cghost.ga","ch.tc","chacuo.net","chaichuang.com","chamer.blutmail.me",
      "chanel.space","changingmail.com","chark.ddns.me","chatich.com",
      "chatme.xyz","chauhanbhai.xyz","cheaphorde.com","cheatmail.de",
      "chechnya.gov","checknowmail.com","chem凝聚.com","chibakenma.ml",
      "chickenkiller.com","chielo.com","chilkat.com","chithi.xyz",
      "choco.la","chogmail.com","choicemail1.com","chong-mail.com",
      "chong-mail.net","christopherfretz.com","chronomail.com",
      "chumpstakingdumps.com","cigar-auctions.com","civx.org",
      "cjpeg.com","ckaazaza.tk","ckiso.com","cl-cl.org","clandest.in",
      "claus.tk","clear.website","clearholidays.com","clearmail.online",
      "cleverfabric.com","click.email","cliptik.net","clixser.com",
      "clrmail.com","cmail.net","cmail.org","cmpmail.com","cmpnetmail.com",
      "cnamed.com","cnew.ir","cnmsg.net","cnsa.me","codeandscotch.com",
      "codec.ro","codec.ro.ro","codec.ro.ro.ro","codecub.com",
      "coderrat.com","codiv.dev","codiv.dev","codupil.com","coffeeshipper.com",
      "coieo.com","coinlink.club","coldemail.info","coldmail.ga","coldmail.space",
      "collectiblepens.com","colourbath.com","combat-mail.ml","combatmail.ml",
      "comcast.com","comic.com","compareshippingrates.org","completebusiness.com",
      "comporium.com","compuserve.com","comunidad.xyz","concealed.company",
      "concond.xyz","condor.deposit.lo","conk.me","consumerriot.com",
      "contbay.com","conte.com","coole-files.org","cool.fr.nf","coolandwacky.com",
      "coolimpool.org","coolmailcool.com","cooperation.net","cooperationtogo.net",
      "copout.com","cordless.com","corerepo.com","corgipedia.com",
      "correotemporal.org","correoverde.click","cosmorph.com","counsellor.com",
      "couponcodes.bid","courriel.fr.nf","courrieltemporaire.com",
      "coza.ro","cphq.xyz","crabpeople.info","crankymail.me","crap.kakadua.net",
      "crapmail.org","crashkiller.ovh","crazespaces.pw","crazydoll.us",
      "crazymailing.com","cream.pink","creazion.com","creo.ml","criema.xyz",
      "crisalgado.com","crypto.tyrex.cf","crypto-net.club","cryptolabs.email",
      "cryp.email","cryp.email","cryp.email","cryp.email","ctmailing.xyz",
      "cu.cc","cubiclink.com","cuemail.com","cuirworld.xyz","culot.live",
      "cupidointeligente.com","cupik.com","curryworld.de","cursodemichelinstar.xyz",
      "custom12.tk","custom26.tk","custom3.tk","customfitnesshacks.com",
      "cutout.club","cx.de-a.org","cyber-innovation.club","cyber-phone.eu",
      "cyber-wizard.com","cybergal.com","cybermail.net","cybersex.com",
      "cylab.org","d.monpetitcornu.xyz","d.pilan.de","d.pilan.de",
      "d.pilan.de","d.monpetitcornu.xyz","dab.ro","dab.ro","dacoolest.com",
      "dadd.kikwet.com","daemsteam.com","dahong.xyz","daibond.xyz",
      "daily.email","daimlerag.com","dammexe.net","dammmn.xyz",
      "damnthespam.com","dandikmail.com","dankr.xyz","danyde.ar",
      "darknode.org","darkweb.email","darkweb.xxx","daryxfox.net",
      "dasdasdascyka.tk","dashpad.com","dataarca.com","datafaka.com",
      "dataful.tech","datarca.com","datasoma.com","dath.one","david.kim",
      "davidlopez.xyz","dawetr.xyz","day-old.tk","daymail.ga",
      "daymail.life","daymail.xyz","dayrep.com","daz.xyz","dbunker.com",
      "dcemail.com","ddcrew.com","de-fraye.ml","deadaddress.com",
      "deadchildren.org","deadfake.cf","deadfake.ga","deadfake.ml",
      "deadfake.tk","deadspam.com","deagot.com","dealja.com",
      "dealrek.com","deekayen.us","defmail.tk","defou.xyz",
      "degradedfun.xyz","deine.mom","deinmail.de","delayload.net",
      "deliverme.top","demen.ml","dengekibunko.xyz","denisn.ru",
      "deniz.gen.tr","denov.info","departement-store.com","der-malocher.de",
      "der.2r-aw.xyz","deshif.ru","deshmart.com","desidaz.com",
      "despam.it","despammed.com","destemps.xyz","destroyed.systems",
      "dev-null.cf","dev-null.ga","dev-null.ml","dev-null.tk",
      "dev.animato.wiki","devnullmail.com","devx.me","dfg6.kozow.com",
      "dfg.net","dfozer.net","dfwatch.net","dgd.mail-temp.com",
      "dhobilog.com","dialogus.com","diamond.xyz","dicksinhisan.us",
      "dicksinmyan.us","digitalforeplay.net","digitalmariachis.com",
      "digitalsanctuary.com","digmed.ru","dim-coin.com","dim-coin.net",
      "dimensione.ovh","dingbone.com","dinkel-ried.de","dino-auction.org",
      "dioscolgado.com","directmail24.net","disaq.com","disbox.net",
      "disbox.org","discard.cf","discard.email","discard.ga","discard.gq",
      "discard.ml","discard.tk","discardmail.com","discardmail.de",
      "discordmail.com","discos4.com","discretevtd.com","disign-concept.eu",
      "disign-revelation.com","dispo.in","dispomail.xyz","disposable.alwaysdata.net",
      "disposable.cf","disposable.ga","disposable.gq","disposable.ml",
      "disposable.tk","disposable-4.ml","disposable-email.ml",
      "disposable-mail.com","disposable-mail.gq","disposable-web-mail.com",
      "disposableaddress.com","disposableemailaddresses.com",
      "disposableinbox.com","disposablemail.space","disposablemails.com",
      "dispose.am","dispose.it","disposo.com","dlemail.ru","dlemail.xyz",
      "dlmk.xyz","dlymail.xyz","dm.wiki.4t.com","dmarcinkiewicz.com",
      "dndent.com","dnsbox.ga","dnsabr.com","doanart.com","dob.jp",
      "dodgeit.com","dodgemail.de","dodgit.com","dodgit.org","dodsi.com",
      "dog-n-cat.xyz","doiea.com","dolphinnet.net","domforfb1.tk",
      "domforfb2.tk","domforfb3.tk","domforfb4.tk","domforfb5.tk",
      "domforfb6.tk","domforfb7.tk","domforfb8.tk","domain1dadada.com",
      "domainaing.xyz","domainaing.cf","domaindesi.com","domaindixon.com",
      "domainsone.xyz","domforf.com","domforf1.tk","domforf18.tk",
      "domforf2.tk","domforf3.tk","domforf4.tk","domforf5.tk",
      "domforf6.tk","domforf7.tk","domforf8.tk","domforf9.tk",
      "domozmail.com","donemail.com","dongqing.xyz","donjuan.xyz",
      "dontreg.com","dontsendmeshit.com","doomdns.com","doquier.tk",
      "dot-ml.ml","dotman.de","dotmsg.com","doublemail.de","doubt.xyz",
      "dovecot.org","download.express","dox.pp.ua","doyouneedmore.info",
      "dr.com","drdrb.com","drdrb.net","dred.ru","drevo.si",
      "drf.email","driftnet.info","droidem.ru","dronepower.ovh",
      "dropmail.me","droplegal.xyz","dropzone.xyz","dubsoft.xyz",
      "duc.xyz","duck.com","duduc.xyz","duk33.com","dukedish.com",
      "dumoac.net","dump-email.info","dumpandjunk.com","dumpmail.com",
      "dumpmail.de","dumpyemail.com","dunflimblag.mailexpire.com",
      "durandinterstellar.com","duskmail.com","dx.xyz","dyceroprojects.com",
      "dz17.net","e-mail.com","e-mail.net","e-mail.org","e-postkasten.de",
      "e-postkasten.eu","e-postkasten.info","e.milavitsaromania.ro",
      "e3z.de","e4d.net","e4ward.com","earthlink.net","easy-applied.org",
      "easy-trash-mail.com","easytrashmail.com","eatmea2z.club",
      "eb609s.com","ebano.camp","echt-mail.de","echt-post.de","ecig.best",
      "ecolo-online.fr","edgex.xyz","edv-bus.com","edv-loft.de",
      "edv.x.xyz","ee.cart.se","ee2.pl","eelmail.com","efss.xyz",
      "egit.xyz","egz.xyz","einfach.com","einmalmail.de","einrot.com",
      "einrot.de","eintagsmail.de","elearningjournal.com","electriccarvehicle.com",
      "electro.mn","elitevip.cf","email-fake.cf","email-fake.com",
      "email-fake.ga","email-fake.gq","email-fake.ml","email-fake.tk",
      "email-gx.com","email-jetable.fr","email-lab.com","email-list.xyz",
      "email-sense.com","email-temp.com","email.biz","email.cbes.net",
      "email.com","email.de","email.dreamprox.com","email.freecrypt.org",
      "email.gay","email.ga","email.gq","email.hao.xyz","email.land",
      "email.ml","email.nbx.ml","email.net","email.nu","email.ro",
      "email.selljob.site","email.tg","email.tk","email.ua","email.wallet.ovh",
      "email0.cloud","email1.cloud","email1.email","email365.xyz",
      "email60.com","email66.com","emailage.cf","emailage.ga","emailage.gq",
      "emailage.ml","emailage.tk","emailate.com","emailautomatrix.com",
      "emailchoice.com","emailcorner.net","emailease.com","emailem.xyz",
      "emailfake.ml","emailfow.ga","emailfreedom.ml","emailgenerator.de",
      "emailgo.de","emailid.xyz","emailinfive.com","emailisvalid.com",
      "emaillime.com","emailmail.gq","emailmenow.de","emailmiser.com",
      "emailna.life","emailna.co","emailnope.com","emailo.online",
      "emailondeck.com","emailoreactor.com","emailpinoy.com","emailplanet.com",
      "emailproxsy.com","emails.ga","emails.incisiv.top","emailsecurer.com",
      "emailsensei.com","emailserver.xyz","emailsing.xyz","emailsy.eu",
      "emailtea.com","emailtech.info","emailtemporanea.net","emailtemporanea.com",
      "emailtemporar.ro","emailtemporario.com.br","emailthe.net",
      "emailtmp.com","emailto.de","emailure.net","emailwarden.com",
      "emailx.at","emailx.net","emailx.org","emailz.ga","emailz.gq",
      "emailz.cf","emailz.ml","emailz.tk","emlhub.com","emlpro.com",
      "emltmp.com","emx.ru","emz.net","en.true-pravda.ru","endjnd.tk",
      "eng.xyz","enron.com","enterto.com","enu.k6t.ru","envy17.xyz",
      "eorbs.com","epb.tk","ephemail.net","ephemeral.email","epost.com",
      "eq.ucoz.ru","eqiluxspam.ga","equ.if.ua","erack.net","eramis.ga",
      "ereply.xyz","eroticplanet.xyz","esbano.ru","esc.la","escapehatchapp.com",
      "ese.kane.xyz","esi.xyz","esmec.xyz","espace.space","espamx.com",
      "esqu.xyz","est.une.victime.nu","etgdev.de","ethersports.xyz",
      "etranquil.com","etranquil.net","etranquil.org","euaqa.com",
      "euapk.com","eun.xyz","euro.traffic.o2.ovh","eurotrash.com",
      "evanfox.info","evenstar.xyz","everyone.delivery","everyone.xyz",
      "evilbruce.com","evilcomputer.com","evilg.me","evopo.com",
      "evyush.com","exbte.com","exbts.com","exelica.xyz","existiert.net",
      "exitstageleft.net","explodemail.com","express.net.ua","extanews.xyz",
      "extendw.com","extra.osc","extraaaa.xyz","eyouth.com","ez.lt",
      "ezz.bzz.zz.e4ward.com","f1.parachat.com","f2h-mail.ml","f3b.xyz",
      "f5.si","facebook-email.cf","facebook-email.ga","facebook-email.ml",
      "facebookmail.gq","facebookmail.ml","fackme.gq","fag.wf","fai.ebreo.ml",
      "failbone.com","faithkills.com","fake-box.com","fake-email.pp.ua",
      "fake-mail.ml","fakedemail.com","fakeemail.de","fakeinbox.info",
      "fakemail.fr","fakemail.win","fakemailgenerator.com","fakermail.com",
      "fakesender.net","faketemporaryemail.com","fakir.xyz","fammella.xyz",
      "fanclub.pm","fansworldwide.de","fantasymail.de","fartwallet.com",
      "fast-urgent.xyz","fastacura.com","fastchevy.com","fastchrysler.com",
      "fasternet.biz","fastkawasaki.com","fastmazda.com","fastmitsubishi.com",
      "fastnissan.com","fastsubaru.com","fastsuzuki.com","fasttoyota.com",
      "fasty.site","fatflap.com","faze.biz","fbi.com","fbi.net",
      "fcking.rhs.ga","fddns.ml","fdmail.xyz","fdsa.2r-aw.xyz",
      "feaethdfx.pw","feeb.xyz","feg.xyz","feinster.xyz","fellows.xyz",
      "femail.ovh","feminin.xyz","fettabernetta.xyz","few.xyz",
      "ffan.xyz","ffs.xyz","fghmail.xyz","ficken.xyz","ficora.com",
      "fifteen.eu","fightallspam.com","figleaf.com","figshot.com",
      "findu.pl","fir.craigslist.org","firef0x.xyz","firemail.de",
      "first-email.net","firstcapitalfibers.com","firstmail.xyz",
      "fischer.xyz","fivemails.xyz","fix-its.xyz","fiww.xyz",
      "fizmail.com","flask.xyz","flashbox.xyz","fleckens.hu","flemail.ru",
      "flemail.xyz","flick.xyz","fliegender.fisch.xyz","flipper.xyz",
      "flit.xyz","floodbrother.com","flowu.xyz","flu.cc","flu.flu.cc",
      "flur.xyz","flur.xyz","fly.xyz","flybymail.cc","flyspam.com",
      "fo.fo-webmail.xyz","fo.xyz","foboc.xyz","fofo.xyz","fog.xyz",
      "fogmail.xyz","fok.xyz","foks.xyz","fond.xyz","fone.xyz",
      "fool.xyz","footard.com","for.mail.xyz","for4mail.xyz","force.xyz",
      "fore.xyz","forecaster.xyz","forgetmail.com","fornow.eu",
      "forspam.net","forward.cat","fou.xyz","found.xyz","four.xyz",
      "fox.xyz","foy.xyz","fr.nf","fr33mail.info","frag.xyz",
      "fragen.xyz","franny.xyz","frapp.xyz","fred.xyz","free-email.ga",
      "free-mail.ga","freebabysittercam.com","freeblackboooty.com",
      "freecat.net","freedom.xyz","freeforall.site","freeghana.com",
      "freelance-france.eu","freelance.xyz","freemail.ms","freemail.tweakly.net",
      "freemailonline.us","freemailnow.net","freemails.cf","freemails.ga",
      "freemails.ml","freemeil.xyz","freeplumpervideos.com","freeschool.org",
      "freeserve.co.uk","freetempemail.com","freeteensex.in","freeweb.email",
      "freewebmaill.com","freezhy.xyz","frfr.xyz","friendlymail.co.uk",
      "fris.xyz","frm.xyz","fro.xyz","from.onmypc.info","from.psychedelics",
      "from.yn","from.zn","front.xyz","frow.xyz","fs-fitzgerald.skiff.com",
      "fsm.xyz","fudger.xyz","fug.xyz","fukt.xyz","fullmail.xyz",
      "fuma.xyz","fun.xyz","function.xyz","fund.xyz","funk.xyz",
      "fur.xyz","fure.xyz","furr.xyz","further.xyz","fus.xyz",
      "fux.xyz","fuxx.xyz","fuy.xyz","fuzz.xyz","fx.xyz","fxm.xyz",
      "fyn.xyz","fyre.xyz","fz.xyz","g.bra.no","g.hmail.xyz",
      "g.tai.xyz","g.tc.xyz","g.y.xyz","ga.piff.xyz","gabohost.com",
      "gad.xyz","gaf.xyz","gag.xyz","gaggle.xyz","gaia.xyz",
      "galaxy.xyz","gamegek.xyz","gamilsy.xyz","gandalf.xyz",
      "gangster.xyz","garb.xyz","garlic.xyz","garn.xyz","garni.xyz",
      "garson.xyz","garter.xyz","gas.xyz","gash.xyz","gasp.xyz",
      "gass.xyz","gaste.xyz","gate.xyz","gaul.xyz","gaw.xyz",
      "gay.xyz","gazp.xyz","gb.xyz","gc.xyz","gd.xyz","ge.xyz",
      "gear.xyz","geb.xyz","gec.xyz","ged.xyz","geed.xyz","geek.xyz",
      "geekforex.xyz","geg.xyz","geh.xyz","gei.xyz","gel.xyz",
      "geld.xyz","gem.xyz","genie.xyz","genx.xyz","geog.xyz",
      "ger.xyz","gerb.xyz","german.xyz","get.xyz","get1mail.com",
      "get2mail.xyz","getairaudit.xyz","getairmail.xyz","getedumail.xyz",
      "getfun.men","getmet.xyz","getmod.xyz","getn.xyz","getnow.xyz",
      "getonemail.com","getonemail.net","getsimple.xyz","getsi.xyz",
      "gett.xyz","getvmail.xyz","gex.xyz","gey.xyz","ggf.xyz",
      "ggmail.xyz","gg.xyz","gh.xyz","ghe.xyz","ghi.xyz","ghost.xyz",
      "giacmosuaviet.info","giantmail.de","gif.xyz","gifted.xyz",
      "gig.xyz","giga.xyz","gigs.xyz","gim.xyz","ginger.xyz",
      "ginn.xyz","ginp.xyz","gio.xyz","gir.xyz","girl.xyz",
      "given.xyz","gjn.xyz","gl.xyz","glad.xyz","gld.xyz","glen.xyz",
      "glid.xyz","glim.xyz","glock.xyz","glow.xyz","glq.xyz",
      "glucose.xyz","glum.xyz","gly.xyz","gm.xyz","gn.xyz",
      "gnail.xyz","gnu.xyz","go.xyz","goal.xyz","gob.xyz",
      "goblin.xyz","god.xyz","godaddy.xyz","goemail.xyz","goff.xyz",
      "gog.xyz","goggle.xyz","going.xyz","gol.xyz","gold.xyz",
      "golf.xyz","golv.xyz","gone.xyz","gonk.xyz","gook.xyz",
      "google.xyz","gope.xyz","gor.xyz","gorb.xyz","gore.xyz",
      "gorge.xyz","gorm.xyz","gorn.xyz","gos.xyz","gosh.xyz",
      "gosu.xyz","got.xyz","goth.xyz","gotmail.xyz","gour.xyz",
      "gov.xyz","gp.xyz","gr.xyz","grab.xyz","grace.xyz","grad.xyz",
      "gram.xyz","grand.xyz","grant.xyz","graph.xyz","gras.xyz",
      "grass.xyz","gray.xyz","graz.xyz","gree.xyz","green.xyz",
      "grek.xyz","grey.xyz","grip.xyz","grit.xyz","grm.xyz",
      "grow.xyz","gru.xyz","gruz.xyz","gs.xyz","gst.xyz","gt.xyz",
      "gth.xyz","gtn.xyz","gto.xyz","gtr.xyz","gu.xyz","guar.xyz",
      "gub.xyz","guer.xyz","guf.xyz","gug.xyz","gui.xyz",
      "guide.xyz","guit.xyz","gul.xyz","gulp.xyz","gun.xyz",
      "gunk.xyz","gunz.xyz","guq.xyz","gur.xyz","gurl.xyz",
      "gurt.xyz","guru.xyz","gush.xyz","gust.xyz","gut.xyz",
      "gux.xyz","guy.xyz","guz.xyz","gv.xyz","gw.xyz","gx.xyz",
      "gy.xyz","gz.xyz","h.mail.xyz","h2o.xyz","ha.xyz",
      "hab.xyz","hack.xyz","hackers.xyz","hackrz.xyz","had.xyz",
      "hag.xyz","hah.xyz","hair.xyz","hak.xyz","hal.xyz",
      "ham.xyz","hammer.xyz","hand.xyz","hang.xyz","hans.xyz",
      "hant.xyz","hap.xyz","har.xyz","harb.xyz","hard.xyz",
      "hare.xyz","hark.xyz","harm.xyz","horn.xyz","hash.xyz",
      "hass.xyz","haste.xyz","hat.xyz","hato.xyz","have.xyz",
      "haw.xyz","hax.xyz","hay.xyz","haz.xyz","hazard.xyz",
      "hb.xyz","hd.xyz","he.xyz","head.xyz","heap.xyz","hear.xyz",
      "heart.xyz","heat.xyz","heaven.xyz","heck.xyz","heco.xyz",
      "hed.xyz","hedge.xyz","heed.xyz","helf.xyz","hell.xyz",
      "hellow.xyz","help.xyz","hen.xyz","henk.xyz","henry.xyz",
      "hep.xyz","her.xyz","here.xyz","hero.xyz","hew.xyz",
      "hex.xyz","hey.xyz","hial.xyz","hid.xyz","hide.xyz",
      "high.xyz","hij.xyz","hill.xyz","hilt.xyz","him.xyz",
      "hind.xyz","hip.xyz","hire.xyz","his.xyz","hiss.xyz",
      "hit.xyz","hive.xyz","hm.xyz","ho.xyz","hob.xyz","hoc.xyz",
      "hock.xyz","hod.xyz","hoff.xyz","hog.xyz","hold.xyz",
      "hole.xyz","hol.xyz","holy.xyz","home.xyz","homework.xyz",
      "homo.xyz","hon.xyz","hood.xyz","hook.xyz","hop.xyz",
      "hope.xyz","hoq.xyz","hor.xyz","hord.xyz","hore.xyz",
      "horn.xyz","hose.xyz","host.xyz","hot.xyz","hotm.xyz",
      "hour.xyz","house.xyz","how.xyz","http.xyz","hu.xyz",
      "hub.xyz","hud.xyz","hue.xyz","hug.xyz","huge.xyz",
      "huh.xyz","hui.xyz","huk.xyz","hum.xyz","hung.xyz",
      "hunk.xyz","hunt.xyz","hup.xyz","hurl.xyz","hurt.xyz",
      "hus.xyz","hut.xyz","huz.xyz","hw.xyz","hx.xyz","hy.xyz",
      "hyd.xyz","hymn.xyz","hyp.xyz","i.xyz","i2pmail.org",
      "i3.xyz","i4.xyz","ia.xyz","ib.xyz","ic.xyz","ice.xyz",
      "ich.xyz","ick.xyz","icq.xyz","id.xyz","ide.xyz","idea.xyz",
      "idk.xyz","idn.xyz","ie.xyz","if.xyz","ifx.xyz","ig.xyz",
      "ign.xyz","igo.xyz","ih.xyz","ii.xyz","ij.xyz","ik.xyz",
      "il.xyz","iln.xyz","im.xyz","imail.xyz","imb.xyz","imp.xyz",
      "in.xyz","inam.xyz","inc.xyz","index.xyz","ind.xyz",
      "indie.xyz","indy.xyz","inf.xyz","info.xyz","ing.xyz",
      "ink.xyz","inn.xyz","ins.xyz","int.xyz","inva.xyz",
      "inx.xyz","io.xyz","ion.xyz","ip.xyz","iq.xyz","ir.xyz",
      "irb.xyz","irp.xyz","is.xyz","isat.xyz","ish.xyz","isl.xyz",
      "ism.xyz","isp.xyz","ist.xyz","it.xyz","itd.xyz","ite.xyz",
      "itk.xyz","itn.xyz","ito.xyz","its.xyz","iu.xyz","iv.xyz",
      "ive.xyz","ivy.xyz","iw.xyz","ix.xyz","iy.xyz","iz.xyz",
      "j.xyz","j1.xyz","ja.xyz","jab.xyz","jack.xyz","jag.xyz",
      "jam.xyz","jan.xyz","jap.xyz","jaw.xyz","jay.xyz","jb.xyz",
      "jc.xyz","jd.xyz","je.xyz","jed.xyz","jef.xyz","jel.xyz",
      "jel.xyz","jem.xyz","jen.xyz","jer.xyz","jet.xyz","jew.xyz",
      "jg.xyz","jh.xyz","ji.xyz","jil.xyz","jim.xyz","jin.xyz",
      "jj.xyz","jk.xyz","jl.xyz","jm.xyz","jn.xyz","jo.xyz",
      "job.xyz","joe.xyz","jog.xyz","joh.xyz","john.xyz","joi.xyz",
      "jok.xyz","jol.xyz","jon.xyz","jop.xyz","jor.xyz","jos.xyz",
      "jot.xyz","jour.xyz","joy.xyz","jp.xyz","jq.xyz","jr.xyz",
      "js.xyz","jt.xyz","ju.xyz","jue.xyz","jug.xyz","jul.xyz",
      "jun.xyz","jung.xyz","junk.xyz","jup.xyz","jur.xyz","jus.xyz",
      "jut.xyz","jv.xyz","jw.xyz","jx.xyz","jy.xyz","jz.xyz",
      "k.xyz","k1.xyz","ka.xyz","kap.xyz","kart.xyz","kas.xyz",
      "kav.xyz","kay.xyz","kb.xyz","kc.xyz","kd.xyz","ke.xyz",
      "keb.xyz","kea.xyz","kec.xyz","keg.xyz","ken.xyz","kep.xyz",
      "ker.xyz","ket.xyz","kew.xyz","key.xyz","kg.xyz","kh.xyz",
      "ki.xyz","kid.xyz","kie.xyz","kik.xyz","kil.xyz","kim.xyz",
      "kin.xyz","kio.xyz","kip.xyz","kir.xyz","kit.xyz","kj.xyz",
      "kk.xyz","kl.xyz","km.xyz","kn.xyz","ko.xyz","kob.xyz",
      "koi.xyz","kol.xyz","kon.xyz","kook.xyz","kor.xyz","kos.xyz",
      "koy.xyz","kp.xyz","kq.xyz","kr.xyz","kra.xyz","kru.xyz",
      "ks.xyz","kt.xyz","ku.xyz","kue.xyz","kuh.xyz","kul.xyz",
      "kun.xyz","kup.xyz","kur.xyz","kus.xyz","kut.xyz","kv.xyz",
      "kw.xyz","kx.xyz","ky.xyz","kz.xyz","l.xyz","l0.xyz",
      "la.xyz","lab.xyz","lad.xyz","lag.xyz","lam.xyz","lan.xyz",
      "lap.xyz","lar.xyz","las.xyz","lat.xyz","lau.xyz","law.xyz",
      "lax.xyz","lay.xyz","lb.xyz","lc.xyz","ld.xyz","le.xyz",
      "lea.xyz","led.xyz","leg.xyz","lei.xyz","lek.xyz","len.xyz",
      "leo.xyz","lep.xyz","les.xyz","let.xyz","lev.xyz","lex.xyz",
      "lf.xyz","lg.xyz","lh.xyz","li.xyz","lib.xyz","lid.xyz",
      "lie.xyz","lien.xyz","lift.xyz","lig.xyz","lim.xyz","lin.xyz",
      "lip.xyz","liq.xyz","lir.xyz","lis.xyz","lit.xyz","liv.xyz",
      "liz.xyz","lj.xyz","lk.xyz","ll.xyz","lm.xyz","ln.xyz",
      "lo.xyz","load.xyz","lob.xyz","loc.xyz","loft.xyz","log.xyz",
      "lol.xyz","lon.xyz","look.xyz","loop.xyz","lop.xyz","lord.xyz",
      "lore.xyz","los.xyz","lot.xyz","low.xyz","loy.xyz","lp.xyz",
      "lq.xyz","lr.xyz","ls.xyz","lt.xyz","lu.xyz","lub.xyz",
      "luc.xyz","luck.xyz","lug.xyz","luk.xyz","lum.xyz","lun.xyz",
      "lung.xyz","lur.xyz","lurk.xyz","lus.xyz","lut.xyz","lux.xyz",
      "lv.xyz","lw.xyz","lx.xyz","ly.xyz","lyl.xyz","lyn.xyz",
      "lyr.xyz","lys.xyz","m.xyz","m1.xyz","ma.xyz","mac.xyz",
      "mad.xyz","mag.xyz","mai.xyz","mail.xyz","mail0.xyz",
      "mail114.net","mail1a.de","mail21.cc","mail2.xyz","mail2rss.org",
      "mail333.com","mail3.xyz","mail4.xyz","mail4trash.xyz",
      "mail666.ru","mail707.com","mail72.xyz","mail7.xyz",
      "mail888.xyz","mail99.xyz","mail.abc.xyz","mail.ad.xyz",
      "mail.az.xyz","mail.bg.xyz","mail.bk.xyz","mail.cf",
      "mail.ch.xyz","mail.cn.xyz","mail.co.xyz","mail.com.xyz",
      "mail.cx.xyz","mail.de.xyz","mail.dj.xyz","mail.dk.xyz",
      "mail.ee.xyz","mail.es.xyz","mail.fi.xyz","mail.fr.xyz",
      "mail.ga","mail.gq","mail.gr.xyz","mail.gy.xyz","mail.hk.xyz",
      "mail.hn.xyz","mail.hr.xyz","mail.hu.xyz","mail.ie.xyz",
      "mail.il.xyz","mail.in.xyz","mail.is.xyz","mail.it.xyz",
      "mail.jp.xyz","mail.kg.xyz","mail.kz.xyz","mail.lt.xyz",
      "mail.lv.xyz","mail.md.xyz","mail.me.xyz","mail.ml",
      "mail.mn.xyz","mail.mx.xyz","mail.my.xyz","mail.net.xyz",
      "mail.nl.xyz","mail.no.xyz","mail.nu.xyz","mail.nz.xyz",
      "mail.org.xyz","mail.ph.xyz","mail.pk.xyz","mail.pl.xyz",
      "mail.pr.xyz","mail.pt.xyz","mail.ro.xyz","mail.rs.xyz",
      "mail.ru.xyz","mail.se.xyz","mail.si.xyz","mail.sk.xyz",
      "mail.st.xyz","mail.tk","mail.tr.xyz","mail.tw.xyz",
      "mail.ua.xyz","mail.uk.xyz","mail.us.xyz","mail.uy.xyz",
      "mail.vn.xyz","mail.xyz","mail.za.xyz","mail0.xyz",
      "mail1.xyz","mail1st.com","mail1web.org","mail2.xyz",
      "mail2world.com","mail2000.xyz","mail22.xyz","mail2rss.xyz",
      "mail333.xyz","mail4.xyz","mail4you.xyz","mail666.xyz",
      "mail707.xyz","mail72.xyz","mail7.xyz","mail888.xyz",
      "mail99.xyz","mailandftp.com","mailbit.xyz","mailblocks.xyz",
      "mailbox.xyz","mailcat.xyz","mailcatch.xyz","mailcc.xyz",
      "mailclip.xyz","maildrop.xyz","maileater.xyz","mailem.xyz",
      "mailexpire.xyz","mailf5.xyz","mailfa.xyz","mailfail.xyz",
      "mailfall.xyz","mailfile.xyz","mailfirst.xyz","mailfly.xyz",
      "mailforce.xyz","mailform.xyz","mailfree.xyz","mailfs.xyz",
      "mailg.xyz","mailgate.xyz","mailgc.xyz","mailgen.xyz",
      "mailgo.xyz","mailgov.xyz","mailguard.xyz","mailgun.xyz",
      "mailhere.xyz","mailhost.xyz","mailhub.xyz","mailing.xyz",
      "mailinator.xyz","mailinxs.xyz","mailism.xyz","mailj.xyz",
      "mailjet.xyz","mailk.xyz","mailkv.xyz","mailld.xyz",
      "mailmate.xyz","mailme.xyz","mailme.xyz","mailme24.xyz",
      "mailmet.xyz","mailmex.xyz","mailmo.xyz","mailms.xyz",
      "mailn.xyz","mailna.xyz","mailnator.xyz","mailne.xyz",
      "mailnest.xyz","mailnet.xyz","mailnew.xyz","mailnz.xyz",
      "mailo.xyz","mailon.xyz","mailops.xyz","mailorg.xyz",
      "mailox.xyz","mailpage.xyz","mailpanda.xyz","mailpick.xyz",
      "mailpin.xyz","mailpl.xyz","mailplug.xyz","mailplus.xyz",
      "mailpoint.xyz","mailpost.xyz","mailpro.xyz","mailproxsy.xyz",
      "mailqu.xyz","mailr.xyz","mailrock.xyz","mailroom.xyz",
      "mailror.xyz","mailru.xyz","mails-abc.xyz","mailsac.xyz",
      "mailsc.xyz","mailse.xyz","mailsfree.xyz","mailsh.xyz",
      "mailshiv.xyz","mailsi.xyz","mailsip.xyz","mailsite.xyz",
      "mailso.xyz","mailsp.xyz","mailst.xyz","mailstart.xyz",
      "mailstek.xyz","mailston.xyz","mailstream.xyz","mailstrip.xyz",
      "mailsv.xyz","mailt.xyz","mailtag.xyz","mailtemp.xyz",
      "mailtester.xyz","mailtime.xyz","mailto.xyz","mailtobin.xyz",
      "mailtome.xyz","mailtop.xyz","mailtp.xyz","mailtra.xyz",
      "mailtrix.xyz","mailtv.xyz","mailu.xyz","mailuk.xyz",
      "mailus.xyz","mailux.xyz","mailv.xyz","mailvc.xyz",
      "mailvn.xyz","mailw.xyz","mailwa.xyz","mailwip.xyz",
      "mailwith.xyz","mailwork.xyz","mailx.xyz","mailxo.xyz",
      "mailxu.xyz","mainerfolg.info","makto.xyz","mama.xyz",
      "mamail.xyz","mang.xyz","mango.xyz","mangom.xyz","mania.xyz",
      "manly.xyz","mann.xyz","mano.xyz","manx.xyz","many.xyz",
      "map.xyz","mar.xyz","march.xyz","mare.xyz","mark.xyz",
      "market.xyz","marky.xyz","marsh.xyz","mart.xyz","maru.xyz",
      "masc.xyz","mash.xyz","mask.xyz","mass.xyz","mast.xyz",
      "mat.xyz","math.xyz","matt.xyz","mau.xyz","maw.xyz",
      "max.xyz","may.xyz","maya.xyz","mb.xyz","mc.xyz","md.xyz",
      "me.xyz","meat.xyz","med.xyz","meet.xyz","meg.xyz","mel.xyz",
      "mem.xyz","men.xyz","mer.xyz","mes.xyz","meta.xyz",
      "meteor.xyz","metro.xyz","meu.xyz","mg.xyz","mh.xyz",
      "mi.xyz","mia.xyz","mic.xyz","mice.xyz","mich.xyz",
      "mid.xyz","might.xyz","mil.xyz","mill.xyz","milo.xyz",
      "mim.xyz","mind.xyz","mine.xyz","ming.xyz","mini.xyz",
      "mink.xyz","mino.xyz","mint.xyz","mir.xyz","mire.xyz",
      "miss.xyz","mist.xyz","mix.xyz","mj.xyz","mk.xyz",
      "ml.xyz","mm.xyz","mn.xyz","mo.xyz","moan.xyz",
      "mob.xyz","mobi.xyz","mobr.xyz","mock.xyz","mod.xyz",
      "mode.xyz","moj.xyz","mok.xyz","mol.xyz","mom.xyz",
      "mon.xyz","mond.xyz","monk.xyz","mono.xyz","mont.xyz",
      "moo.xyz","mood.xyz","moon.xyz","moor.xyz","mop.xyz",
      "mord.xyz","more.xyz","mork.xyz","mort.xyz","mos.xyz",
      "moss.xyz","most.xyz","mot.xyz","moth.xyz","motor.xyz",
      "mou.xyz","moun.xyz","mouse.xyz","mous.xyz","mout.xyz",
      "mow.xyz","mp.xyz","mq.xyz","mr.xyz","ms.xyz","msc.xyz",
      "msg.xyz","mss.xyz","mt.xyz","mu.xyz","mud.xyz","mug.xyz",
      "mul.xyz","mum.xyz","mun.xyz","mur.xyz","mus.xyz",
      "muse.xyz","mush.xyz","musk.xyz","must.xyz","mut.xyz",
      "mux.xyz","mv.xyz","mw.xyz","mx.xyz","my.xyz","mybox.xyz",
      "myde.xyz","myemail.xyz","mygo.xyz","myie.xyz","mymail.xyz",
      "myne.xyz","myop.xyz","myp.xyz","myr.xyz","mys.xyz",
      "myself.xyz","myt.xyz","mytrashmail.xyz","myw.xyz","myx.xyz",
      "myz.xyz","mz.xyz","n.xyz","n1.xyz","n2.xyz","n3.xyz",
      "n4.xyz","n5.xyz","n6.xyz","n7.xyz","n8.xyz","n9.xyz",
      "na.xyz","nab.xyz","nac.xyz","nag.xyz","nah.xyz","nail.xyz",
      "nak.xyz","nam.xyz","name.xyz","nan.xyz","nap.xyz",
      "narc.xyz","narrow.xyz","nat.xyz","nav.xyz","naw.xyz",
      "nb.xyz","nc.xyz","nd.xyz","ne.xyz","neat.xyz","neb.xyz",
      "neck.xyz","ned.xyz","nee.xyz","neg.xyz","nek.xyz",
      "nem.xyz","neo.xyz","ner.xyz","nerv.xyz","nest.xyz",
      "net.xyz","net2.xyz","netmail.xyz","nets.xyz","neue.xyz",
      "neuf.xyz","nevr.xyz","new.xyz","news.xyz","next.xyz",
      "next2.xyz","nextmail.xyz","nfold.xyz","ng.xyz","nh.xyz",
      "ni.xyz","nice.xyz","nick.xyz","nig.xyz","nil.xyz",
      "nip.xyz","nit.xyz","nj.xyz","nk.xyz","nl.xyz","nm.xyz",
      "nn.xyz","no.xyz","noack.xyz","nob.xyz","nobel.xyz",
      "nock.xyz","nod.xyz","node.xyz","nod.xyz","noise.xyz",
      "nok.xyz","none.xyz","nook.xyz","noon.xyz","nop.xyz",
      "nor.xyz","norm.xyz","nose.xyz","not.xyz","note.xyz",
      "notv.xyz","now.xyz","nowhere.xyz","np.xyz","nq.xyz",
      "nr.xyz","ns.xyz","nsh.xyz","nt.xyz","nu.xyz","nub.xyz",
      "nuc.xyz","nude.xyz","nuke.xyz","null.xyz","num.xyz",
      "nut.xyz","nv.xyz","nw.xyz","nx.xyz","ny.xyz","nyc.xyz",
      "nz.xyz","o.xyz","o2.xyz","oaf.xyz","oak.xyz","oar.xyz",
      "oat.xyz","ob.xyz","obe.xyz","obi.xyz","obj.xyz",
      "oboe.xyz","obs.xyz","oc.xyz","ocean.xyz","och.xyz",
      "ock.xyz","od.xyz","odd.xyz","ode.xyz","oe.xyz","of.xyz",
      "off.xyz","office.xyz","oft.xyz","og.xyz","oh.xyz",
      "ohi.xyz","ohm.xyz","oil.xyz","oj.xyz","ok.xyz","old.xyz",
      "ole.xyz","olm.xyz","om.xyz","omega.xyz","on.xyz",
      "once.xyz","one.xyz","onion.xyz","only.xyz","ont.xyz",
      "oo.xyz","oof.xyz","ooze.xyz","op.xyz","ope.xyz","open.xyz",
      "opt.xyz","or.xyz","orb.xyz","orc.xyz","ore.xyz","org.xyz",
      "orga.xyz","ork.xyz","orn.xyz","ort.xyz","os.xyz","ose.xyz",
      "ot.xyz","other.xyz","ou.xyz","ouch.xyz","ought.xyz",
      "oul.xyz","oum.xyz","our.xyz","out.xyz","oux.xyz","ov.xyz",
      "oven.xyz","over.xyz","ow.xyz","owe.xyz","owl.xyz","own.xyz",
      "ox.xyz","oxo.xyz","oy.xyz","oz.xyz","p.xyz","pa.xyz",
      "pac.xyz","pack.xyz","pad.xyz","page.xyz","paid.xyz",
      "pain.xyz","pair.xyz","pal.xyz","pale.xyz","palm.xyz",
      "pan.xyz","papa.xyz","par.xyz","park.xyz","part.xyz",
      "pas.xyz","pass.xyz","past.xyz","pat.xyz","path.xyz",
      "paul.xyz","pave.xyz","paw.xyz","pay.xyz","pc.xyz",
      "pd.xyz","pe.xyz","pea.xyz","peak.xyz","pear.xyz",
      "peat.xyz","peb.xyz","pec.xyz","ped.xyz","pee.xyz",
      "peg.xyz","peh.xyz","pek.xyz","pen.xyz","penn.xyz",
      "pep.xyz","per.xyz","peri.xyz","perk.xyz","perm.xyz",
      "perp.xyz","pers.xyz","pet.xyz","pete.xyz","pew.xyz",
      "pf.xyz","pg.xyz","ph.xyz","phi.xyz","pho.xyz","phone.xyz",
      "pi.xyz","piano.xyz","pick.xyz","pie.xyz","pier.xyz",
      "pig.xyz","pike.xyz","pile.xyz","pin.xyz","pink.xyz",
      "pint.xyz","pio.xyz","pip.xyz","pipe.xyz","pir.xyz",
      "piss.xyz","pit.xyz","pitch.xyz","pith.xyz","pity.xyz",
      "pix.xyz","pixi.xyz","piz.xyz","pj.xyz","pk.xyz",
      "pl.xyz","place.xyz","plan.xyz","plat.xyz","play.xyz",
      "ple.xyz","plod.xyz","plop.xyz","plot.xyz","plow.xyz",
      "ploy.xyz","plum.xyz","plun.xyz","plus.xyz","pm.xyz",
      "pn.xyz","po.xyz","poa.xyz","pob.xyz","poc.xyz","pod.xyz",
      "poe.xyz","poem.xyz","poet.xyz","pog.xyz","poi.xyz",
      "point.xyz","pol.xyz","pole.xyz","poll.xyz","polo.xyz",
      "poly.xyz","pom.xyz","pomp.xyz","pon.xyz","pond.xyz",
      "pong.xyz","pony.xyz","poo.xyz","pood.xyz","pool.xyz",
      "poor.xyz","pop.xyz","pope.xyz","pops.xyz","pore.xyz",
      "pork.xyz","port.xyz","pose.xyz","posh.xyz","post.xyz",
      "pot.xyz","pote.xyz","pots.xyz","pou.xyz","poul.xyz",
      "pound.xyz","pour.xyz","pout.xyz","pow.xyz","pow.xyz",
      "pr.xyz","pray.xyz","pre.xyz","pres.xyz","prey.xyz",
      "pri.xyz","prick.xyz","pride.xyz","prim.xyz","pro.xyz",
      "prob.xyz","prod.xyz","prop.xyz","pros.xyz","prov.xyz",
      "prow.xyz","pry.xyz","ps.xyz","psi.xyz","pt.xyz","pty.xyz",
      "pub.xyz","puff.xyz","pug.xyz","puke.xyz","pull.xyz",
      "pulp.xyz","pump.xyz","pun.xyz","punk.xyz","pup.xyz",
      "pup.xyz","pure.xyz","purr.xyz","pus.xyz","push.xyz",
      "put.xyz","putt.xyz","putz.xyz","pv.xyz","pw.xyz",
      "pwn.xyz","px.xyz","py.xyz","pyr.xyz","q.xyz","qa.xyz",
      "qb.xyz","qc.xyz","qd.xyz","qe.xyz","qf.xyz","qg.xyz",
      "qh.xyz","qi.xyz","qj.xyz","qk.xyz","ql.xyz","qm.xyz",
      "qn.xyz","qo.xyz","qp.xyz","qq.xyz","qr.xyz","qs.xyz",
      "qt.xyz","qu.xyz","quad.xyz","quak.xyz","qual.xyz",
      "quan.xyz","quar.xyz","que.xyz","quen.xyz","quer.xyz",
      "ques.xyz","quet.xyz","quid.xyz","quin.xyz","quip.xyz",
      "quit.xyz","quiz.xyz","quo.xyz","quor.xyz","quot.xyz",
      "qv.xyz","qw.xyz","qx.xyz","qy.xyz","qz.xyz","r.xyz",
      "r1.xyz","r2.xyz","ra.xyz","rabb.xyz","rabi.xyz","race.xyz",
      "rack.xyz","rad.xyz","raf.xyz","rag.xyz","rai.xyz","rain.xyz",
      "raj.xyz","rak.xyz","ram.xyz","ran.xyz","rang.xyz","rap.xyz",
      "rar.xyz","rat.xyz","rate.xyz","rav.xyz","raw.xyz",
      "ray.xyz","raz.xyz","rb.xyz","rc.xyz","rd.xyz","re.xyz",
      "read.xyz","real.xyz","reb.xyz","rec.xyz","red.xyz",
      "ree.xyz","ref.xyz","reg.xyz","rei.xyz","rej.xyz",
      "rel.xyz","rem.xyz","ren.xyz","rep.xyz","res.xyz",
      "ret.xyz","rev.xyz","rex.xyz","rf.xyz","rg.xyz","rh.xyz",
      "ri.xyz","rib.xyz","ric.xyz","rid.xyz","rie.xyz","rig.xyz",
      "rim.xyz","ring.xyz","rip.xyz","ris.xyz","rit.xyz",
      "riv.xyz","rj.xyz","rk.xyz","rl.xyz","rm.xyz","rn.xyz",
      "ro.xyz","rob.xyz","rock.xyz","rod.xyz","roe.xyz",
      "rog.xyz","roi.xyz","rok.xyz","rol.xyz","rom.xyz",
      "ron.xyz","roo.xyz","roof.xyz","rook.xyz","room.xyz",
      "root.xyz","rop.xyz","ros.xyz","rot.xyz","rou.xyz",
      "round.xyz","row.xyz","rp.xyz","rq.xyz","rr.xyz","rs.xyz",
      "rt.xyz","ru.xyz","rub.xyz","ruby.xyz","rug.xyz","ruin.xyz",
      "rule.xyz","rum.xyz","run.xyz","rupt.xyz","rush.xyz",
      "rut.xyz","rv.xyz","rw.xyz","rx.xyz","ry.xyz","rye.xyz",
      "s.xyz","s1.xyz","s2.xyz","sa.xyz","sac.xyz","sad.xyz",
      "safe.xyz","sag.xyz","sai.xyz","sail.xyz","sak.xyz",
      "sale.xyz","salt.xyz","sam.xyz","san.xyz","sand.xyz",
      "sane.xyz","sang.xyz","sap.xyz","sass.xyz","sat.xyz",
      "sauce.xyz","sav.xyz","save.xyz","saw.xyz","say.xyz",
      "sb.xyz","sc.xyz","scam.xyz","scan.xyz","scar.xyz",
      "scene.xyz","sci.xyz","scop.xyz","score.xyz","scot.xyz",
      "scr.xyz","sd.xyz","se.xyz","sea.xyz","seal.xyz","seam.xyz",
      "seat.xyz","sec.xyz","sed.xyz","see.xyz","seed.xyz",
      "seek.xyz","seem.xyz","seen.xyz","seg.xyz","sei.xyz",
      "sej.xyz","sel.xyz","sen.xyz","send.xyz","sent.xyz",
      "ser.xyz","set.xyz","sew.xyz","sex.xyz","sez.xyz",
      "sf.xyz","sg.xyz","sh.xyz","shag.xyz","shake.xyz",
      "sham.xyz","shan.xyz","shap.xyz","shaw.xyz","she.xyz",
      "shed.xyz","sheep.xyz","sheer.xyz","sheet.xyz","shek.xyz",
      "shel.xyz","shen.xyz","shew.xyz","shh.xyz","shin.xyz",
      "ship.xyz","shit.xyz","shiv.xyz","shoe.xyz","shok.xyz",
      "shop.xyz","shot.xyz","show.xyz","shun.xyz","shut.xyz",
      "si.xyz","sick.xyz","side.xyz","sift.xyz","sigh.xyz",
      "sign.xyz","silk.xyz","sill.xyz","silt.xyz","sim.xyz",
      "sin.xyz","sing.xyz","sink.xyz","sip.xyz","sir.xyz",
      "sis.xyz","sit.xyz","site.xyz","sith.xyz","siz.xyz",
      "size.xyz","sj.xyz","sk.xyz","skate.xyz","ski.xyz",
      "skid.xyz","skim.xyz","skin.xyz","skip.xyz","skit.xyz",
      "sky.xyz","skye.xyz","sl.xyz","slab.xyz","slap.xyz",
      "slat.xyz","slave.xyz","sled.xyz","sleep.xyz","slew.xyz",
      "slid.xyz","slim.xyz","slip.xyz","slit.xyz","slot.xyz",
      "slow.xyz","slug.xyz","slum.xyz","slur.xyz","sm.xyz",
      "smack.xyz","small.xyz","smash.xyz","smell.xyz","smile.xyz",
      "smog.xyz","smoke.xyz","sn.xyz","snag.xyz","snap.xyz",
      "snare.xyz","sniff.xyz","snip.xyz","snob.xyz","snog.xyz",
      "snow.xyz","snub.xyz","snug.xyz","so.xyz","soak.xyz",
      "soap.xyz","sob.xyz","sock.xyz","sod.xyz","soda.xyz",
      "sofa.xyz","soft.xyz","soil.xyz","sol.xyz","sold.xyz",
      "sole.xyz","son.xyz","song.xyz","soon.xyz","soot.xyz",
      "sop.xyz","sore.xyz","sort.xyz","soul.xyz","sour.xyz",
      "sow.xyz","soy.xyz","sp.xyz","space.xyz","spa.xyz",
      "spade.xyz","span.xyz","spar.xyz","spark.xyz","spat.xyz",
      "spe.xyz","speak.xyz","spec.xyz","speed.xyz","spell.xyz",
      "spend.xyz","spew.xyz","spic.xyz","spill.xyz","spin.xyz",
      "spit.xyz","spite.xyz","split.xyz","spoke.xyz","spook.xyz",
      "spoon.xyz","sport.xyz","spot.xyz","spout.xyz","spray.xyz",
      "spur.xyz","squ.xyz","squad.xyz","squat.xyz","squid.xyz",
      "sr.xyz","ss.xyz","st.xyz","stab.xyz","stack.xyz",
      "staff.xyz","stag.xyz","stain.xyz","stair.xyz","stake.xyz",
      "stale.xyz","stalk.xyz","stall.xyz","stamp.xyz","stan.xyz",
      "stand.xyz","star.xyz","stare.xyz","start.xyz","state.xyz",
      "stax.xyz","stay.xyz","ste.xyz","steak.xyz","steal.xyz",
      "steam.xyz","steel.xyz","steep.xyz","steer.xyz","stem.xyz",
      "step.xyz","stern.xyz","stew.xyz","stick.xyz","still.xyz",
      "sting.xyz","stir.xyz","stitch.xyz","stock.xyz","stod.xyz",
      "stomp.xyz","stone.xyz","stood.xyz","stool.xyz","stop.xyz",
      "store.xyz","store.xyz","stork.xyz","storm.xyz","story.xyz",
      "stout.xyz","stove.xyz","strap.xyz","straw.xyz","stray.xyz",
      "strep.xyz","stub.xyz","stud.xyz","stuff.xyz","stump.xyz",
      "stun.xyz","stung.xyz","stunt.xyz","su.xyz","sub.xyz",
      "suck.xyz","sue.xyz","sugar.xyz","suit.xyz","sum.xyz",
      "sumo.xyz","sun.xyz","sunk.xyz","sun.xyz","sup.xyz",
      "sur.xyz","surf.xyz","surge.xyz","susa.xyz","sux.xyz",
      "sv.xyz","sw.xyz","swag.xyz","swan.xyz","swap.xyz",
      "swim.xyz","swing.xyz","swiss.xyz","swoop.xyz","sword.xyz",
      "sx.xyz","sy.xyz","syll.xyz","sym.xyz","sync.xyz",
      "synd.xyz","syq.xyz","syx.xyz","sz.xyz","t.xyz","t1.xyz",
      "t2.xyz","t3.xyz","t4.xyz","t5.xyz","t6.xyz","t7.xyz",
      "t8.xyz","t9.xyz","ta.xyz","tab.xyz","tac.xyz","tack.xyz",
      "tag.xyz","tail.xyz","take.xyz","tale.xyz","talk.xyz",
      "tall.xyz","tam.xyz","tan.xyz","tank.xyz","tap.xyz",
      "tape.xyz","tar.xyz","tarp.xyz","tart.xyz","task.xyz",
      "taste.xyz","tatoo.xyz","tax.xyz","taxi.xyz","tb.xyz",
      "tc.xyz","td.xyz","te.xyz","tea.xyz","teach.xyz","team.xyz",
      "tear.xyz","tease.xyz","teat.xyz","ted.xyz","tee.xyz",
      "teem.xyz","teen.xyz","tell.xyz","temp.xyz","temp1.xyz",
      "temp2.xyz","temp3.xyz","temp4.xyz","temp5.xyz","temp6.xyz",
      "temp7.xyz","temp8.xyz","temp9.xyz","tempemail.xyz",
      "tempm.xyz","tempmail.xyz","tempomail.xyz","ten.xyz",
      "tend.xyz","tent.xyz","term.xyz","test.xyz","tete.xyz",
      "text.xyz","tf.xyz","tg.xyz","th.xyz","than.xyz","thank.xyz",
      "that.xyz","the.xyz","their.xyz","them.xyz","then.xyz",
      "there.xyz","these.xyz","they.xyz","thick.xyz","thief.xyz",
      "thigh.xyz","thin.xyz","thing.xyz","think.xyz","third.xyz",
      "this.xyz","thom.xyz","thong.xyz","thor.xyz","thorn.xyz",
      "those.xyz","three.xyz","threw.xyz","throb.xyz","throw.xyz",
      "thumb.xyz","thus.xyz","ti.xyz","tick.xyz","tide.xyz",
      "tie.xyz","tier.xyz","till.xyz","tilt.xyz","time.xyz",
      "tin.xyz","ting.xyz","tint.xyz","tiny.xyz","tip.xyz",
      "tire.xyz","tiss.xyz","tit.xyz","to.xyz","toad.xyz",
      "toe.xyz","tofu.xyz","tog.xyz","toil.xyz","told.xyz",
      "tom.xyz","tomb.xyz","tone.xyz","tong.xyz","ton.xyz",
      "took.xyz","tool.xyz","toot.xyz","top.xyz","tore.xyz",
      "torn.xyz","toss.xyz","tot.xyz","total.xyz","tote.xyz",
      "touch.xyz","tough.xyz","tour.xyz","tow.xyz","town.xyz",
      "toxic.xyz","toy.xyz","tp.xyz","tr.xyz","trace.xyz",
      "track.xyz","tract.xyz","trade.xyz","trail.xyz","train.xyz",
      "trait.xyz","trap.xyz","tray.xyz","tree.xyz","trek.xyz",
      "tremp.xyz","tri.xyz","tribe.xyz","trick.xyz","trim.xyz",
      "trio.xyz","trip.xyz","trite.xyz","trod.xyz","troll.xyz",
      "troop.xyz","trot.xyz","trout.xyz","troy.xyz","truck.xyz",
      "true.xyz","truly.xyz","trump.xyz","trunk.xyz","trust.xyz",
      "truth.xyz","try.xyz","ts.xyz","tt.xyz","tu.xyz","tub.xyz",
      "tube.xyz","tuck.xyz","tuff.xyz","tug.xyz","tul.xyz",
      "tumble.xyz","tuna.xyz","tune.xyz","tung.xyz","turn.xyz",
      "tush.xyz","tut.xyz","tv.xyz","tw.xyz","twas.xyz",
      "twig.xyz","twin.xyz","twine.xyz","twirl.xyz","twist.xyz",
      "two.xyz","tx.xyz","ty.xyz","type.xyz","tz.xyz","u.xyz",
      "u2.xyz","ub.xyz","uc.xyz","ud.xyz","ue.xyz","uf.xyz",
      "ug.xyz","uh.xyz","ui.xyz","uj.xyz","uk.xyz","ul.xyz",
      "um.xyz","un.xyz","uni.xyz","unit.xyz","unto.xyz","up.xyz",
      "updo.xyz","upon.xyz","ups.xyz","ur.xyz","urban.xyz",
      "urb.xyz","uri.xyz","urn.xyz","us.xyz","usa.xyz","use.xyz",
      "used.xyz","user.xyz","usl.xyz","ust.xyz","ut.xyz","uu.xyz",
      "uv.xyz","uw.xyz","ux.xyz","uy.xyz","uz.xyz","v.xyz",
      "va.xyz","vac.xyz","vail.xyz","val.xyz","vale.xyz",
      "van.xyz","vane.xyz","van.xyz","vary.xyz","vas.xyz",
      "vat.xyz","vault.xyz","vb.xyz","vc.xyz","vd.xyz","ve.xyz",
      "veal.xyz","ved.xyz","veil.xyz","vein.xyz","ven.xyz",
      "vent.xyz","verb.xyz","very.xyz","vest.xyz","vet.xyz",
      "vex.xyz","vf.xyz","vg.xyz","vh.xyz","vi.xyz","via.xyz",
      "vial.xyz","vib.xyz","vic.xyz","vice.xyz","vida.xyz",
      "video.xyz","vie.xyz","view.xyz","vig.xyz","vii.xyz",
      "vile.xyz","villa.xyz","vine.xyz","vinyl.xyz","viol.xyz",
      "vip.xyz","vir.xyz","vise.xyz","visit.xyz","visor.xyz",
      "vista.xyz","visual.xyz","vit.xyz","vita.xyz","viva.xyz",
      "vivid.xyz","vocal.xyz","vod.xyz","voice.xyz","void.xyz",
      "volt.xyz","vol.xyz","vote.xyz","vow.xyz","vp.xyz","vq.xyz",
      "vr.xyz","vs.xyz","vt.xyz","vu.xyz","vul.xyz","vv.xyz",
      "vw.xyz","vx.xyz","vy.xyz","vz.xyz","w.xyz","wa.xyz",
      "wad.xyz","wade.xyz","wag.xyz","wage.xyz","wah.xyz",
      "wait.xyz","wake.xyz","walk.xyz","wall.xyz","wan.xyz",
      "wand.xyz","wane.xyz","wang.xyz","want.xyz","war.xyz",
      "ward.xyz","ware.xyz","warm.xyz","warn.xyz","warp.xyz",
      "wart.xyz","wary.xyz","was.xyz","wash.xyz","wasp.xyz",
      "waste.xyz","watch.xyz","water.xyz","watt.xyz","wave.xyz",
      "wax.xyz","way.xyz","wb.xyz","wc.xyz","wd.xyz","we.xyz",
      "weak.xyz","wear.xyz","web.xyz","web2.xyz","webe.xyz",
      "webmail.xyz","webm.xyz","webz.xyz","wed.xyz","wee.xyz",
      "weed.xyz","week.xyz","weep.xyz","weigh.xyz","weird.xyz",
      "wel.xyz","well.xyz","welt.xyz","wen.xyz","went.xyz",
      "were.xyz","west.xyz","wet.xyz","wf.xyz","wg.xyz","wh.xyz",
      "wham.xyz","whap.xyz","what.xyz","whip.xyz","whir.xyz",
      "whit.xyz","who.xyz","whom.xyz","whop.xyz","why.xyz",
      "wi.xyz","wick.xyz","wide.xyz","wife.xyz","wig.xyz",
      "wild.xyz","will.xyz","wilt.xyz","win.xyz","wind.xyz",
      "wine.xyz","wing.xyz","wink.xyz","wino.xyz","wipe.xyz",
      "wire.xyz","wise.xyz","wish.xyz","wit.xyz","witch.xyz",
      "with.xyz","wiz.xyz","wk.xyz","wl.xyz","wm.xyz","wn.xyz",
      "wo.xyz","wob.xyz","wok.xyz","wold.xyz","wolf.xyz",
      "woman.xyz","won.xyz","wood.xyz","wool.xyz","word.xyz",
      "work.xyz","world.xyz","worm.xyz","worn.xyz","worry.xyz",
      "worse.xyz","worst.xyz","worth.xyz","would.xyz","wound.xyz",
      "wove.xyz","wp.xyz","wq.xyz","wr.xyz","wrap.xyz","wreck.xyz",
      "wrist.xyz","writ.xyz","wrong.xyz","wrote.xyz","ws.xyz",
      "wt.xyz","wu.xyz","wv.xyz","ww.xyz","wx.xyz","wy.xyz",
      "wz.xyz","x.xyz","x1.xyz","x2.xyz","xa.xyz","xb.xyz",
      "xc.xyz","xd.xyz","xe.xyz","xf.xyz","xg.xyz","xh.xyz",
      "xi.xyz","xj.xyz","xk.xyz","xl.xyz","xm.xyz","xn.xyz",
      "xo.xyz","xp.xyz","xq.xyz","xr.xyz","xs.xyz","xt.xyz",
      "xu.xyz","xv.xyz","xw.xyz","xx.xyz","xy.xyz","xz.xyz",
      "y.xyz","ya.xyz","yacht.xyz","yah.xyz","yak.xyz","yam.xyz",
      "yap.xyz","yaw.xyz","yb.xyz","yc.xyz","yd.xyz","ye.xyz",
      "yea.xyz","yell.xyz","yes.xyz","yet.xyz","yid.xyz","yip.xyz",
      "yj.xyz","yk.xyz","yl.xyz","ym.xyz","yn.xyz","yo.xyz",
      "yob.xyz","yoga.xyz","yok.xyz","yore.xyz","you.xyz",
      "young.xyz","your.xyz","youth.xyz","yp.xyz","yq.xyz",
      "yr.xyz","ys.xyz","yt.xyz","yu.xyz","yuck.xyz","yum.xyz",
      "yup.xyz","yv.xyz","yw.xyz","yx.xyz","yy.xyz","z.xyz",
      "za.xyz","zad.xyz","zag.xyz","zam.xyz","zap.xyz","zar.xyz",
      "zb.xyz","zc.xyz","zd.xyz","ze.xyz","zen.xyz","zero.xyz",
      "zf.xyz","zg.xyz","zh.xyz","zi.xyz","zig.xyz","zip.xyz",
      "zj.xyz","zk.xyz","zl.xyz","zm.xyz","zn.xyz","zo.xyz",
      "zod.xyz","zoe.xyz","zomb.xyz","zoo.xyz","zoom.xyz",
      "zor.xyz","zp.xyz","zq.xyz","zr.xyz","zs.xyz","zt.xyz",
      "zu.xyz","zur.xyz","zv.xyz","zw.xyz","zx.xyz","zy.xyz",
      "zz.xyz",
    ]);
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (emailDomain && disposableDomains.has(emailDomain)) {
      return NextResponse.json(
        { error: "Email temporanea non consentita. Usa un indirizzo email permanente." },
        { status: 400 }
      );
    }

    const template = getDemoShopTemplate(category);
    const slug = await uniqueSlug(businessName);
    const now = new Date();

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // Referral: chi ha invitato questo tenant?
    const refCode = cleanText(body.ref);
    let referredByCode = null;
    if (refCode) {
      const referrer = await prisma.tenant.findUnique({ where: { referralCode: refCode } });
      if (referrer) referredByCode = refCode;
    }

    const emailVerifyToken = crypto.randomUUID();
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const verifyUrl = `${protocol}://${ROOT_DOMAIN}/api/verify-email?token=${emailVerifyToken}&slug=${slug}`;

    const tenant = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
      data: {
        name: businessName,
        slug,
        category: template.id,
        city,
        ownerName,
        ownerEmail: email,
        ownerPasswordHash: hashPassword(password),
        emailVerifyToken,
        emailVerified: false,
        description: description || template.description,
        phone,
        address,
        instagramUrl,
        facebookUrl: null,
        tiktokUrl,
        websiteUrl,
        mapsLink,
        bookingUrl,
        logoUrl: logoUrl || null,
        themeColor,
        openTime: template.openTime,
        closeTime: template.closeTime,
        breakStart: template.breakStart || null,
        breakEnd: template.breakEnd || null,
        closedDays: JSON.stringify(template.closedDays),
        trialStartedAt: now,
        trialEndsAt,
        trialStatus: "trial_active",
        isDemoData: true,
          plan: "basic",
        referredByCode,
        referredAt: referredByCode ? now : null,
        services: {
          create: template.services.map((service) => ({
            name: service.name,
            duration: service.duration,
            price: service.price,
          })),
        },
        storeSettings: {
          create: {
            smsCredits: referredByCode ? 100 : 50, // 50 crediti in più se invitato
            maxConcurrentAppointments: Math.max(1, template.staff.length),
          },
        },
      },
        include: { services: true },
      });

    const serviceByName = new Map(tenant.services.map((service) => [service.name, service]));
    const staffByName = new Map<string, { id: string; name: string }>();

    const staffList = [{ name: ownerName, services: [] }];

    for (const member of staffList) {
      const allowedServices = member.services?.length
        ? member.services
            .map((serviceName) => serviceByName.get(serviceName))
            .filter(Boolean)
        : tenant.services;

      const staff = await tx.staff.create({
        data: {
          name: member.name,
          tenantId: tenant.id,
          services: {
            connect: allowedServices.map((service) => ({ id: service!.id })),
          },
        },
      });
      staffByName.set(member.name, staff);
    }

    // CREA SEDE PRINCIPALE DI DEFAULT
    const mainLocation = await tx.location.create({
      data: {
        name: "Sede Principale",
        slug: slug + "-sede-principale",
        phone,
        address,
        city,
        openTime: template.openTime,
        closeTime: template.closeTime,
        breakStart: template.breakStart || null,
        breakEnd: template.breakEnd || null,
        closedDays: JSON.stringify(template.closedDays),
        isMain: true,
        isActive: true,
        tenantId: tenant.id,
        settings: {
          create: {
            smsCredits: referredByCode ? 100 : 50,
          },
        },
      },
    });

    // COLLEGA SERVIZI ALLA SEDE PRINCIPALE
    for (const service of tenant.services) {
      await tx.serviceLocation.create({
        data: {
          serviceId: service.id,
          locationId: mainLocation.id,
          price: service.price,
          isActive: true,
        },
      });
    }

    // COLLEGA STAFF ALLA SEDE PRINCIPALE
    for (const [, staff] of staffByName) {
      await tx.staff.update({
        where: { id: staff.id },
        data: { locationId: mainLocation.id },
      });
    }

    // IL CICLO SOTTOSTANTE È STATO RIMOSSO PER MANTENERE L'AGENDA VUOTA SUI NUOVI NEGOZI
    /*
    for (const seed of template.bookings) {
      const service = serviceByName.get(seed.serviceName) || tenant.services[0];
      if (!service) continue;

      const staff = seed.staffName ? staffByName.get(seed.staffName) : undefined;
      const date = dateFromOffset(seed.dayOffset, template.closedDays);

      await prisma.appointment.create({
        data: {
          customerName: seed.customerName,
          customerPhone: seed.customerPhone,
          date,
          time: seed.time,
          endTime: addMinutes(seed.time, service.duration || 30),
          source: "DEMO",
          isPaid: Boolean(seed.isPaid),
          tenantId: tenant.id,
          serviceId: service.id,
          staffId: staff?.id,
        },
      });
    }
    */

    await tx.activityLog.create({
      data: {
        tenantId: tenant.id,
        action: "CREATE_DEMO_SHOP",
        actor: "system",
        message: `Negozio demo creato per ${businessName}: servizi, staff e prenotazioni sono già pronti.`,
        metadata: JSON.stringify({ category: template.id, trialDays }),
      },
    });

    // 🚀 Invia notifica Telegram al founder
      return tenant;
    }, { isolationLevel: "Serializable", timeout: 15_000 });

    await sendTelegramNotification(tenant, ownerName, template.id);

    // 🚀 Invia email verifica indirizzo
    await sendVerificationEmail(email, ownerName, verifyUrl).catch(e =>
      console.error("[Email] Errore invio verifica:", e)
    );

    // 🚀 Invia Email di Benvenuto
    await sendWelcomeEmail(email, ownerName, getTenantAdminUrl(tenant.slug)).catch(e =>
      console.error("[Email] Errore invio benvenuto:", e)
    );

    return NextResponse.json({
      success: true,
      slug: tenant.slug,
      publicUrl: getTenantPublicUrl(tenant.slug),
      adminUrl: getTenantAdminUrl(tenant.slug),
      needsVerification: true,
    });
  } catch (error) {
    console.error("Errore Onboarding:", error);
    const msg = error instanceof Error ? error.message : "Errore interno durante la creazione.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
