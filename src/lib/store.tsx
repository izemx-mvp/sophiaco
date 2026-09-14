import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  CATEGORIES,
  DOC_TYPES,
  PRODUCTS,
  SUPPLIERS,
  TENDERS,
  generateDiscoveredTender,
  type Category,
  type CeInfo,
  type DocType,
  type GeneratedDoc,
  type PieceStatus,
  type Product,
  type Supplier,
  type Tender,
  type TenderStatus,
} from "./mock-data";

export type Criteria = {
  categories: Category[];
  cities: string[];
  budgetMin: number;
  budgetMax: number;
  includeKeywords: string[];
  excludeKeywords: string[];
  certificate: "fzana" | "partenaire";
  justificatifUploaded: boolean;
  portals: string[];
  frequency: "Toutes les heures" | "Quotidienne" | "Manuelle";
};

const defaultCriteria: Criteria = {
  categories: [...CATEGORIES],
  cities: ["Casablanca", "Rabat", "Marrakech"],
  budgetMin: 100000,
  budgetMax: 6000000,
  includeKeywords: ["équipement médical", "bloc opératoire"],
  excludeKeywords: ["travaux", "génie civil"],
  certificate: "partenaire",
  justificatifUploaded: false,
  portals: ["marchespublics.gov.ma"],
  frequency: "Quotidienne",
};

export type Agent = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  lastRun: string;
  actionsToday: number;
};

type Ctx = {
  loggedIn: boolean;
  login: () => void;
  logout: () => void;

  criteria: Criteria;
  updateCriteria: (patch: Partial<Criteria>) => void;
  criteriaSaved: boolean;
  saveCriteria: () => void;

  tenders: Tender[];
  visibleTenders: Tender[];
  getTender: (id: string) => Tender | undefined;
  advanceStage: (id: string) => void;
  setResult: (id: string, result: "Gagné" | "Perdu") => void;
  runAnalysis: (id: string) => void;
  runVeille: () => Tender[];
  setPieceStatus: (tenderId: string, pieceId: string, status: PieceStatus) => void;
  updateCe: (tenderId: string, patch: Partial<CeInfo>) => void;

  products: Product[];
  getProduct: (id: string) => Product | undefined;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;

  suppliers: Supplier[];
  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  removeSupplier: (id: string) => void;

  docs: GeneratedDoc[];
  setDocStatus: (id: string, status: GeneratedDoc["status"]) => void;

  agents: Agent[];
  toggleAgent: (id: string) => void;
  markAgentRun: (id: string, actions: number) => void;

  notifications: { id: string; label: string; at: string }[];
  pushNotification: (label: string) => void;
};

const AppContext = createContext<Ctx | null>(null);

function statusFor(stage: number, t: Tender, result?: "Gagné" | "Perdu"): TenderStatus {
  if (stage >= 6) return result ?? t.result ?? "Gagné";
  if (stage === 5) return "Soumis";
  if (stage >= 3)
    return t.requirements.some((r) => r.conformity === "Non conforme")
      ? "Non conforme"
      : "Conforme";
  if (stage === 2) return "En analyse";
  return "Nouveau";
}

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const stageLabels: Record<number, string> = {
  2: "Fiche de synthèse générée par l'Agent Veille & Analyse",
  3: "Matching technique terminé par l'Agent Matching",
  4: "4 documents générés automatiquement",
  5: "Dossier soumis sur le portail des marchés publics",
  6: "Résultat enregistré",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [criteria, setCriteria] = useState<Criteria>(defaultCriteria);
  const [criteriaSaved, setCriteriaSaved] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>(TENDERS);
  const [docStatuses, setDocStatuses] = useState<Record<string, GeneratedDoc["status"]>>({});
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);
  const [notifications, setNotifications] = useState([
    { id: "n1", label: "Agent Veille a identifié 3 nouveaux appels d'offres", at: "il y a 12 min" },
    { id: "n2", label: "Certificat FZANA : renouvellement à suivre", at: "il y a 2 h" },
    {
      id: "n3",
      label: "Agent Matching a terminé l'analyse du dossier CHU-2026-0142",
      at: "il y a 3 h",
    },
  ]);
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "veille",
      name: "Agent Veille & Analyse des Appels d'Offres",
      description:
        "Surveille marchespublics.gov.ma, applique vos critères internes, extrait les exigences et génère les fiches de synthèse.",
      active: true,
      lastRun: "Aujourd'hui à 08:42",
      actionsToday: 47,
    },
    {
      id: "matching",
      name: "Agent Matching Technique & Catalogue",
      description:
        "Apparie chaque ligne du cahier des charges au catalogue FZANA, calcule les scores de conformité et vérifie les certificats.",
      active: true,
      lastRun: "Aujourd'hui à 09:15",
      actionsToday: 128,
    },
  ]);

  const pushNotification = useCallback((label: string) => {
    setNotifications((n) =>
      [{ id: crypto.randomUUID(), label, at: "à l'instant" }, ...n].slice(0, 8),
    );
  }, []);

  const updateCriteria = useCallback((patch: Partial<Criteria>) => {
    setCriteria((c) => ({ ...c, ...patch }));
    setCriteriaSaved(false);
  }, []);

  const saveCriteria = useCallback(() => setCriteriaSaved(true), []);

  const advanceStage = useCallback((id: string) => {
    setTenders((list) =>
      list.map((t) => {
        if (t.id !== id || t.stage >= 6) return t;
        const stage = t.stage + 1;
        return {
          ...t,
          stage,
          status: statusFor(stage, t),
          history: [
            ...t.history,
            { at: nowStamp(), label: stageLabels[stage] ?? "Étape franchie" },
          ],
        };
      }),
    );
  }, []);

  const setResult = useCallback((id: string, result: "Gagné" | "Perdu") => {
    setTenders((list) =>
      list.map((t) =>
        t.id === id
          ? {
              ...t,
              stage: 6,
              result,
              status: result,
              history: [...t.history, { at: nowStamp(), label: `Résultat enregistré : ${result}` }],
            }
          : t,
      ),
    );
  }, []);

  const runAnalysis = useCallback((id: string) => {
    setTenders((list) =>
      list.map((t) =>
        t.id === id && t.stage < 2
          ? {
              ...t,
              stage: 2,
              status: statusFor(2, t),
              history: [...t.history, { at: nowStamp(), label: stageLabels[2]! }],
            }
          : t,
      ),
    );
  }, []);

  const runVeille = useCallback(() => {
    const found: Tender[] = [];
    const refs = tenders.map((t) => t.ref);
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      found.push(
        generateDiscoveredTender({
          categories: criteria.categories,
          cities: criteria.cities,
          budgetMin: criteria.budgetMin,
          budgetMax: criteria.budgetMax,
          existingRefs: [...refs, ...found.map((f) => f.ref)],
        }),
      );
    }
    setTenders((list) => [...found, ...list]);
    return found;
  }, [criteria, tenders]);

  const setPieceStatus = useCallback(
    (tenderId: string, pieceId: string, status: PieceStatus) => {
      setTenders((list) =>
        list.map((t) =>
          t.id === tenderId
            ? { ...t, pieces: t.pieces.map((p) => (p.id === pieceId ? { ...p, status } : p)) }
            : t,
        ),
      );
    },
    [],
  );

  /** Met à jour l'exigence « Certificat d'Enregistrement » d'un dossier. */
  const updateCe = useCallback((tenderId: string, patch: Partial<CeInfo>) => {
    setTenders((list) =>
      list.map((t) => {
        if (t.id !== tenderId) return t;
        const ce = { ...t.ce, ...patch };
        if (patch.rule && patch.rule !== "Usage unique") ce.usageClaimedBy = null;
        const needsAuth = ce.rule === "Distributeur autorisé" || ce.rule === "Usage unique";
        const authId = `${t.id}-P-CE`;
        let pieces = t.pieces;
        if (needsAuth && !pieces.some((p) => p.id === authId)) {
          pieces = [
            ...pieces,
            {
              id: authId,
              name: "Autorisation d'utilisation du certificat d'enregistrement (CE)",
              category: "Dossier technique" as const,
              mandatory: true,
              note: "Autorisation écrite délivrée par le titulaire du CE au distributeur soumissionnaire.",
              status: ce.authorization ? ("Fournie" as PieceStatus) : ("À produire" as PieceStatus),
            },
          ];
        } else if (!needsAuth) {
          pieces = pieces.filter((p) => p.id !== authId);
        } else if (patch.authorization !== undefined) {
          pieces = pieces.map((p) =>
            p.id === authId
              ? { ...p, status: patch.authorization ? "Fournie" : ("À produire" as PieceStatus) }
              : p,
          );
        }
        const label = patch.rule
          ? `Exigence CE mise à jour depuis le RC : ${patch.rule}`
          : patch.usageClaimedBy !== undefined
            ? patch.usageClaimedBy
              ? `Certificat d'enregistrement réservé pour ${patch.usageClaimedBy}`
              : "Réservation du certificat d'enregistrement levée"
            : patch.authorization !== undefined
              ? patch.authorization
                ? "Autorisation du titulaire du CE enregistrée"
                : "Autorisation du titulaire du CE retirée"
              : "Informations CE mises à jour";
        return { ...t, ce, pieces, history: [...t.history, { at: nowStamp(), label }] };
      }),
    );
  }, []);


  const visibleTenders = useMemo(() => {
    if (!criteriaSaved) return tenders;
    return tenders.filter(
      (t) =>
        criteria.categories.includes(t.category) &&
        t.budget >= criteria.budgetMin &&
        t.budget <= criteria.budgetMax,
    );
  }, [tenders, criteria, criteriaSaved]);

  const docs = useMemo<GeneratedDoc[]>(() => {
    const out: GeneratedDoc[] = [];
    for (const t of tenders) {
      if (t.stage < 4) continue;
      for (const type of DOC_TYPES) {
        const id = `${t.id}--${type}`;
        out.push({
          id,
          tenderId: t.id,
          type: type as DocType,
          status: docStatuses[id] ?? (t.stage >= 5 ? "Soumis" : "Finalisé"),
          createdAt: t.history.find((h) => h.label.includes("documents"))?.at ?? nowStamp(),
        });
      }
    }
    return out;
  }, [tenders, docStatuses]);

  const value: Ctx = {
    loggedIn,
    login: () => setLoggedIn(true),
    logout: () => setLoggedIn(false),
    criteria,
    updateCriteria,
    criteriaSaved,
    saveCriteria,
    tenders,
    visibleTenders,
    getTender: (id) => tenders.find((t) => t.id === id),
    advanceStage,
    setResult,
    runAnalysis,
    runVeille,
    setPieceStatus,
    updateCe,
    products,
    getProduct: (id) => products.find((p) => p.id === id),
    addProduct: (p) =>
      setProducts((list) => [
        {
          ...p,
          id: `p-${Math.random().toString(36).slice(2, 8)}`,
          supplier: suppliers.find((s) => s.id === p.supplierId)?.name ?? p.supplier,
        },
        ...list,
      ]),
    updateProduct: (id, patch) =>
      setProducts((list) =>
        list.map((p) =>
          p.id === id
            ? {
                ...p,
                ...patch,
                supplier:
                  suppliers.find((s) => s.id === (patch.supplierId ?? p.supplierId))?.name ??
                  p.supplier,
              }
            : p,
        ),
      ),
    removeProduct: (id) => setProducts((list) => list.filter((p) => p.id !== id)),
    suppliers,
    addSupplier: (s) =>
      setSuppliers((list) => [{ ...s, id: `s-${Math.random().toString(36).slice(2, 8)}` }, ...list]),
    updateSupplier: (id, patch) => {
      setSuppliers((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
      if (patch.name)
        setProducts((list) =>
          list.map((p) => (p.supplierId === id ? { ...p, supplier: patch.name! } : p)),
        );
    },
    removeSupplier: (id) => setSuppliers((list) => list.filter((s) => s.id !== id)),
    docs,
    setDocStatus: (id, status) => setDocStatuses((s) => ({ ...s, [id]: status })),
    agents,
    toggleAgent: (id) =>
      setAgents((a) => a.map((x) => (x.id === id ? { ...x, active: !x.active } : x))),
    markAgentRun: (id, actions) =>
      setAgents((a) =>
        a.map((x) =>
          x.id === id ? { ...x, lastRun: nowStamp(), actionsToday: x.actionsToday + actions } : x,
        ),
      ),
    notifications,
    pushNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
