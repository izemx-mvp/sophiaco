import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bot,
  FileCheck2,
  FileText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DeadlineBadge, PageHeader, StatusBadge, daysLeft, useCountUp } from "@/components/common";
import { Button } from "@/components/ui/button";
import { conformityRate } from "@/lib/mock-data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Sophiaco Control" },
      {
        name: "description",
        content:
          "Vue d'ensemble des appels d'offres suivis, du budget et de l'activité des agents IA Sophiaco.",
      },
      { property: "og:title", content: "Tableau de bord — Sophiaco Control" },
      {
        property: "og:description",
        content: "KPI, activité des agents IA et échéances des marchés publics.",
      },
    ],
  }),
  component: DashboardPage,
});

const chartData = Array.from({ length: 30 }, (_, i) => ({
  jour: `${i + 1}`,
  identifiés: 2 + Math.round(4 * Math.abs(Math.sin(i / 3.2))),
  soumis: 1 + Math.round(2.4 * Math.abs(Math.cos(i / 4.1))),
}));

function KpiCard({
  label,
  value,
  suffix,
  icon: Icon,
  delay,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  delay: number;
}) {
  const v = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="rounded-lg bg-accent-soft p-2">
          <Icon className="h-4 w-4 text-accent" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tabular-nums">
        {v.toLocaleString("fr-MA")}
        {suffix ? <span className="ml-1 text-base text-muted-foreground">{suffix}</span> : null}
      </p>
    </motion.div>
  );
}

function DashboardPage() {
  const { visibleTenders, criteriaSaved } = useApp();
  const actifs = visibleTenders.filter((t) => t.stage < 5).length;
  const budget = visibleTenders.reduce((a, t) => a + t.budget, 0);
  const conformite = Math.round(
    visibleTenders.reduce((a, t) => a + conformityRate(t), 0) / Math.max(1, visibleTenders.length),
  );
  const soumis = visibleTenders.filter((t) => t.stage >= 5).length;
  const deadlines = [...visibleTenders]
    .filter((t) => t.stage < 5)
    .sort((a, b) => daysLeft(a.deadline) - daysLeft(b.deadline))
    .slice(0, 6);

  const activity = [
    { label: "Agent Veille a identifié 3 nouveaux appels d'offres", time: "il y a 12 min" },
    { label: "Agent Matching a terminé l'analyse du dossier CHU-2026-0142", time: "il y a 1 h" },
    { label: "4 documents générés pour MS-2026-0311", time: "il y a 3 h" },
    { label: "Agent Veille a écarté 12 avis hors critères", time: "il y a 5 h" },
    { label: "Dossier HCZ-2026-0087 marqué comme soumis", time: "hier à 16:10" },
  ];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Pilotage en temps réel de la veille, du matching et des dossiers de réponse."
      />

      {!criteriaSaved && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-[color-mix(in_oklab,var(--warning)_35%,white)] bg-[color-mix(in_oklab,var(--warning)_12%,white)] px-4 py-3"
        >
          <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
          <p className="text-sm font-medium">
            Configurez vos critères de veille avant de lancer une recherche.
          </p>
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link to="/criteres">Configurer</Link>
          </Button>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Appels d'offres actifs" value={actifs} icon={FileText} delay={0} />
        <KpiCard label="Budget total suivi (MAD)" value={budget} icon={Wallet} delay={0.05} />
        <KpiCard
          label="Taux de conformité produits"
          value={conformite}
          suffix="%"
          icon={Activity}
          delay={0.1}
        />
        <KpiCard label="Dossiers soumis ce mois" value={soumis} icon={FileCheck2} delay={0.15} />
        <KpiCard label="Certificats à renouveler" value={3} icon={ShieldCheck} delay={0.2} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <h2 className="font-display text-base font-semibold">Activité des 30 derniers jours</h2>
          <p className="text-sm text-muted-foreground">
            Appels d'offres identifiés vs dossiers soumis
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gId" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="jour" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={28} />
                <RTooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="identifiés"
                  stroke="var(--primary)"
                  fill="url(#gId)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="soumis"
                  stroke="var(--accent)"
                  fill="url(#gSub)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <h2 className="font-display text-base font-semibold">Activité récente des agents IA</h2>
          <div className="mt-4 space-y-4">
            {activity.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="flex gap-3"
              >
                <span className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/25" />
                  <Bot className="relative h-3.5 w-3.5 text-accent" />
                </span>
                <div>
                  <p className="text-sm leading-snug">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card mt-6 p-5"
      >
        <h2 className="font-display text-base font-semibold">Échéances à venir</h2>
        <div className="clinical-rule my-4" />
        <div className="space-y-2">
          {deadlines.map((t) => (
            <Link
              key={t.id}
              to="/appels-offres/$id"
              params={{ id: t.id }}
              className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
            >
              <span className="font-medium">{t.ref}</span>
              <span className="text-sm text-muted-foreground">{t.client}</span>
              <span className="ml-auto flex items-center gap-2">
                <StatusBadge status={t.status} />
                <DeadlineBadge deadline={t.deadline} />
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
