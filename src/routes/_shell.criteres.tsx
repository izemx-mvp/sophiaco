import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle2, CircleDashed, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CITIES, type Category } from "@/lib/mock-data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_shell/criteres")({
  head: () => ({
    meta: [
      { title: "Configuration des critères — Sophiaco Control" },
      {
        name: "description",
        content:
          "Définissez les critères internes de veille : catégories, zones, budget et mots-clés.",
      },
      { property: "og:title", content: "Configuration des critères — Sophiaco Control" },
      {
        property: "og:description",
        content: "Paramétrez le premier filtre de l'Agent de Veille Sophiaco.",
      },
    ],
  }),
  component: CriteriaPage,
});

function Section({
  title,
  description,
  done,
  children,
}: {
  title: string;
  description: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            done
              ? "bg-[color-mix(in_oklab,var(--success)_12%,white)] text-[var(--success)]"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {done ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <CircleDashed className="h-3.5 w-3.5" />
          )}
          {done ? "Complété" : "Incomplet"}
        </span>
      </div>
      <div className="clinical-rule my-4" />
      {children}
    </motion.section>
  );
}

function TagField({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {values.map((v) => (
          <motion.span
            key={v}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-primary"
          >
            {v}
            <button
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Retirer ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
        {values.length === 0 && (
          <span className="text-xs text-muted-foreground">Aucun élément</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              onChange([...new Set([...values, draft.trim()])]);
              setDraft("");
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!draft.trim()) return;
            onChange([...new Set([...values, draft.trim()])]);
            setDraft("");
          }}
        >
          Ajouter
        </Button>
      </div>
    </div>
  );
}

function CriteriaPage() {
  const { criteria, updateCriteria, criteriaSaved, saveCriteria, pushNotification } = useApp();
  const [uploadProgress, setUploadProgress] = useState(criteria.justificatifUploaded ? 100 : 0);

  const toggleCategory = (c: Category) =>
    updateCriteria({
      categories: criteria.categories.includes(c)
        ? criteria.categories.filter((x) => x !== c)
        : [...criteria.categories, c],
    });

  const toggleCity = (c: string) =>
    updateCriteria({
      cities: criteria.cities.includes(c)
        ? criteria.cities.filter((x) => x !== c)
        : [...criteria.cities, c],
    });

  const simulateUpload = () => {
    setUploadProgress(1);
    const t = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          return 100;
        }
        return p + 7;
      });
    }, 90);
    setTimeout(() => {
      updateCriteria({ justificatifUploaded: true });
      toast.success("Justificatif de certificat téléversé");
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Configuration des critères"
        subtitle="Premier filtre appliqué par l'Agent de Veille, avant le filtrage sectoriel et la recherche sur les portails."
      />

      {criteriaSaved ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-lg border border-[color-mix(in_oklab,var(--success)_30%,white)] bg-[color-mix(in_oklab,var(--success)_10%,white)] px-4 py-3"
        >
          <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          <p className="text-sm font-medium text-[var(--success)]">
            Configuration active ✅ — la veille automatique est débloquée.
          </p>
        </motion.div>
      ) : (
        <div className="mb-6 rounded-lg border border-[color-mix(in_oklab,var(--warning)_35%,white)] bg-[color-mix(in_oklab,var(--warning)_12%,white)] px-4 py-3 text-sm text-[color-mix(in_oklab,var(--warning)_70%,black)]">
          Configuration non validée : la veille automatique reste désactivée tant que vous
          n'enregistrez pas vos critères.
        </div>
      )}

      <div className="space-y-4">
        <Section
          title="Catégories suivies"
          description="Familles de produits à surveiller dans les avis publiés."
          done={criteria.categories.length > 0}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-accent/50 hover:bg-accent-soft/40"
              >
                <Checkbox
                  checked={criteria.categories.includes(c)}
                  onCheckedChange={() => toggleCategory(c)}
                />
                <span className="text-sm">{c}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section
          title="Zone géographique"
          description="Villes et régions du Maroc à surveiller."
          done={criteria.cities.length > 0}
        >
          <div className="flex flex-wrap gap-2">
            {CITIES.map((c) => {
              const on = criteria.cities.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCity(c)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                    on
                      ? "border-accent bg-accent-soft font-medium text-primary"
                      : "border-border text-muted-foreground hover:border-accent/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Section>

        <Section
          title="Budget cible"
          description="Fourchette de montants à considérer (en MAD)."
          done={criteria.budgetMax > criteria.budgetMin}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bmin">Montant minimum</Label>
              <Input
                id="bmin"
                type="number"
                value={criteria.budgetMin}
                onChange={(e) => updateCriteria({ budgetMin: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmax">Montant maximum</Label>
              <Input
                id="bmax"
                type="number"
                value={criteria.budgetMax}
                onChange={(e) => updateCriteria({ budgetMax: Number(e.target.value) })}
              />
            </div>
          </div>
        </Section>

        <Section
          title="Mots-clés"
          description="Termes à inclure ou exclure lors de l'analyse des avis."
          done={criteria.includeKeywords.length > 0}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label className="mb-2 block">À inclure</Label>
              <TagField
                values={criteria.includeKeywords}
                onChange={(v) => updateCriteria({ includeKeywords: v })}
                placeholder="ex. moniteur multiparamétrique"
              />
            </div>
            <div>
              <Label className="mb-2 block">À exclure</Label>
              <TagField
                values={criteria.excludeKeywords}
                onChange={(v) => updateCriteria({ excludeKeywords: v })}
                placeholder="ex. travaux"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Certificat détenu"
          description="Statut du certificat d'enregistrement de matériel médical mobilisable."
          done={criteria.justificatifUploaded}
        >
          <div className="space-y-3">
            {[
              { key: "fzana", label: "Certificat Sophiaco (en cours de renouvellement)" },
              { key: "partenaire", label: "Certificat d'un partenaire avec autorisation" },
            ].map((o) => (
              <label
                key={o.key}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  criteria.certificate === o.key
                    ? "border-accent bg-accent-soft/50"
                    : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="cert"
                  className="accent-[var(--accent)]"
                  checked={criteria.certificate === o.key}
                  onChange={() => updateCriteria({ certificate: o.key as "fzana" | "partenaire" })}
                />
                <span className="text-sm">{o.label}</span>
              </label>
            ))}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={simulateUpload}>
                <Upload className="mr-2 h-4 w-4" /> Téléverser le justificatif
              </Button>
              {uploadProgress > 0 && (
                <div className="flex flex-1 items-center gap-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {Math.min(100, uploadProgress)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section
          title="Portails surveillés & fréquence"
          description="Sources de veille et rythme d'exécution de l'agent."
          done={criteria.portals.length > 0}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {["marchespublics.gov.ma", "portail-sante.gov.ma", "appels-offres-prives.ma"].map(
                (p) => (
                  <label
                    key={p}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <Checkbox
                      checked={criteria.portals.includes(p)}
                      onCheckedChange={() =>
                        updateCriteria({
                          portals: criteria.portals.includes(p)
                            ? criteria.portals.filter((x) => x !== p)
                            : [...criteria.portals, p],
                        })
                      }
                    />
                    <span className="text-sm">{p}</span>
                  </label>
                ),
              )}
            </div>
            <div className="space-y-2">
              <Label>Fréquence de la veille automatique</Label>
              <Select
                value={criteria.frequency}
                onValueChange={(v) => updateCriteria({ frequency: v as typeof criteria.frequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Toutes les heures", "Quotidienne", "Manuelle"].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>
      </div>

      <div className="sticky bottom-4 mt-6 flex justify-end">
        <Button
          size="lg"
          onClick={() => {
            saveCriteria();
            pushNotification("Critères de veille enregistrés — veille automatique activée");
            toast.success("Configuration enregistrée — la veille est active");
          }}
        >
          Enregistrer la configuration
        </Button>
      </div>
    </div>
  );
}
