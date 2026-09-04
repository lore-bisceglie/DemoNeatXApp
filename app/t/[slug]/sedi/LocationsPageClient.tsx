"use client";

import Link from "next/link";
import { ChevronRight, Navigation, MapPin as MapPinIcon, Users, Users as UsersIcon, Clock, Calendar as CalendarIcon, Phone as PhoneIcon } from "lucide-react";
import { getTenantTheme } from "@/lib/tenant-theme";

interface LocationData {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  mapsLink: string | null;
  isMain: boolean;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closedDays: string | null;
  _count: { staff: number; services: number; appointments: number };
}

interface Props {
  tenant: {
    name: string;
    slug: string;
    themeColor: string;
    logoUrl: string | null;
    description: string | null;
    locations: LocationData[];
  };
  slug: string;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function isMainLabel() {
  return "Principale";
}

export default function LocationsPageClient({ tenant, slug }: Props) {
  const locs = tenant.locations;
  const firstLoc = locs[0];
  const theme = getTenantTheme(tenant.themeColor);

  function handleCardClick(locationSlug: string) {
    window.location.href = "/t/" + slug + "/sede/" + locationSlug;
  }

  function handleBookClick(e: React.MouseEvent, locationSlug: string) {
    e.stopPropagation();
    window.location.href = "/t/" + slug + "/sede/" + locationSlug;
  }

  function getClosedDaysText(closedDays: string | null): string {
    if (!closedDays) return "";
    try {
      const days: number[] = JSON.parse(closedDays);
      return days.map((d: number) => WEEKDAYS[d]).join(", ");
    } catch {
      return "";
    }
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100">
      <section className="relative min-h-[80vh] flex items-center justify-center px-6 overflow-hidden">
        <div className={"absolute inset-0 bg-gradient-to-br " + theme.softBackground + " via-transparent to-transparent"} />
        <div className={"absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] " + theme.softBackground + " rounded-full blur-3xl animate-pulse"} />
        <div className="relative z-10 max-w-4xl mx-auto text-center py-20">
          {tenant.logoUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-24 h-24 mx-auto rounded-2xl shadow-2xl mb-6"
              />
            </>
          )}
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Le nostre {" "}
            <span className={"bg-gradient-to-r " + theme.gradient + " bg-clip-text text-transparent"}>
              sedi
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Scegli la sede piu comoda per te. Ogni sede ha i suoi orari, il suo staff e i suoi servizi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={"/t/" + slug}
              className={"inline-flex items-center gap-2 px-8 py-4 text-lg font-extrabold rounded-2xl bg-gradient-to-r " + theme.gradient + " " + theme.gradientHover + " text-white transition-all hover:scale-105"}
            >
              Torna alla home
            </Link>
            {firstLoc && firstLoc.address && (
              <a
                href={"https://maps.google.com/?q=" + encodeURIComponent(firstLoc.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold rounded-2xl bg-[#131c31] border border-[#1e2b4a] text-slate-300 hover:bg-[#1a2642] hover:text-white transition-all"
              >
                <Navigation size={20} /> Mappa
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Le nostre {" "}
              <span className={"bg-gradient-to-r " + theme.gradient + " bg-clip-text text-transparent"}>
                sedi
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Ogni sede e indipendente: orari, staff, servizi e prezzi dedicati.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {locs.map(function (location) {
              return (
                <div
                  key={location.id}
                  onClick={function () { handleCardClick(location.slug); }}
                  className={"group relative bg-[#0b1221] rounded-3xl border border-[#1a2642] overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer " + theme.borderMain}
                >
                  <div className="absolute top-4 right-4 z-10">
                    {location.isMain && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                        <span className="relative">{isMainLabel()}</span>
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={"w-12 h-12 rounded-2xl bg-gradient-to-br " + theme.gradient + " flex items-center justify-center"}>
                        <Navigation size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-white">{location.name}</h3>
                        <p className="text-slate-400 text-sm">{location.slug}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mt-6">
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <MapPinIcon size={16} className={theme.textMain} />
                        <span>{location.address || "Indirizzo non definito"}{location.city ? ", " + location.city : ""}</span>
                      </div>

                      {location.phone && (
                        <a
                          href={"tel:" + location.phone.replace(/\D/g, "")}
                          className="flex items-center gap-2 text-slate-300 text-sm hover:text-white transition-colors"
                          onClick={function (e) { e.stopPropagation(); }}
                        >
                          <PhoneIcon size={16} className={theme.textMain} />
                          <span>{location.phone}</span>
                        </a>
                      )}

                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Clock size={16} className={theme.textMain} />
                        <span>{location.openTime ? location.openTime + " - " + location.closeTime : "Orari non definiti"}</span>
                      </div>

                      {location.closedDays && (
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <Users size={16} className={theme.textMain} />
                          <span>Chiuso: {getClosedDaysText(location.closedDays)}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-[#1a2642]">
                      <div className="text-center p-3 bg-[#050814] rounded-xl">
                        <UsersIcon size={20} className={"mx-auto " + theme.textMain + " mb-1"} />
                        <p className="text-2xl font-bold text-white">{location._count.staff || 0}</p>
                        <p className="text-xs text-slate-400">Staff</p>
                      </div>
                      <div className="text-center p-3 bg-[#050814] rounded-xl">
                        <CalendarIcon size={20} className={"mx-auto " + theme.textMain + " mb-1"} />
                        <p className="text-2xl font-bold text-white">{location._count.services || 0}</p>
                        <p className="text-xs text-slate-400">Servizi</p>
                      </div>
                      <div className="text-center p-3 bg-[#050814] rounded-xl">
                        <CalendarIcon size={20} className={"mx-auto " + theme.textMain + " mb-1"} />
                        <p className="text-2xl font-bold text-white">{location._count.appointments || 0}</p>
                        <p className="text-xs text-slate-400">Prenotazioni</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0b1221] to-transparent" />
                  <div className={"absolute inset-0 bg-gradient-to-t " + theme.softBackground + " via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"} />
                  <div className="absolute bottom-4 left-6 right-6 opacity-0 group-hover:opacity-100 translate-y-2 transition-all duration-300">
                    <button
                      onClick={function (e) { handleBookClick(e, location.slug); }}
                      className={"w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r " + theme.gradient + " " + theme.gradientHover + " text-white font-bold rounded-xl transition-all"}
                    >
                      Prenota in questa sede
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {locs.length === 1 && (
            <div className="mt-12 text-center">
              <p className="text-slate-400 mb-4">Una sola sede? Nessun problema!</p>
              <Link
                href={"/t/" + slug + "/sede/" + locs[0].slug}
                className={"inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r " + theme.gradient + " " + theme.gradientHover + " text-white font-bold rounded-2xl transition-all"}
              >
                Vai alla prenotazione
                <ChevronRight size={20} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
