/**
 * Client-side grounding for the operator chatbot in demo mode. It answers
 * questions strictly from fan-supplied data (profiles, orders, fan-reported
 * incidents) — the same signals the real Gemini-backed `opsChat` function is
 * given — so answers are specific and verifiable, never invented.
 */
import type { FanProfile, Incident, Lang, Order } from "@/types/domain";
import type { OpsChatResponse } from "@/types/contracts";

interface FanData {
  fans: FanProfile[];
  orders: Order[];
  incidents: Incident[];
}

const pick = <T,>(lang: Lang, m: Record<Lang, T>): T => m[lang] ?? m.en;

function tally<T>(items: T[], key: (t: T) => string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function answerFromFanData(
  question: string,
  lang: Lang,
  data: FanData
): OpsChatResponse {
  const q = question.toLowerCase();
  const { fans, orders, incidents } = data;
  const totalFans = fans.length;

  // Accessibility
  if (/access|wheelchair|step|disab|mobility|sensory|hearing|vision/.test(q)) {
    const withNeeds = fans.filter((f) => f.accessibilityNeeds.length > 0);
    const breakdown = tally(
      withNeeds.flatMap((f) => f.accessibilityNeeds),
      (n) => n
    );
    const list = breakdown.map(([n, c]) => `${n} (${c})`).join(", ") || "none";
    return {
      answer: pick(lang, {
        en: `${withNeeds.length} of ${totalFans} fans reported accessibility needs. Breakdown: ${list}. Ensure step-free routes and staff are positioned near their sections.`,
        es: `${withNeeds.length} de ${totalFans} aficionados reportaron necesidades de accesibilidad. Desglose: ${list}. Asegura rutas sin escaleras y personal cerca de sus secciones.`,
        fr: `${withNeeds.length} des ${totalFans} supporters ont signalé des besoins d'accessibilité. Détail : ${list}. Assurez des trajets sans marches et du personnel près de leurs sections.`,
      }),
      sources: ["fan profiles", "accessibility needs"],
    };
  }

  // Transport
  if (/transport|transit|arriv|travel|metro|bus|driv|rideshare|traffic/.test(q)) {
    const modes = tally(fans, (f) => f.transportMode);
    const list = modes.map(([m, c]) => `${m} (${c})`).join(", ") || "no data";
    const top = modes[0];
    return {
      answer: pick(lang, {
        en: `Fan travel modes: ${list}. Most arrive by ${top?.[0] ?? "transit"}${top ? ` (${top[1]})` : ""} — coordinate with transit ops on those lines near kick-off.`,
        es: `Modos de transporte: ${list}. La mayoría llega en ${top?.[0] ?? "transporte"}${top ? ` (${top[1]})` : ""} — coordina con transporte en esas líneas cerca del inicio.`,
        fr: `Modes de transport : ${list}. La plupart arrivent en ${top?.[0] ?? "transport"}${top ? ` (${top[1]})` : ""} — coordonnez avec le transport sur ces lignes près du coup d'envoi.`,
      }),
      sources: ["fan profiles", "transport mode"],
    };
  }

  // Sections / where are fans
  if (/section|where|seat|crowd|concentrat|zone|distribut/.test(q)) {
    const sections = tally(fans, (f) => f.seat.section || "unknown").slice(0, 4);
    const list = sections.map(([s, c]) => `Sec ${s}: ${c}`).join(", ") || "no data";
    return {
      answer: pick(lang, {
        en: `Fans are concentrated in — ${list}. Watch the concourses serving the top sections for early congestion.`,
        es: `Los aficionados se concentran en — ${list}. Vigila los pasillos que sirven a las secciones principales por congestión temprana.`,
        fr: `Les supporters sont concentrés dans — ${list}. Surveillez les couloirs desservant les principales sections pour la congestion.`,
      }),
      sources: ["fan profiles", "seat sections"],
    };
  }

  // Food / orders
  if (/food|order|stall|vendor|revenue|eat|drink/.test(q)) {
    const active = orders.filter((o) => o.status !== "cancelled");
    const revenue = active.reduce((s, o) => s + o.total, 0);
    return {
      answer: pick(lang, {
        en: `${active.length} seat orders placed so far, totalling $${(revenue / 100).toFixed(2)}. Peak load will follow the arrival wave — pre-stage popular items.`,
        es: `${active.length} pedidos a asiento hasta ahora, por un total de $${(revenue / 100).toFixed(2)}. El pico seguirá a la llegada — prepara los artículos populares.`,
        fr: `${active.length} commandes au siège jusqu'ici, pour un total de ${(revenue / 100).toFixed(2)} $. Le pic suivra l'arrivée — préparez les articles populaires.`,
      }),
      sources: ["fan orders"],
    };
  }

  // Incidents reported by fans
  if (/incident|issue|report|problem|complaint|safety/.test(q)) {
    const list = incidents.slice(0, 3).map((i) => `${i.type} @ ${i.zone}`).join("; ") || "none";
    return {
      answer: pick(lang, {
        en: `${incidents.length} fan-reported incident(s): ${list}. Prioritise the highest-severity zones and dispatch stewards.`,
        es: `${incidents.length} incidente(s) reportado(s) por aficionados: ${list}. Prioriza las zonas de mayor gravedad y envía personal.`,
        fr: `${incidents.length} incident(s) signalé(s) par les supporters : ${list}. Priorisez les zones les plus graves et envoyez des agents.`,
      }),
      sources: ["fan-reported incidents"],
    };
  }

  // Default overview
  const partygoers = fans.reduce((s, f) => s + f.partySize, 0);
  const topSection = tally(fans, (f) => f.seat.section || "unknown")[0];
  return {
    answer: pick(lang, {
      en: `${totalFans} fans checked in (${partygoers} people incl. groups). Busiest section: ${topSection ? `Sec ${topSection[0]} (${topSection[1]})` : "n/a"}. Ask me about accessibility, transport, food orders, or fan-reported incidents.`,
      es: `${totalFans} aficionados registrados (${partygoers} personas incl. grupos). Sección más concurrida: ${topSection ? `Sec ${topSection[0]} (${topSection[1]})` : "n/d"}. Pregúntame sobre accesibilidad, transporte, pedidos o incidentes.`,
      fr: `${totalFans} supporters enregistrés (${partygoers} personnes avec les groupes). Section la plus fréquentée : ${topSection ? `Sec ${topSection[0]} (${topSection[1]})` : "n/d"}. Interrogez-moi sur l'accessibilité, le transport, les commandes ou les incidents.`,
    }),
    sources: ["fan profiles"],
  };
}
