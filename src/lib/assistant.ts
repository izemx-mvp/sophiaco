import { STAGES, conformityRate, evaluateCe, productById, type Tender } from "./mock-data";

export const SUGGESTED_QUESTIONS = [
  "Quel est le budget de ce dossier ?",
  "Quels produits sont non conformes ?",
  "Quand est la date limite ?",
  "Puis-je soumissionner avec le certificat d'enregistrement ?",
  "Résume ce dossier en 3 points.",
];

const fr = (n: number) => n.toLocaleString("fr-MA");
const dateFr = (d: string) => new Date(d).toLocaleDateString("fr-FR");

function has(q: string, words: string[]) {
  return words.some((w) => q.includes(w));
}

/**
 * Réponse simulée de l'assistant, calculée à partir des données du dossier.
 * Point d'entrée unique — à remplacer plus tard par un vrai appel API LLM.
 */
export function getAssistantReply(question: string, t: Tender): string {
  const q = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (has(q, ["budget", "prix", "montant", "cout", "coût"])) {
    const unit = Math.round(t.budget / Math.max(1, t.requirements.length));
    return `Le budget estimé de ${t.ref} est de ${fr(t.budget)} MAD pour ${t.requirements.length} ligne(s) du cahier des charges, soit environ ${fr(unit)} MAD par ligne. Maître d'ouvrage : ${t.client} (${t.city}).`;
  }

  if (has(q, ["non conforme", "conformite", "conforme", "risque", "verifier"])) {
    const ko = t.requirements.filter((r) => r.conformity === "Non conforme");
    const warn = t.requirements.filter((r) => r.conformity === "À vérifier");
    if (!ko.length && !warn.length) {
      return `Toutes les lignes de ${t.ref} sont conformes (score global ${conformityRate(t)}%). Aucun point bloquant identifié.`;
    }
    const lines = [
      ...ko.map((r) => `• ❌ ${r.article} — ${productById(r.productId).name} (score ${r.score}%)`),
      ...warn.map(
        (r) =>
          `• ⚠️ ${r.article} — ${productById(r.productId).name} (score ${r.score}%, à vérifier)`,
      ),
    ];
    return `Sur ${t.requirements.length} ligne(s), ${ko.length} non conforme(s) et ${warn.length} à vérifier :\n${lines.join("\n")}\nScore global de conformité : ${conformityRate(t)}%.`;
  }

  if (has(q, ["certificat", "autorisation", "enregistrement", " ce ", "titulaire", "distributeur"])) {
    const ce = t.ce;
    const ev = evaluateCe(ce);
    const verdict =
      ev.level === "blocked"
        ? "\u{1F6AB} Soumission impossible en l'\u00e9tat"
        : ev.level === "warn"
          ? "\u26A0\uFE0F Soumission possible sous condition"
          : "\u2705 Soumission recevable";
    const actions = ev.actions.length
      ? `\n\u00c0 faire :\n${ev.actions.map((x) => `\u2022 ${x}`).join("\n")}`
      : "";
    return `Certificat d'enregistrement de ${t.ref} \u2014 cas \u00ab ${ce.rule} \u00bb (${ce.rcArticle}).\nTitulaire : ${ce.holder}, n\u00b0 ${ce.number}. FZANA intervient comme ${ce.fzanaIsHolder ? "titulaire" : "distributeur"}${ce.fzanaIsHolder ? "" : ce.authorization ? " avec autorisation du titulaire" : " sans autorisation \u00e0 ce jour"}.\n${verdict} \u2014 ${ev.message}${actions}`;
  }

  if (has(q, ["date limite", "echeance", "deadline", "quand", "delai"])) {
    const days = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000);
    return `La date limite de dépôt de ${t.ref} est le ${dateFr(t.deadline)} (${days >= 0 ? `dans ${days} jour(s)` : `dépassée de ${-days} jour(s)`}). Étape actuelle du dossier : ${STAGES[t.stage - 1]}.`;
  }

  if (has(q, ["resume", "synthese", "3 points", "points cles"])) {
    return t.summary.map((s) => `• ${s}`).join("\n");
  }

  if (has(q, ["produit", "matching", "catalogue", "propose"])) {
    return t.requirements
      .map((r) => {
        const p = productById(r.productId);
        return `• ${r.article} (qté ${r.qty}) → ${p.name} — ${p.supplier} · ${r.score}%`;
      })
      .join("\n");
  }

  if (has(q, ["document", "memoire", "bordereau", "acte"])) {
    return t.stage >= 4
      ? `Les 4 documents de ${t.ref} sont générés : mémoire technique, document descriptif technique, bordereau des prix et acte d'engagement. Ils sont consultables et téléchargeables dans l'onglet « Documents ».`
      : `Les documents ne sont pas encore générés : le dossier est à l'étape « ${STAGES[t.stage - 1]} ». Ils seront produits automatiquement à l'étape « Documents générés ».`;
  }

  if (has(q, ["etape", "statut", "avancement", "ou en est"])) {
    return `${t.ref} est à l'étape ${t.stage}/6 — « ${STAGES[t.stage - 1]} », statut « ${t.status} »${t.result ? ` (résultat : ${t.result})` : ""}.`;
  }

  if (has(q, ["client", "ville", "hopital", "qui"])) {
    return `Le maître d'ouvrage est ${t.client}, situé à ${t.city}. Catégorie dominante : ${t.category}.`;
  }

  return `Voici l'essentiel sur ${t.ref} : ${t.client} (${t.city}), budget ${fr(t.budget)} MAD, date limite le ${dateFr(t.deadline)}, étape « ${STAGES[t.stage - 1]} », conformité ${conformityRate(t)}%. Posez-moi une question sur le budget, la conformité, les produits, les documents ou le certificat.`;
}
