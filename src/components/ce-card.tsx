import { AlertTriangle, BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CE_RULES,
  CE_RULE_HELP,
  evaluateCe,
  type CeEvaluation,
  type CeRule,
  type Tender,
} from "@/lib/mock-data";
import { useApp } from "@/lib/store";

const TONE: Record<CeEvaluation["level"], string> = {
  ok: "bg-accent-soft text-accent border border-accent/30",
  warn: "bg-[color-mix(in_oklab,var(--warning)_12%,white)] text-[var(--warning)] border border-[color-mix(in_oklab,var(--warning)_32%,white)]",
  blocked: "bg-destructive/10 text-destructive border border-destructive/30",
};

const ICON = { ok: ShieldCheck, warn: AlertTriangle, blocked: ShieldAlert };

/** Pastille compacte de l'exigence CE, utilisable en liste. */
export function CeBadge({ tender }: { tender: Tender }) {
  const ev = evaluateCe(tender.ce);
  const Icon = ICON[ev.level];
  return (
    <span
      title={`${tender.ce.rule} — ${ev.message}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE[ev.level]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      CE : {tender.ce.rule}
    </span>
  );
}

/** Bloc de gestion du Certificat d'Enregistrement, au sein du dossier. */
export function CeCard({ tender }: { tender: Tender }) {
  const { updateCe } = useApp();
  const ce = tender.ce;
  const ev = evaluateCe(ce);
  const Icon = ICON[ev.level];
  const needsAuth = ce.rule === "Distributeur autorisé" || ce.rule === "Usage unique";

  return (
    <div className="glass-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <BadgeCheck className="h-4 w-4 text-accent" />
            Certificat d'Enregistrement (CE)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Exigence relevée dans le RC — {ce.rcArticle}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${TONE[ev.level]}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {ev.label}
        </span>
      </div>

      <div className="clinical-rule my-4" />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Cas prévu par le règlement de consultation
          </label>
          <Select
            value={ce.rule}
            onValueChange={(v) => {
              updateCe(tender.id, { rule: v as CeRule });
              toast.success(`Exigence CE enregistrée : ${v}`);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CE_RULES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">{CE_RULE_HELP[ce.rule]}</p>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Titulaire du CE</dt>
            <dd className="text-right font-medium">{ce.holder}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">N° d'enregistrement</dt>
            <dd className="font-medium tabular-nums">{ce.number}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Position de FZANA</dt>
            <dd className="font-medium">{ce.fzanaIsHolder ? "Titulaire" : "Distributeur"}</dd>
          </div>
          {ce.rule === "Usage unique" && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">CE mobilisé par</dt>
              <dd className="font-medium">{ce.usageClaimedBy ?? "Personne (non réservé)"}</dd>
            </div>
          )}
        </dl>
      </div>

      <div
        className={`mt-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${TONE[ev.level]}`}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{ev.message}</span>
      </div>

      {ev.actions.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {ev.actions.map((a) => (
            <li key={a} className="flex gap-2 text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {a}
            </li>
          ))}
        </ul>
      )}

      {ce.rule !== "Non exigé" && (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {!ce.fzanaIsHolder && needsAuth && (
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={ce.authorization}
                onCheckedChange={(v) => {
                  updateCe(tender.id, { authorization: v });
                  toast.success(
                    v ? "Autorisation du titulaire enregistrée" : "Autorisation retirée",
                  );
                }}
              />
              Autorisation du titulaire obtenue
            </label>
          )}
          {ce.rule === "Usage unique" && (
            <>
              <Button
                size="sm"
                variant={ce.usageClaimedBy === "FZANA Systems" ? "secondary" : "default"}
                onClick={() => {
                  updateCe(tender.id, {
                    usageClaimedBy:
                      ce.usageClaimedBy === "FZANA Systems" ? null : "FZANA Systems",
                  });
                }}
              >
                {ce.usageClaimedBy === "FZANA Systems"
                  ? "Libérer le CE"
                  : "Réserver le CE pour FZANA"}
              </Button>
              {ce.usageClaimedBy !== "FZANA Systems" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateCe(tender.id, { usageClaimedBy: `${ce.holder} (titulaire)` })
                  }
                >
                  Signaler le CE déjà utilisé
                </Button>
              )}
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateCe(tender.id, { fzanaIsHolder: !ce.fzanaIsHolder })}
          >
            {ce.fzanaIsHolder ? "FZANA est distributeur" : "FZANA est titulaire"}
          </Button>
        </div>
      )}
    </div>
  );
}
