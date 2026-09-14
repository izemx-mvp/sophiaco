import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Lock,
  MapPin,
  Package,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  ConformityBadge,
  DeadlineBadge,
  ScoreGauge,
  StatusBadge,
  daysLeft,
  downloadTextFile,
  formatMAD,
} from "@/components/common";
import { AssistantPanel } from "@/components/assistant-panel";
import { CeBadge, CeCard } from "@/components/ce-card";
import { ProductModal } from "@/components/product-modal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DOC_TYPES,
  STAGES,
  conformityRate,
  productById,
  type DocType,
  type PieceStatus,
  type Product,
  type Tender,
} from "@/lib/mock-data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_shell/appels-offres/$id")({
  head: () => ({
    meta: [
      { title: "Détail de l'appel d'offres — FZANA Control" },
      {
        name: "description",
        content:
          "Fiche de synthèse, exigences techniques, matching produits et documents générés du dossier.",
      },
      { property: "og:title", content: "Détail de l'appel d'offres — FZANA Control" },
      {
        property: "og:description",
        content: "Suivi complet du dossier, de l'identification au résultat.",
      },
    ],
  }),
  component: TenderDetail,
});

const TABS = [
  "Fiche de synthèse",
  "Pièces du dossier",
  "Lots & articles",
  "Matching produits",
  "Documents",
  "Historique",
] as const;
type Tab = (typeof TABS)[number];

const tabMinStage: Record<Tab, number> = {
  "Fiche de synthèse": 1,
  "Pièces du dossier": 1,
  "Lots & articles": 1,
  "Matching produits": 3,
  Documents: 4,
  Historique: 1,
};

const PIECE_TONE: Record<PieceStatus, string> = {
  Fournie: "bg-accent-soft text-accent",
  "À produire":
    "bg-[color-mix(in_oklab,var(--warning)_14%,white)] text-[var(--warning)] border border-[color-mix(in_oklab,var(--warning)_30%,white)]",
  Manquante: "bg-destructive/10 text-destructive",
};

const PIECE_CYCLE: PieceStatus[] = ["Manquante", "À produire", "Fournie"];

export function docContent(t: Tender, type: DocType) {
  const head = [
    "FZANA SYSTEMS — Distribution d'équipements médicaux",
    "===================================================",
    `Document : ${type}`,
    `Appel d'offres : ${t.ref}`,
    `Client : ${t.client}`,
    `Budget estimé : ${formatMAD(t.budget)}`,
    `Date limite : ${new Date(t.deadline).toLocaleDateString("fr-FR")}`,
    "",
  ];
  if (type === "Mémoire technique") {
    head.push("RÉPONSE LIGNE PAR LIGNE AU CAHIER DES CHARGES", "");
    t.requirements.forEach((r, i) => {
      const p = productById(r.productId);
      head.push(
        `${i + 1}. ${r.article} (qté ${r.qty})`,
        `   Exigence : ${r.specs}`,
        `   Solution proposée : ${p.name} — réf. ${p.reference} (${p.supplier})`,
        `   Conformité : ${r.conformity} — score ${r.score}%`,
        "",
      );
    });
  } else if (type === "Bordereau des prix") {
    head.push("BORDEREAU DES PRIX UNITAIRES", "");
    t.requirements.forEach((r, i) => {
      const unit = Math.round(t.budget / (t.requirements.length * r.qty));
      head.push(`${i + 1}. ${r.article} — qté ${r.qty} × ${unit.toLocaleString("fr-MA")} MAD`);
    });
    head.push("", `TOTAL ESTIMÉ : ${formatMAD(t.budget)}`);
  } else if (type === "Acte d'engagement") {
    head.push(
      "Le soussigné, agissant au nom et pour le compte de FZANA SYSTEMS,",
      "s'engage à exécuter les prestations objet du présent marché conformément",
      "aux clauses du cahier des charges et aux prix du bordereau joint.",
      "",
      "Certificat d'enregistrement mobilisé : partenaire avec autorisation.",
      "",
      "Fait à Casablanca, signature : Mme Naoual Elhaoussi",
    );
  } else {
    head.push("DESCRIPTIF TECHNIQUE DÉTAILLÉ", "");
    t.requirements.forEach((r) => {
      const p = productById(r.productId);
      head.push(`• ${p.name} (${p.category})`, ...p.specs.map((s) => `   - ${s}`), "");
    });
  }
  return head.join("\n");
}

function initials(client: string) {
  return client
    .replace(/[^A-Za-zÀ-ÿ ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((i) => (
        <motion.span
          key={i}
          initial={{ y: -40, x: `${(i * 37) % 100}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "105vh", rotate: 360 + i * 12, opacity: 0 }}
          transition={{ duration: 2 + (i % 5) * 0.3, ease: "easeIn" }}
          className="absolute h-2.5 w-1.5 rounded-sm"
          style={{ background: i % 2 ? "var(--accent)" : "var(--primary-glow)" }}
        />
      ))}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card hover-lift flex items-center gap-3 px-4 py-3">
      <span className="rounded-lg bg-accent-soft p-2">
        <Icon className="h-4 w-4 text-accent" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="truncate text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

function TenderDetail() {
  const { id } = useParams({ from: "/_shell/appels-offres/$id" });
  const { getTender, advanceStage, setResult, docs, pushNotification, setPieceStatus } = useApp();
  const t = getTender(id);
  const [tab, setTab] = useState<Tab>("Fiche de synthèse");
  const [product, setProduct] = useState<Product | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocType | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [openReq, setOpenReq] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (generating === null) return;
    if (generating >= DOC_TYPES.length) {
      const to = setTimeout(() => setGenerating(null), 700);
      return () => clearTimeout(to);
    }
    const to = setTimeout(() => setGenerating((g) => (g ?? 0) + 1), 700);
    return () => clearTimeout(to);
  }, [generating]);

  useEffect(() => {
    if (!celebrate) return;
    const to = setTimeout(() => setCelebrate(false), 2600);
    return () => clearTimeout(to);
  }, [celebrate]);

  if (!t) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold">Dossier introuvable</h1>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/appels-offres">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const tenderDocs = docs.filter((d) => d.tenderId === t.id);
  const risks = t.requirements.filter((r) => r.conformity !== "Conforme");
  const d = daysLeft(t.deadline);

  const next = () => {
    if (t.stage >= 6) return;
    setAdvancing(true);
    setTimeout(() => {
      const target = t.stage + 1;
      advanceStage(t.id);
      setAdvancing(false);
      if (target === 4) {
        setGenerating(0);
        setTab("Documents");
        pushNotification(`4 documents générés pour ${t.ref}`);
      }
      toast.success(`Dossier passé à l'étape « ${STAGES[target - 1]} »`);
    }, 800);
  };

  return (
    <div className="mx-auto max-w-[1600px]">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link to="/appels-offres">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux appels d'offres
        </Link>
      </Button>

      {/* En-tête enrichi */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full gradient-brand font-display text-lg font-semibold text-primary-foreground">
            {initials(t.client)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {t.client}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Appel d'offres n° {t.ref} · {t.procedure} · étape {t.stage}/6 —{" "}
              {STAGES[t.stage - 1]}
            </p>
            <p className="mt-2 max-w-3xl text-sm">{t.objet}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={t.status} />
            <DeadlineBadge deadline={t.deadline} />
            <CeBadge tender={t} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat icon={FileText} label="Référence">
            {t.ref}
          </Stat>
          <Stat icon={MapPin} label="Ville">
            {t.city}
          </Stat>
          <Stat icon={Building2} label="Catégorie">
            {t.category}
          </Stat>
          <Stat icon={Wallet} label="Budget estimé">
            <span className="tabular-nums">{formatMAD(t.budget)}</span>
          </Stat>
          <Stat icon={Wallet} label="Caution provisoire">
            <span className="tabular-nums">{formatMAD(t.caution)}</span>
          </Stat>
          <Stat icon={CalendarClock} label="Date limite">
            {new Date(t.deadline).toLocaleDateString("fr-FR")}
          </Stat>
        </div>
      </motion.div>

      {/* Stepper */}
      <div className="glass-card mt-4 p-5">
        <div className="relative">
          <div className="absolute left-0 right-0 top-4 h-0.5 rounded bg-muted" />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((t.stage - 1) / 5) * 100}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute left-0 top-4 h-0.5 rounded bg-gradient-to-r from-primary to-accent"
          />
          <div className="relative flex justify-between gap-2">
            {STAGES.map((s, i) => {
              const n = i + 1;
              const done = t.stage > n;
              const current = t.stage === n;
              return (
                <div key={s} className="flex min-w-0 flex-1 flex-col items-center text-center">
                  <span
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      done
                        ? "bg-[var(--success)] text-white"
                        : current
                          ? "pulse-accent bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : n}
                  </span>
                  <p
                    className={`mt-2 truncate text-xs md:text-sm ${current ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {s}
                  </p>
                  {n === 6 && t.result ? (
                    <p className="text-xs text-muted-foreground">{t.result}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="clinical-rule my-5" />
        <div className="flex flex-wrap items-center gap-3">
          <Progress value={(t.stage / 6) * 100} className="h-2 flex-1 min-w-40" />
          {t.stage === 5 ? (
            <>
              <Button
                className="btn-shine"
                onClick={() => {
                  setResult(t.id, "Gagné");
                  setCelebrate(true);
                  toast.success("Marché gagné — bravo !");
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Marché gagné
              </Button>
              <Button variant="outline" onClick={() => setResult(t.id, "Perdu")}>
                Marché perdu
              </Button>
            </>
          ) : t.stage === 4 ? (
            <Button className="btn-shine" disabled={advancing} onClick={next}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Marquer comme soumis
            </Button>
          ) : (
            <Button className="btn-shine" disabled={t.stage >= 6 || advancing} onClick={next}>
              <Sparkles className="mr-2 h-4 w-4" />
              {t.stage >= 6 ? "Dossier clôturé" : "Passer à l'étape suivante"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <TooltipProvider>
        <div className="mb-4 mt-6 flex flex-wrap gap-1 border-b border-border">
          {TABS.map((label) => {
            const locked = t.stage < tabMinStage[label];
            const active = tab === label;
            const btn = (
              <button
                key={label}
                disabled={locked}
                onClick={() => setTab(label)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors ${
                  locked
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {locked && <Lock className="h-3.5 w-3.5" />}
                {label}
                {active && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-gradient-to-r from-primary to-accent"
                  />
                )}
              </button>
            );
            return locked ? (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <span>{btn}</span>
                </TooltipTrigger>
                <TooltipContent>
                  Disponible à partir de l'étape « {STAGES[tabMinStage[label] - 1]} »
                </TooltipContent>
              </Tooltip>
            ) : (
              btn
            );
          })}
        </div>
      </TooltipProvider>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          {tab === "Fiche de synthèse" && (
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="xl:col-span-3">
                <CeCard tender={t} />
              </div>
              <div className="glass-card p-6 xl:col-span-2">
                <h2 className="font-display text-base font-semibold">Synthèse générée par l'IA</h2>
                <div className="clinical-rule my-4" />
                {advancing ? (
                  <div className="space-y-3">
                    <div className="skeleton-shimmer h-4 w-full rounded" />
                    <div className="skeleton-shimmer h-4 w-5/6 rounded" />
                    <div className="skeleton-shimmer h-4 w-2/3 rounded" />
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {t.summary.map((s) => (
                      <li key={s} className="flex gap-3 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                <h3 className="mt-8 font-display text-base font-semibold">
                  Risques identifiés par l'IA
                </h3>
                <div className="clinical-rule my-4" />
                {risks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun risque détecté : toutes les lignes du cahier des charges sont conformes.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {risks.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-start gap-3 rounded-lg border border-[color-mix(in_oklab,var(--warning)_30%,white)] bg-[color-mix(in_oklab,var(--warning)_8%,white)] px-3 py-2.5 text-sm"
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                        <span>
                          <strong>{r.article}</strong> — {r.conformity.toLowerCase()} :
                          spécification « {r.specs} » proche de la limite (score {r.score}% avec{" "}
                          {productById(r.productId).name}).
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-4">
                <div className="glass-card p-6">
                  <h2 className="font-display text-base font-semibold">Indicateurs</h2>
                  <div className="clinical-rule my-4" />
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Articles demandés</dt>
                      <dd className="font-medium">{t.requirements.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Budget</dt>
                      <dd className="font-medium tabular-nums">{formatMAD(t.budget)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ville</dt>
                      <dd className="font-medium">{t.city}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Conformité globale</dt>
                      <dd>
                        <ScoreGauge value={conformityRate(t)} />
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="glass-card p-6">
                  <h2 className="font-display text-base font-semibold">Prochaines échéances</h2>
                  <div className="clinical-rule my-4" />
                  <ol className="relative space-y-4 border-l border-clinical-line pl-5">
                    {[
                      { label: "Finalisation du dossier technique", day: Math.max(1, d - 7) },
                      { label: "Validation interne & signature", day: Math.max(1, d - 3) },
                      { label: "Dépôt sur marchespublics.gov.ma", day: Math.max(0, d) },
                    ].map((e) => (
                      <li key={e.label}>
                        <span className="absolute -left-[6px] mt-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                        <p className="text-sm font-medium">{e.label}</p>
                        <p className="text-xs text-muted-foreground">Dans {e.day} jour(s)</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}

          {tab === "Pièces du dossier" && (
            <div className="space-y-6">
              {(["Dossier administratif", "Dossier technique", "Dossier additif"] as const).map(
                (cat) => {
                  const list = t.pieces.filter((p) => p.category === cat);
                  if (list.length === 0) return null;
                  const done = list.filter((p) => p.status === "Fournie").length;
                  return (
                    <div key={cat} className="glass-card overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-secondary/40 px-5 py-4">
                        <h2 className="font-display text-base font-semibold">{cat}</h2>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {done}/{list.length} pièce(s) fournie(s)
                        </span>
                      </div>
                      <ul className="divide-y divide-border/60">
                        {list.map((p) => (
                          <li
                            key={p.id}
                            className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/30"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-52 flex-1">
                              <p className="font-medium">
                                {p.name}
                                {p.mandatory && <span className="ml-1 text-destructive">*</span>}
                              </p>
                              <p className="text-sm text-muted-foreground">{p.note}</p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${PIECE_TONE[p.status]}`}
                            >
                              {p.status}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const next =
                                  PIECE_CYCLE[
                                    (PIECE_CYCLE.indexOf(p.status) + 1) % PIECE_CYCLE.length
                                  ]!;
                                setPieceStatus(t.id, p.id, next);
                                toast.success(`${p.name} → ${next}`);
                              }}
                            >
                              Changer l'état
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                },
              )}
              <p className="text-xs text-muted-foreground">
                * Pièce obligatoire au sens du décret n° 2-22-431 relatif aux marchés publics.
              </p>
            </div>
          )}

          {tab === "Lots & articles" && (
            <div className="space-y-2">
              {t.requirements.map((r) => {
                const p = productById(r.productId);
                const open = openReq === r.id;
                return (
                  <div key={r.id} className="glass-card overflow-hidden">
                    <button
                      onClick={() => setOpenReq(open ? null : r.id)}
                      className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
                    >
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                      />
                      <span className="min-w-52 flex-1 font-medium">{r.article}</span>
                      <span className="tabular-nums text-sm text-muted-foreground">
                        Qté {r.qty}
                      </span>
                      <span className="min-w-52 flex-1 text-sm text-muted-foreground">
                        {r.specs}
                      </span>
                      <ConformityBadge value={r.conformity} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-border/60 bg-secondary/30"
                        >
                          <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Produit proposé
                              </p>
                              <p className="mt-1 font-medium">{p.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {p.reference} · {p.supplier} · {p.category}
                              </p>
                              <div className="mt-3">
                                <ScoreGauge value={r.score} />
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-3"
                                onClick={() => setProduct(p)}
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" /> Fiche produit
                              </Button>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Justification de la conformité
                              </p>
                              <ul className="mt-2 space-y-1.5 text-sm">
                                {p.specs.map((s) => (
                                  <li key={s} className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "Matching produits" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {t.requirements.map((r, i) => {
                const p = productById(r.productId);
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card hover-lift flex flex-col overflow-hidden"
                  >
                    <div className="flex h-28 items-center justify-center gradient-brand">
                      <Package className="h-10 w-10 text-primary-foreground/80" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Exigence
                      </p>
                      <p className="font-medium">{r.article}</p>
                      <p className="text-sm text-muted-foreground">{r.specs}</p>
                      <div className="clinical-rule my-3" />
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Produit proposé
                      </p>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.supplier} · {p.reference}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <ScoreGauge value={r.score} />
                        <ConformityBadge value={r.conformity} />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => setProduct(p)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Aperçu
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {tab === "Documents" && (
            <div>
              {generating !== null && (
                <div className="glass-card mb-4 p-5">
                  <p className="font-display text-sm font-semibold">
                    Génération documentaire en cours…
                  </p>
                  <Progress value={(generating / DOC_TYPES.length) * 100} className="my-3 h-2" />
                  <ul className="space-y-2">
                    {DOC_TYPES.map((dt, i) => (
                      <li key={dt} className="flex items-center gap-2 text-sm">
                        {i < generating ? (
                          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-border" />
                        )}
                        <span className={i < generating ? "" : "text-muted-foreground"}>{dt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {tenderDocs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card hover-lift flex flex-col p-5"
                  >
                    <span className="w-fit rounded-lg bg-accent-soft p-2.5">
                      <FileText className="h-5 w-5 text-accent" />
                    </span>
                    <p className="mt-3 font-medium">{doc.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.status} · généré le {doc.createdAt}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setPreviewDoc(doc.type)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Aperçu
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          downloadTextFile(`${t.ref}-${doc.type}.txt`, docContent(t, doc.type));
                          toast.success(`${doc.type} téléchargé`);
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {tab === "Historique" && (
            <div className="glass-card p-6">
              <ol className="relative space-y-6 pl-8">
                <span className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-primary via-accent to-transparent" />
                {t.history.map((h, i) => (
                  <motion.li
                    key={`${h.at}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="relative"
                  >
                    <span className="absolute -left-8 mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-accent">
                      <span className="h-1.5 w-1.5 rounded-full bg-background" />
                    </span>
                    <p className="text-sm font-medium">{h.label}</p>
                    <p className="text-xs text-muted-foreground">{h.at}</p>
                  </motion.li>
                ))}
              </ol>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ProductModal product={product} onOpenChange={(o) => !o && setProduct(null)} />

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="scroll-brand max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{previewDoc}</DialogTitle>
          </DialogHeader>
          {previewDoc && <DocPreview tender={t} type={previewDoc} />}
        </DialogContent>
      </Dialog>

      <AssistantPanel tender={t} />
      <AnimatePresence>{celebrate && <Confetti />}</AnimatePresence>
    </div>
  );
}

export function DocPreview({ tender, type }: { tender: Tender; type: DocType }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 font-sans text-sm shadow-sm">
      <div className="flex items-start justify-between border-b border-clinical-line pb-4">
        <div>
          <p className="font-display text-lg font-semibold text-primary">FZANA SYSTEMS</p>
          <p className="text-xs text-muted-foreground">
            Distribution d'équipements médicaux — Casablanca, Maroc
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{type}</p>
          <p>{tender.ref}</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Maître d'ouvrage</dt>
          <dd className="font-medium">{tender.client}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Budget estimé</dt>
          <dd className="font-medium tabular-nums">{formatMAD(tender.budget)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Date limite</dt>
          <dd className="font-medium">{new Date(tender.deadline).toLocaleDateString("fr-FR")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Lieu d'exécution</dt>
          <dd className="font-medium">{tender.city}</dd>
        </div>
      </dl>

      <h3 className="mt-6 font-display text-sm font-semibold uppercase tracking-wide">
        {type === "Bordereau des prix"
          ? "Bordereau des prix unitaires"
          : type === "Acte d'engagement"
            ? "Engagement du soumissionnaire"
            : "Réponse au cahier des charges"}
      </h3>
      <div className="clinical-rule my-3" />

      {type === "Acte d'engagement" ? (
        <div className="space-y-3 leading-relaxed">
          <p>
            Le soussigné, agissant au nom et pour le compte de <strong>FZANA SYSTEMS</strong>,
            s'engage à exécuter les prestations objet du marché <strong>{tender.ref}</strong>{" "}
            conformément aux clauses du cahier des charges et aux prix portés au bordereau joint.
          </p>
          <p>Certificat d'enregistrement mobilisé : partenaire avec autorisation.</p>
          <p className="pt-6">Fait à Casablanca, le {new Date().toLocaleDateString("fr-FR")}</p>
          <p className="font-medium">Mme Naoual Elhaoussi — Direction commerciale</p>
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="py-2">Désignation</th>
              <th className="py-2">Qté</th>
              <th className="py-2">Solution FZANA</th>
              <th className="py-2">
                {type === "Bordereau des prix" ? "Montant (MAD)" : "Conformité"}
              </th>
            </tr>
          </thead>
          <tbody>
            {tender.requirements.map((r) => {
              const p = productById(r.productId);
              const unit = Math.round(tender.budget / tender.requirements.length);
              return (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-2 pr-3">{r.article}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.qty}</td>
                  <td className="py-2 pr-3">
                    {p.name} <span className="text-muted-foreground">({p.reference})</span>
                  </td>
                  <td className="py-2 tabular-nums">
                    {type === "Bordereau des prix"
                      ? unit.toLocaleString("fr-MA")
                      : `${r.conformity} · ${r.score}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p className="mt-6 border-t border-clinical-line pt-3 text-[11px] text-muted-foreground">
        Document généré automatiquement par FZANA Control — Agent Matching Technique & Catalogue.
      </p>
    </div>
  );
}
