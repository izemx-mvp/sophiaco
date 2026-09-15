import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, formatMAD } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, margin, type Category, type Product } from "@/lib/mock-data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_shell/catalogue")({
  head: () => ({
    meta: [
      { title: "Catalogue produits & prix — Sophiaco Control" },
      {
        name: "description",
        content:
          "Gestion complète du catalogue Sophiaco : références, fournisseurs, prix d'achat, prix de vente et marges.",
      },
      { property: "og:title", content: "Catalogue produits & prix — Sophiaco Control" },
      {
        property: "og:description",
        content: "Ajoutez, modifiez et supprimez les références du catalogue médical Sophiaco.",
      },
    ],
  }),
  component: CataloguePage,
});

type Draft = {
  name: string;
  reference: string;
  category: Category;
  supplierId: string;
  purchasePrice: string;
  salePrice: string;
  specs: string;
};

const emptyDraft = (supplierId: string): Draft => ({
  name: "",
  reference: "",
  category: CATEGORIES[0]!,
  supplierId,
  purchasePrice: "",
  salePrice: "",
  specs: "",
});

function CataloguePage() {
  const { products, suppliers, addProduct, updateProduct, removeProduct } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sup, setSup] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft(suppliers[0]?.id ?? ""));

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const text = `${p.name} ${p.reference} ${p.supplier} ${p.category}`.toLowerCase();
        if (q && !text.includes(q.toLowerCase())) return false;
        if (cat !== "all" && p.category !== cat) return false;
        if (sup !== "all" && p.supplierId !== sup) return false;
        return true;
      }),
    [products, q, cat, sup],
  );

  const totalValue = filtered.reduce((a, p) => a + p.salePrice, 0);
  const avgMargin = filtered.length
    ? Math.round(filtered.reduce((a, p) => a + margin(p), 0) / filtered.length)
    : 0;

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft(suppliers[0]?.id ?? ""));
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setDraft({
      name: p.name,
      reference: p.reference,
      category: p.category,
      supplierId: p.supplierId,
      purchasePrice: String(p.purchasePrice),
      salePrice: String(p.salePrice),
      specs: p.specs.join("\n"),
    });
    setOpen(true);
  };

  const save = () => {
    if (!draft.name.trim() || !draft.reference.trim()) {
      toast.error("La désignation et la référence sont obligatoires");
      return;
    }
    const payload = {
      name: draft.name.trim(),
      reference: draft.reference.trim(),
      category: draft.category,
      supplierId: draft.supplierId,
      supplier: suppliers.find((s) => s.id === draft.supplierId)?.name ?? "",
      purchasePrice: Number(draft.purchasePrice) || 0,
      salePrice: Number(draft.salePrice) || 0,
      specs: draft.specs
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (editing) {
      updateProduct(editing.id, payload);
      toast.success(`${payload.name} mis à jour`);
    } else {
      addProduct(payload);
      toast.success(`${payload.name} ajouté au catalogue`);
    }
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Catalogue produits"
        subtitle="Références, fournisseurs, prix d'achat, prix de vente et marges du catalogue Sophiaco."
        actions={
          <Button className="btn-shine" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau produit
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Références affichées", value: String(filtered.length) },
          { label: "Valeur catalogue (prix de vente)", value: formatMAD(totalValue) },
          { label: "Marge moyenne", value: `${avgMargin} %` },
        ].map((k) => (
          <div key={k.label} className="glass-card px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className="font-display text-xl font-semibold tabular-nums">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card mb-4 grid gap-3 p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une référence, un produit…"
            className="pl-9"
          />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger>
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sup} onValueChange={setSup}>
          <SelectTrigger>
            <SelectValue placeholder="Fournisseur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les fournisseurs</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun produit ne correspond"
          hint="Modifiez votre recherche ou ajoutez une nouvelle référence."
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Désignation</th>
                  <th className="px-4 py-3 text-left">Catégorie</th>
                  <th className="px-4 py-3 text-left">Fournisseur</th>
                  <th className="px-4 py-3 text-right">Prix d'achat</th>
                  <th className="px-4 py-3 text-right">Prix de vente</th>
                  <th className="px-4 py-3 text-right">Marge</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 12) * 0.02 }}
                    className="border-b border-border/60 last:border-0 hover:bg-secondary/50"
                  >
                    <td className="px-4 py-3 font-medium">{p.reference}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.supplier}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.purchasePrice.toLocaleString("fr-MA")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.salePrice.toLocaleString("fr-MA")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent tabular-nums">
                        {margin(p)} %
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            removeProduct(p.id);
                            toast.success(`${p.name} supprimé du catalogue`);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="scroll-brand max-h-[88vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Modifier le produit" : "Nouveau produit"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="p-name">Désignation</Label>
              <Input
                id="p-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Moniteur multiparamétrique MP-12"
              />
            </div>
            <div>
              <Label htmlFor="p-ref">Référence</Label>
              <Input
                id="p-ref"
                value={draft.reference}
                onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
                placeholder="FZ-MP12"
              />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft((d) => ({ ...d, category: v as Category }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Fournisseur</Label>
              <Select
                value={draft.supplierId}
                onValueChange={(v) => setDraft((d) => ({ ...d, supplierId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="p-buy">Prix d'achat (MAD HT)</Label>
              <Input
                id="p-buy"
                type="number"
                value={draft.purchasePrice}
                onChange={(e) => setDraft((d) => ({ ...d, purchasePrice: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="p-sell">Prix de vente (MAD HT)</Label>
              <Input
                id="p-sell"
                type="number"
                value={draft.salePrice}
                onChange={(e) => setDraft((d) => ({ ...d, salePrice: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-specs">Fiche technique (une ligne par spécification)</Label>
              <Textarea
                id="p-specs"
                rows={4}
                value={draft.specs}
                onChange={(e) => setDraft((d) => ({ ...d, specs: e.target.value }))}
                placeholder={"Marquage CE / ISO 13485\nÉcran tactile 12,1\""}
              />
            </div>
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              Marge calculée :{" "}
              <strong className="text-foreground">
                {margin({
                  purchasePrice: Number(draft.purchasePrice) || 0,
                  salePrice: Number(draft.salePrice) || 0,
                })}{" "}
                %
              </strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button className="btn-shine" onClick={save}>
              {editing ? "Enregistrer" : "Ajouter au catalogue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
