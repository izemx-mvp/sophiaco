import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Building2, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, formatMAD } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CITIES, type Supplier } from "@/lib/mock-data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_shell/fournisseurs")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — Sophiaco Control" },
      {
        name: "description",
        content:
          "Gestion des fournisseurs Sophiaco : contacts, disponibilité et références produits rattachées.",
      },
      { property: "og:title", content: "Fournisseurs — Sophiaco Control" },
      {
        property: "og:description",
        content: "Ajoutez, modifiez et supprimez les fournisseurs du catalogue médical.",
      },
    ],
  }),
  component: SuppliersPage,
});

const AVAILABILITY: Supplier["availability"][] = [
  "Disponible",
  "Stock limité",
  "Rupture partielle",
];

type Draft = Omit<Supplier, "id" | "products">;

const empty: Draft = {
  name: "",
  city: CITIES[0]!,
  contact: "",
  email: "",
  phone: "",
  availability: "Disponible",
};

function SuppliersPage() {
  const { suppliers, products, addSupplier, updateSupplier, removeSupplier } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);

  const filtered = useMemo(
    () =>
      suppliers.filter((s) =>
        `${s.name} ${s.city} ${s.contact} ${s.email}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [suppliers, q],
  );

  const statsFor = (id: string) => {
    const list = products.filter((p) => p.supplierId === id);
    return {
      count: list.length,
      value: list.reduce((a, p) => a + p.salePrice, 0),
      categories: [...new Set(list.map((p) => p.category))],
    };
  };

  const openCreate = () => {
    setEditing(null);
    setDraft(empty);
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setDraft({
      name: s.name,
      city: s.city,
      contact: s.contact,
      email: s.email,
      phone: s.phone,
      availability: s.availability,
    });
    setOpen(true);
  };

  const save = () => {
    if (!draft.name.trim()) {
      toast.error("Le nom du fournisseur est obligatoire");
      return;
    }
    if (editing) {
      updateSupplier(editing.id, draft);
      toast.success(`${draft.name} mis à jour`);
    } else {
      addSupplier({ ...draft, products: [] });
      toast.success(`${draft.name} ajouté aux fournisseurs`);
    }
    setOpen(false);
  };

  const del = (s: Supplier) => {
    if (products.some((p) => p.supplierId === s.id)) {
      toast.error(`${s.name} est rattaché à des produits du catalogue`);
      return;
    }
    removeSupplier(s.id);
    toast.success(`${s.name} supprimé`);
  };

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        subtitle="Partenaires qui approvisionnent les références du catalogue Sophiaco."
        actions={
          <Button className="btn-shine" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau fournisseur
          </Button>
        }
      />

      <div className="glass-card mb-4 p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un fournisseur, une ville, un contact…"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun fournisseur trouvé" hint="Ajustez votre recherche." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s, i) => {
            const st = statsFor(s.id);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card hover-lift flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-accent-soft p-2.5">
                      <Building2 className="h-5 w-5 text-accent" />
                    </span>
                    <div>
                      <p className="font-display font-semibold">{s.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {s.city}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                    {s.availability}
                  </span>
                </div>

                <div className="clinical-rule my-4" />

                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {s.email || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {s.phone || "—"}
                  </div>
                  <p className="text-muted-foreground">Contact : {s.contact || "—"}</p>
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-secondary/50 p-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Références</p>
                    <p className="font-medium tabular-nums">{st.count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valeur catalogue</p>
                    <p className="font-medium tabular-nums">{formatMAD(st.value)}</p>
                  </div>
                </div>
                {st.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {st.categories.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => del(s)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="s-name">Raison sociale</Label>
              <Input
                id="s-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Select value={draft.city} onValueChange={(v) => setDraft((d) => ({ ...d, city: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disponibilité</Label>
              <Select
                value={draft.availability}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, availability: v as Supplier["availability"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="s-contact">Interlocuteur</Label>
              <Input
                id="s-contact"
                value={draft.contact}
                onChange={(e) => setDraft((d) => ({ ...d, contact: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="s-mail">E-mail</Label>
              <Input
                id="s-mail"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="s-phone">Téléphone</Label>
              <Input
                id="s-phone"
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button className="btn-shine" onClick={save}>
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
