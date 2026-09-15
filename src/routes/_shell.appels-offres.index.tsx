import { Link, createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Eye,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  DeadlineBadge,
  EmptyState,
  PageHeader,
  Pagination,
  ScoreGauge,
  StatusBadge,
  formatMAD,
} from "@/components/common";
import { CeBadge } from "@/components/ce-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, conformityRate, type Tender, type TenderStatus } from "@/lib/mock-data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_shell/appels-offres/")({
  head: () => ({
    meta: [
      { title: "Appels d'offres — Sophiaco Control" },
      {
        name: "description",
        content: "Liste filtrable des appels d'offres publics santé suivis par Sophiaco.",
      },
      { property: "og:title", content: "Appels d'offres — Sophiaco Control" },
      {
        property: "og:description",
        content: "Recherche, filtres, tri et analyse IA des marchés publics santé.",
      },
    ],
  }),
  component: TendersPage,
});

const STATUSES: TenderStatus[] = [
  "Nouveau",
  "En analyse",
  "Conforme",
  "Non conforme",
  "Soumis",
  "Gagné",
  "Perdu",
];

const ANALYSIS_STEPS = [
  "Téléchargement du dossier…",
  "Extraction des exigences…",
  "Génération de la fiche de synthèse…",
];

function TendersPage() {
  const { visibleTenders, criteriaSaved, runAnalysis, runVeille, pushNotification } = useApp();
  const [scanning, setScanning] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sector, setSector] = useState("all");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState<{ key: keyof Tender | "conformity"; dir: "asc" | "desc" }>({
    key: "deadline",
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [analysing, setAnalysing] = useState<{ id: string; step: number } | null>(null);

  const filtered = useMemo(() => {
    const list = visibleTenders.filter((t) => {
      const text = `${t.ref} ${t.client} ${t.category} ${t.city}`.toLowerCase();
      if (q && !text.includes(q.toLowerCase())) return false;
      if (status !== "all" && t.status !== status) return false;
      if (sector !== "all" && t.category !== sector) return false;
      if (budgetMin && t.budget < Number(budgetMin)) return false;
      if (budgetMax && t.budget > Number(budgetMax)) return false;
      if (from && t.deadline < from) return false;
      if (to && t.deadline > to) return false;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === "conformity") return (conformityRate(a) - conformityRate(b)) * dir;
      const av = a[sort.key] as string | number;
      const bv = b[sort.key] as string | number;
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
    });
  }, [visibleTenders, q, status, sector, budgetMin, budgetMax, from, to, sort]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: typeof sort.key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const SortHead = ({
    label,
    k,
    className,
  }: {
    label: string;
    k: typeof sort.key;
    className?: string;
  }) => (
    <th className={`px-4 py-3 text-left ${className ?? ""}`}>
      <button
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => toggleSort(k)}
      >
        {label}
        {sort.key === k ? (
          sort.dir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : null}
      </button>
    </th>
  );

  const launchAnalysis = (t: Tender) => {
    setAnalysing({ id: t.id, step: 0 });
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      if (step >= ANALYSIS_STEPS.length) {
        clearInterval(timer);
        runAnalysis(t.id);
        setAnalysing(null);
        pushNotification(`Analyse IA terminée pour ${t.ref}`);
        toast.success(`${t.ref} analysé — fiche de synthèse générée`);
      } else {
        setAnalysing({ id: t.id, step });
      }
    }, 900);
  };

  const launchVeille = () => {
    setScanning(true);
    toast("Veille lancée — l'Agent Veille scanne marchespublics.gov.ma…");
    setTimeout(() => {
      const found = runVeille();
      setScanning(false);
      setQ("");
      setStatus("Nouveau");
      setSector("all");
      setPage(1);
      setSort({ key: "deadline", dir: "asc" });
      pushNotification(`Agent Veille : ${found.length} nouveaux appels d'offres identifiés`);
      toast.success(
        `${found.length} nouveaux appels d'offres identifiés : ${found.map((f) => f.ref).join(", ")}`,
      );
    }, 1600);
  };

  const reset = () => {
    setQ("");
    setStatus("all");
    setSector("all");
    setBudgetMin("");
    setBudgetMax("");
    setFrom("");
    setTo("");
    setPage(1);
    toast("Filtres réinitialisés");
  };

  return (
    <div>
      <PageHeader
        title="Appels d'offres"
        subtitle="Tous les dossiers identifiés par l'Agent Veille selon vos critères."
        actions={
          <>
            <div className="flex rounded-lg border border-border p-0.5">
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button disabled={!criteriaSaved || scanning} onClick={launchVeille}>
              <Sparkles className={`mr-2 h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "Veille en cours…" : "Lancer la veille"}
            </Button>
          </>
        }
      />

      {!criteriaSaved && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-[color-mix(in_oklab,var(--warning)_35%,white)] bg-[color-mix(in_oklab,var(--warning)_12%,white)] px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
          <p className="text-sm font-medium">
            Configurez vos critères de veille avant de lancer une recherche.
          </p>
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link to="/criteres">Configurer</Link>
          </Button>
        </div>
      )}

      <div className="glass-card mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher (client, numéro, mot-clé)…"
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sector}
            onValueChange={(v) => {
              setSector(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Secteur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les secteurs</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Budget min"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Budget max"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-sm text-muted-foreground">→</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="outline" onClick={reset} className="justify-self-start">
            <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser les filtres
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun résultat pour cette recherche"
          hint="Ajustez vos filtres ou vos critères de veille."
        />
      ) : view === "list" ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <SortHead label="Référence" k="ref" />
                  <SortHead label="Client" k="client" />
                  <SortHead label="Budget" k="budget" />
                  <SortHead label="Date limite" k="deadline" />
                  <SortHead label="Statut" k="status" />
                  <th className="px-4 py-3 text-left">Lignes</th>
                  <SortHead label="Conformité" k="conformity" />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {pageItems.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/60 last:border-0 hover:bg-secondary/50"
                    >
                      <td className="px-4 py-3 font-medium">{t.ref}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.client}</td>
                      <td className="px-4 py-3 tabular-nums">{formatMAD(t.budget)}</td>
                      <td className="px-4 py-3">
                        <DeadlineBadge deadline={t.deadline} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={t.status} />
                          <CeBadge tender={t} />
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{t.requirements.length}</td>
                      <td className="px-4 py-3">
                        <ScoreGauge value={conformityRate(t)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {t.status === "Nouveau" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={analysing?.id === t.id}
                              onClick={() => launchAnalysis(t)}
                            >
                              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Analyse IA
                            </Button>
                          )}
                          <Button asChild size="sm">
                            <Link to="/appels-offres/$id" params={{ id: t.id }}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> Détail
                            </Link>
                          </Button>
                        </div>
                        {analysing?.id === t.id && (
                          <div className="mt-2 w-56">
                            <Progress
                              value={((analysing.step + 1) / ANALYSIS_STEPS.length) * 100}
                              className="h-1.5"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {ANALYSIS_STEPS[analysing.step]}
                            </p>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPage={setPage}
              onPageSize={setPageSize}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pageItems.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className="glass-card flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-semibold">{t.ref}</p>
                    <p className="text-sm text-muted-foreground">{t.client}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="clinical-rule my-4" />
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Budget</dt>
                    <dd className="tabular-nums">{formatMAD(t.budget)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Lignes</dt>
                    <dd>{t.requirements.length} article(s)</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-between">
                  <DeadlineBadge deadline={t.deadline} />
                  <ScoreGauge value={conformityRate(t)} />
                </div>
                <div className="mt-3">
                  <CeBadge tender={t} />
                </div>
                <div className="mt-4 flex gap-2">
                  {t.status === "Nouveau" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => launchAnalysis(t)}
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Analyse IA
                    </Button>
                  )}
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/appels-offres/$id" params={{ id: t.id }}>
                      Voir le détail
                    </Link>
                  </Button>
                </div>
                {analysing?.id === t.id && (
                  <div className="mt-3">
                    <Progress
                      value={((analysing.step + 1) / ANALYSIS_STEPS.length) * 100}
                      className="h-1.5"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ANALYSIS_STEPS[analysing.step]}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </div>
      )}
    </div>
  );
}
