export type Category =
  | "Bloc opératoire"
  | "Diagnostic"
  | "Mobilier médical"
  | "Réanimation"
  | "Consommables"
  | "Stérilisation";

export const CATEGORIES: Category[] = [
  "Bloc opératoire",
  "Diagnostic",
  "Mobilier médical",
  "Réanimation",
  "Consommables",
  "Stérilisation",
];

export const CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fès",
  "Tanger",
  "Agadir",
  "Oujda",
  "Meknès",
];

export type Conformity = "Conforme" | "À vérifier" | "Non conforme";

export type TenderStatus =
  "Nouveau" | "En analyse" | "Conforme" | "Non conforme" | "Soumis" | "Gagné" | "Perdu";

export const STAGES = [
  "Identifié",
  "Analysé",
  "Matching produits",
  "Documents générés",
  "Soumis",
  "Résultat",
] as const;

export type Product = {
  id: string;
  name: string;
  category: Category;
  /** Nom du fournisseur (dénormalisé pour l'affichage). */
  supplier: string;
  supplierId: string;
  specs: string[];
  reference: string;
  /** Prix d'achat fournisseur, en MAD HT. */
  purchasePrice: number;
  /** Prix de vente catalogue Sophiaco, en MAD HT. */
  salePrice: number;
};

export type Supplier = {
  id: string;
  name: string;
  city: string;
  contact: string;
  email: string;
  phone: string;
  availability: "Disponible" | "Stock limité" | "Rupture partielle";
  products: string[];
};

export const margin = (p: { purchasePrice: number; salePrice: number }) =>
  p.salePrice > 0 ? Math.round(((p.salePrice - p.purchasePrice) / p.salePrice) * 100) : 0;

export type Requirement = {
  id: string;
  article: string;
  qty: number;
  specs: string;
  conformity: Conformity;
  productId: string;
  score: number;
};

export type DocType =
  | "Mémoire technique"
  | "Document descriptif technique"
  | "Bordereau des prix"
  | "Acte d'engagement";

export const DOC_TYPES: DocType[] = [
  "Mémoire technique",
  "Document descriptif technique",
  "Bordereau des prix",
  "Acte d'engagement",
];

export type GeneratedDoc = {
  id: string;
  tenderId: string;
  type: DocType;
  status: "Brouillon" | "Finalisé" | "Soumis";
  createdAt: string;
};

export type HistoryEntry = { at: string; label: string };

/** Pièce du dossier de soumission exigée par le règlement de consultation. */
export type PieceCategory = "Dossier administratif" | "Dossier technique" | "Dossier additif";

export type PieceStatus = "Fournie" | "À produire" | "Manquante";

export type DossierPiece = {
  id: string;
  name: string;
  category: PieceCategory;
  mandatory: boolean;
  status: PieceStatus;
  note: string;
};

/* ------------------------------------------------------------------ */
/* Certificat d'Enregistrement (CE) — exigence à vérifier dans le RC   */
/* ------------------------------------------------------------------ */

export type CeRule =
  | "Titulaire uniquement"
  | "Distributeur autorisé"
  | "Usage unique"
  | "Non exigé";

export const CE_RULES: CeRule[] = [
  "Titulaire uniquement",
  "Distributeur autorisé",
  "Usage unique",
  "Non exigé",
];

export const CE_RULE_HELP: Record<CeRule, string> = {
  "Titulaire uniquement":
    "Seul le titulaire du certificat d'enregistrement peut soumissionner. Un distributeur ne peut pas participer, même muni d'une autorisation.",
  "Distributeur autorisé":
    "Les distributeurs peuvent soumissionner à condition de joindre une autorisation délivrée par le titulaire du CE.",
  "Usage unique":
    "Le CE ne peut être mobilisé que pour une seule offre : soit par le titulaire, soit par un seul distributeur — jamais les deux.",
  "Non exigé": "Le règlement de consultation n'exige pas de certificat d'enregistrement.",
};

export type CeInfo = {
  /** Cas retenu après lecture du règlement de consultation. */
  rule: CeRule;
  /** Article du RC où l'exigence a été relevée. */
  rcArticle: string;
  /** Titulaire du certificat d'enregistrement. */
  holder: string;
  /** Numéro d'enregistrement DMP. */
  number: string;
  /** Sophiaco est-elle titulaire du CE mobilisé ? */
  fzanaIsHolder: boolean;
  /** Autorisation écrite du titulaire obtenue et signée. */
  authorization: boolean;
  /** Pour le cas « Usage unique » : qui a mobilisé le CE (null = non réservé). */
  usageClaimedBy: string | null;
};

export type CeEvaluation = {
  level: "ok" | "warn" | "blocked";
  label: string;
  message: string;
  actions: string[];
};

/** Évalue l'éligibilité de Sophiaco au regard de l'exigence CE du dossier. */
export function evaluateCe(ce: CeInfo): CeEvaluation {
  if (ce.rule === "Non exigé")
    return {
      level: "ok",
      label: "CE non exigé",
      message: "Le règlement de consultation n'impose pas de certificat d'enregistrement.",
      actions: [],
    };

  if (ce.rule === "Titulaire uniquement") {
    return ce.fzanaIsHolder
      ? {
          level: "ok",
          label: "Éligible — titulaire",
          message: `Sophiaco est titulaire du CE n° ${ce.number} : la soumission est recevable.`,
          actions: ["Joindre la copie du certificat d'enregistrement au dossier technique."],
        }
      : {
          level: "blocked",
          label: "Soumission impossible",
          message: `Le RC réserve la soumission au titulaire du CE (${ce.holder}). En tant que distributeur, Sophiaco ne peut pas participer, même avec une autorisation.`,
          actions: [
            "Écarter le dossier ou proposer une gamme dont Sophiaco est titulaire du CE.",
            "Vérifier si un additif au CPS assouplit l'exigence.",
          ],
        };
  }

  if (ce.rule === "Distributeur autorisé") {
    if (ce.fzanaIsHolder)
      return {
        level: "ok",
        label: "Éligible — titulaire",
        message: `Sophiaco est titulaire du CE n° ${ce.number} : aucune autorisation tierce n'est nécessaire.`,
        actions: [],
      };
    return ce.authorization
      ? {
          level: "ok",
          label: "Éligible — autorisation en place",
          message: `Autorisation du titulaire ${ce.holder} obtenue : Sophiaco peut soumissionner en tant que distributeur.`,
          actions: ["Joindre l'autorisation signée du titulaire au dossier technique."],
        }
      : {
          level: "warn",
          label: "Autorisation à obtenir",
          message: `Sophiaco est distributeur : une autorisation écrite de ${ce.holder} est obligatoire avant le dépôt.`,
          actions: [
            `Demander l'autorisation d'utilisation du CE n° ${ce.number} à ${ce.holder}.`,
            "Ajouter la pièce « Autorisation du titulaire du CE » au dossier.",
          ],
        };
  }

  // Usage unique
  const me = "Sophiaco";
  if (ce.usageClaimedBy && ce.usageClaimedBy !== me)
    return {
      level: "blocked",
      label: "CE déjà mobilisé",
      message: `Le CE n° ${ce.number} est déjà engagé sur ce marché par ${ce.usageClaimedBy}. Il ne peut servir qu'une seule fois : Sophiaco ne peut pas l'utiliser.`,
      actions: [
        "Chercher un CE alternatif (autre titulaire / autre gamme).",
        "Confirmer auprès du titulaire qu'aucune autre offre ne s'appuie sur ce CE.",
      ],
    };
  if (!ce.usageClaimedBy)
    return {
      level: "warn",
      label: "Usage unique — CE à réserver",
      message: `Le CE n° ${ce.number} n'est pas encore réservé pour ce marché. Il ne peut être utilisé que par une seule offre : sécurisez son exclusivité avant le dépôt.`,
      actions: [
        `Obtenir de ${ce.holder} la confirmation écrite d'exclusivité pour ce marché.`,
        "Réserver le CE pour Sophiaco dans le dossier.",
      ],
    };
  return {
    level: ce.fzanaIsHolder || ce.authorization ? "ok" : "warn",
    label:
      ce.fzanaIsHolder || ce.authorization
        ? "Éligible — CE réservé à Sophiaco"
        : "CE réservé — autorisation manquante",
    message:
      ce.fzanaIsHolder || ce.authorization
        ? `Le CE n° ${ce.number} est mobilisé exclusivement par Sophiaco pour ce marché.`
        : `Le CE n° ${ce.number} est réservé à Sophiaco, mais l'autorisation écrite de ${ce.holder} manque encore.`,
    actions:
      ce.fzanaIsHolder || ce.authorization
        ? ["Joindre l'attestation d'exclusivité au dossier technique."]
        : [`Obtenir l'autorisation signée de ${ce.holder}.`],
  };
}


export type Tender = {
  id: string;
  ref: string;
  /** Objet du marché tel que publié sur le portail. */
  objet: string;
  procedure: string;
  client: string;
  city: string;
  category: Category;
  budget: number;
  /** Caution provisoire exigée, en MAD. */
  caution: number;
  deadline: string;
  status: TenderStatus;
  stage: number; // 1..6
  requirements: Requirement[];
  pieces: DossierPiece[];
  /** Exigence « Certificat d'Enregistrement » relevée dans le RC. */
  ce: CeInfo;
  summary: string[];
  history: HistoryEntry[];
  result?: "Gagné" | "Perdu" | undefined;
};

/** Pièces exigées par le décret n° 2-22-431 relatif aux marchés publics. */
export const PIECES_MODEL: Array<Omit<DossierPiece, "id" | "status">> = [
  {
    name: "Déclaration sur l'honneur (modèle réglementaire)",
    category: "Dossier administratif",
    mandatory: true,
    note: "Signée et datée par la personne habilitée à engager la société.",
  },
  {
    name: "Copie du registre de commerce (modèle J)",
    category: "Dossier administratif",
    mandatory: true,
    note: "Certificat d'immatriculation de moins de trois mois.",
  },
  {
    name: "Attestation de régularité fiscale",
    category: "Dossier administratif",
    mandatory: true,
    note: "Délivrée par la DGI, de moins de six mois.",
  },
  {
    name: "Attestation CNSS",
    category: "Dossier administratif",
    mandatory: true,
    note: "Affiliation et régularité des cotisations.",
  },
  {
    name: "Caution provisoire (attestation de caution bancaire)",
    category: "Dossier administratif",
    mandatory: true,
    note: "Montant fixé par le règlement de consultation.",
  },
  {
    name: "Statuts de la société et pouvoirs du signataire",
    category: "Dossier administratif",
    mandatory: true,
    note: "Statuts à jour et procuration éventuelle.",
  },
  {
    name: "Note de présentation de l'entreprise",
    category: "Dossier technique",
    mandatory: true,
    note: "Moyens, organisation et expérience de Sophiaco.",
  },
  {
    name: "Moyens humains et matériels",
    category: "Dossier technique",
    mandatory: true,
    note: "Ingénieurs biomédicaux, techniciens SAV, atelier et véhicules.",
  },
  {
    name: "Attestations de références (marchés similaires)",
    category: "Dossier technique",
    mandatory: true,
    note: "Attestations de bonne exécution signées par les maîtres d'ouvrage.",
  },
  {
    name: "Prospectus et fiches techniques du fabricant",
    category: "Dossier technique",
    mandatory: true,
    note: "Documentation d'origine pour chaque article du bordereau.",
  },
  {
    name: "Certificat de marquage CE et déclaration de conformité",
    category: "Dossier technique",
    mandatory: true,
    note: "Pour chaque dispositif médical proposé.",
  },
  {
    name: "Certificat ISO 13485 du fabricant",
    category: "Dossier technique",
    mandatory: true,
    note: "Système de management de la qualité des dispositifs médicaux.",
  },
  {
    name: "Enregistrement DMP (Direction du Médicament et de la Pharmacie)",
    category: "Dossier technique",
    mandatory: true,
    note: "Autorisation d'importation et de distribution des dispositifs médicaux.",
  },
  {
    name: "Engagement de garantie, SAV, pièces de rechange et formation",
    category: "Dossier technique",
    mandatory: true,
    note: "Garantie 24 mois, délai d'intervention et formation des utilisateurs.",
  },
  {
    name: "Bordereau des prix — détail estimatif",
    category: "Dossier technique",
    mandatory: true,
    note: "Décomposition du montant global par lot et par article.",
  },
  {
    name: "Additif au CPS — accusé de réception signé",
    category: "Dossier additif",
    mandatory: false,
    note: "À joindre uniquement si un additif est publié avant la date limite.",
  },
];

/** Construit les pièces d'un dossier selon son avancement. */
export function buildPieces(ref: string, stage: number, ceRule?: CeRule): DossierPiece[] {
  const pieces = PIECES_MODEL.map((p, i) => {
    let status: PieceStatus = "À produire";
    if (stage >= 4) status = p.mandatory ? "Fournie" : "À produire";
    else if (stage >= 2) status = i % 3 === 2 ? "À produire" : "Fournie";
    else if (i < 3) status = "Fournie";
    if (stage < 4 && p.mandatory && i === 12 && stage >= 2) status = "Manquante";
    return { ...p, id: `${ref}-P${i + 1}`, status };
  });
  if (ceRule === "Distributeur autorisé" || ceRule === "Usage unique") {
    pieces.push({
      id: `${ref}-P-CE`,
      name: "Autorisation d'utilisation du certificat d'enregistrement (CE)",
      category: "Dossier technique",
      mandatory: true,
      note:
        ceRule === "Usage unique"
          ? "Autorisation exclusive du titulaire : le CE ne peut être mobilisé que par une seule offre."
          : "Autorisation écrite délivrée par le titulaire du CE au distributeur soumissionnaire.",
      status: stage >= 4 ? "Fournie" : "À produire",
    });
  }
  return pieces;
}


type RawProduct = Omit<Product, "supplierId" | "purchasePrice" | "salePrice">;

const RAW_PRODUCTS: RawProduct[] = [
  {
    id: "p1",
    name: "Aspirateur chirurgical électrique AS-900",
    category: "Bloc opératoire",
    supplier: "MedTech Maghreb",
    reference: "FZ-AS900",
    specs: [
      "Débit 60 L/min",
      "Bocal 2 x 4 L autoclavable",
      "Niveau sonore < 55 dB",
      "Marquage CE / ISO 13485",
    ],
  },
  {
    id: "p2",
    name: "Table d'opération électrique TO-Elite",
    category: "Bloc opératoire",
    supplier: "Atlas Medical Supply",
    reference: "FZ-TOE1",
    specs: [
      "Charge max 250 kg",
      "Commande filaire + pédale",
      "Plateau radio-transparent",
      "Trendelenburg ±30°",
    ],
  },
  {
    id: "p3",
    name: "Éclairage chirurgical LED Lumia 5",
    category: "Bloc opératoire",
    supplier: "MedTech Maghreb",
    reference: "FZ-LUM5",
    specs: ["160 000 lux à 1 m", "IRC 96", "Température 3800–5000 K", "Bras double coupole"],
  },
  {
    id: "p4",
    name: "Moniteur multiparamétrique MP-12",
    category: "Diagnostic",
    supplier: "Sanitas Distribution",
    reference: "FZ-MP12",
    specs: [
      "ECG 12 dérivations",
      "SpO2, PNI, T°, CO2",
      'Écran tactile 12,1"',
      "Autonomie batterie 5 h",
    ],
  },
  {
    id: "p5",
    name: "Lit médicalisé électrique 4 sections",
    category: "Mobilier médical",
    supplier: "Atlas Medical Supply",
    reference: "FZ-LM4S",
    specs: [
      "Hauteur variable 40–80 cm",
      "Barrières rabattables ABS",
      "Freins centralisés",
      "Charge 220 kg",
    ],
  },
  {
    id: "p6",
    name: "Stérilisateur autoclave 90 L",
    category: "Stérilisation",
    supplier: "Cleanmed Industrie",
    reference: "FZ-AUT90",
    specs: ["Vide fractionné classe B", "Cycle 134 °C / 18 min", "Imprimante intégrée", "EN 13060"],
  },
  {
    id: "p7",
    name: "Respirateur de réanimation RV-Pro",
    category: "Réanimation",
    supplier: "Sanitas Distribution",
    reference: "FZ-RVPRO",
    specs: ["Modes VC, PC, VNI, AI", "Turbine autonome 4 h", 'Écran 15"', "Compensation de fuites"],
  },
  {
    id: "p8",
    name: "Échographe portable Echo-Vision 7",
    category: "Diagnostic",
    supplier: "Sanitas Distribution",
    reference: "FZ-EV7",
    specs: [
      "3 sondes (convexe, linéaire, cardiaque)",
      "Doppler couleur",
      'Écran 15,6" full HD',
      "DICOM 3.0",
    ],
  },
  {
    id: "p9",
    name: "Chariot d'urgence 6 tiroirs",
    category: "Mobilier médical",
    supplier: "Atlas Medical Supply",
    reference: "FZ-CU6",
    specs: [
      "Structure ABS anti-choc",
      "Serrure à code",
      "Support défibrillateur",
      "Roues Ø125 antistatiques",
    ],
  },
  {
    id: "p10",
    name: "Bistouri électrique 400 W",
    category: "Bloc opératoire",
    supplier: "MedTech Maghreb",
    reference: "FZ-BE400",
    specs: [
      "Mono/bipolaire",
      "Coagulation par spray",
      "Détection automatique de plaque",
      "Écran LCD",
    ],
  },
  {
    id: "p11",
    name: "Pousse-seringue électrique PS-Duo",
    category: "Réanimation",
    supplier: "Sanitas Distribution",
    reference: "FZ-PSDUO",
    specs: ["Débit 0,1–1500 ml/h", "Bolus programmable", "Batterie 8 h", "Empilable sur rack"],
  },
  {
    id: "p12",
    name: "Laveur-désinfecteur d'instruments LD-200",
    category: "Stérilisation",
    supplier: "Cleanmed Industrie",
    reference: "FZ-LD200",
    specs: [
      "Capacité 10 paniers DIN",
      "Thermo-désinfection A0 3000",
      "Double porte",
      "EN ISO 15883",
    ],
  },
  {
    id: "p13",
    name: "Kit de consommables bloc (usage unique)",
    category: "Consommables",
    supplier: "Cleanmed Industrie",
    reference: "FZ-KCB",
    specs: ["Champs stériles renforcés", "Casaques niveau 2", "Stérilisation EO", "Lot traçable"],
  },
  {
    id: "p14",
    name: "Défibrillateur biphasique DEF-Care",
    category: "Réanimation",
    supplier: "MedTech Maghreb",
    reference: "FZ-DEFC",
    specs: [
      "Énergie 1–360 J",
      "Mode DEA + manuel",
      "Stimulateur externe",
      "Palettes adulte/pédiatrique",
    ],
  },
];

export const SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name: "MedTech Maghreb",
    city: "Casablanca",
    contact: "Youssef Berrada",
    email: "contact@medtech-maghreb.ma",
    phone: "+212 522 41 88 90",
    availability: "Disponible" as const,
    products: ["Bloc opératoire", "Réanimation"],
  },
  {
    id: "s2",
    name: "Atlas Medical Supply",
    city: "Rabat",
    contact: "Salma Bennani",
    email: "commercial@atlasmedical.ma",
    phone: "+212 537 22 14 05",
    availability: "Disponible" as const,
    products: ["Mobilier médical", "Bloc opératoire"],
  },
  {
    id: "s3",
    name: "Sanitas Distribution",
    city: "Marrakech",
    contact: "Hamid Ouazzani",
    email: "devis@sanitas-dist.ma",
    phone: "+212 524 30 77 12",
    availability: "Stock limité" as const,
    products: ["Diagnostic", "Réanimation"],
  },
  {
    id: "s4",
    name: "Cleanmed Industrie",
    city: "Tanger",
    contact: "Nadia Cherkaoui",
    email: "info@cleanmed.ma",
    phone: "+212 539 94 60 33",
    availability: "Disponible" as const,
    products: ["Stérilisation", "Consommables"],
  },
  {
    id: "s5",
    name: "Oriental Medical Trade",
    city: "Oujda",
    contact: "Rachid Alaoui",
    email: "rachid@omt.ma",
    phone: "+212 536 68 21 44",
    availability: "Rupture partielle" as const,
    products: ["Consommables", "Mobilier médical"],
  },
];

/** Prix d'achat / prix de vente catalogue (MAD HT). */
const PRICES: Record<string, [number, number]> = {
  p1: [14500, 21900],
  p2: [148000, 215000],
  p3: [96000, 139000],
  p4: [28500, 41000],
  p5: [9800, 14500],
  p6: [210000, 289000],
  p7: [165000, 235000],
  p8: [185000, 262000],
  p9: [7900, 12400],
  p10: [42000, 61000],
  p11: [6400, 9800],
  p12: [320000, 435000],
  p13: [180, 295],
  p14: [78000, 112000],
};

export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => {
  const price = PRICES[p.id] ?? [0, 0];
  return {
    ...p,
    supplierId: SUPPLIERS.find((s) => s.name === p.supplier)?.id ?? SUPPLIERS[0]!.id,
    purchasePrice: price[0]!,
    salePrice: price[1]!,
  };
});

export type Certificate = {
  id: string;
  product: string;
  category: Category;
  holder: string;
  number: string;
  expires: string;
  status: "Valide" | "En renouvellement" | "Expire bientôt" | "Expiré";
};

export const CERTIFICATES: Certificate[] = [
  {
    id: "c1",
    product: "Certificat d'enregistrement — gamme équipements Sophiaco",
    category: "Bloc opératoire",
    holder: "Sophiaco (titulaire)",
    number: "DMP/2023/0871",
    expires: "2026-04-30",
    status: "En renouvellement",
  },
  {
    id: "c2",
    product: "Autorisation d'usage — certificat partenaire MedTech Maghreb",
    category: "Bloc opératoire",
    holder: "MedTech Maghreb (partenaire avec autorisation)",
    number: "DMP/2024/1420",
    expires: "2027-01-15",
    status: "Valide",
  },
  {
    id: "c3",
    product: "Moniteur multiparamétrique MP-12",
    category: "Diagnostic",
    holder: "Sanitas Distribution (partenaire avec autorisation)",
    number: "DMP/2024/0335",
    expires: "2026-10-02",
    status: "Expire bientôt",
  },
  {
    id: "c4",
    product: "Stérilisateur autoclave 90 L",
    category: "Stérilisation",
    holder: "Cleanmed Industrie (partenaire avec autorisation)",
    number: "DMP/2025/0142",
    expires: "2028-03-20",
    status: "Valide",
  },
  {
    id: "c5",
    product: "Lit médicalisé électrique 4 sections",
    category: "Mobilier médical",
    holder: "Sophiaco (titulaire)",
    number: "DMP/2022/0644",
    expires: "2026-09-28",
    status: "Expire bientôt",
  },
  {
    id: "c6",
    product: "Kit de consommables bloc (usage unique)",
    category: "Consommables",
    holder: "Cleanmed Industrie (partenaire avec autorisation)",
    number: "DMP/2025/0790",
    expires: "2027-06-11",
    status: "Valide",
  },
];

/** Acheteurs publics réels du secteur santé au Maroc. */
const CLIENTS = [
  "CHU Ibn Rochd — Casablanca",
  "CHU Mohammed VI — Marrakech",
  "Ministère de la Santé et de la Protection Sociale — DEMR, Rabat",
  "Ministère de la Santé et de la Protection Sociale — DAMPS, Rabat",
  "CHU Hassan II — Fès",
  "CHU Ibn Sina — Rabat",
  "Délégation du Ministère de la Santé — Préfecture d'Oujda-Angad",
  "Délégation du Ministère de la Santé — Province de Sidi Kacem",
  "Centre Hospitalier Provincial de Chichaoua",
  "Délégation du Ministère de la Santé — Préfecture de Meknès",
  "Centre Hospitalier Régional Al Farabi — Oujda",
  "Délégation du Ministère de la Santé — Province de Chtouka Aït Baha",
];

const AOO = "Appel d'offres ouvert sur offres de prix";
const AOI = "Appel d'offres ouvert international sur offres de prix";

type Seed = {
  ref: string;
  objet: string;
  procedure?: string;
  client: string;
  city: string;
  category: Category;
  budget: number;
  caution: number;
  deadline: string;
  stage: number;
  result?: "Gagné" | "Perdu" | undefined;
  lines: Array<[string, number, string, Conformity, string, number]>;
};

const seeds: Seed[] = [
  {
    ref: "34/2026/CHUIRC",
    objet:
      "Acquisition d'équipements de blocs opératoires destinés aux hôpitaux relevant du CHU Ibn Rochd de Casablanca — en 3 lots séparés",
    client: CLIENTS[0]!,
    city: "Casablanca",
    category: "Bloc opératoire",
    budget: 2450000,
    caution: 40000,
    deadline: "2026-09-24",
    stage: 3,
    lines: [
      [
        "Lot n°1 — Aspirateur chirurgical électrique",
        12,
        "Débit ≥ 50 L/min, bocaux autoclavables",
        "Conforme",
        "p1",
        96,
      ],
      [
        "Lot n°2 — Table d'opération électrique",
        4,
        "Charge ≥ 200 kg, plateau radio-transparent",
        "Conforme",
        "p2",
        92,
      ],
      [
        "Lot n°3 — Éclairage chirurgical LED",
        4,
        "≥ 140 000 lux, IRC ≥ 95",
        "À vérifier",
        "p3",
        81,
      ],
    ],
  },
  {
    ref: "12/2026/2",
    objet:
      "Achat des équipements divers de réanimation et d'urgence destinés à différentes formations sanitaires — en 3 lots séparés",
    procedure: AOI,
    client: CLIENTS[2]!,
    city: "Rabat",
    category: "Réanimation",
    budget: 5120000,
    caution: 80000,
    deadline: "2026-09-13",
    stage: 4,
    lines: [
      [
        "Lot n°1 — Respirateur de réanimation",
        18,
        "Modes VC/PC/VNI, autonomie ≥ 3 h",
        "Conforme",
        "p7",
        94,
      ],
      ["Lot n°2 — Pousse-seringue électrique", 60, "Débit 0,1–1200 ml/h, bolus", "Conforme", "p11", 98],
      ["Lot n°3 — Défibrillateur biphasique", 10, "Mode DEA + manuel, 360 J", "Conforme", "p14", 90],
    ],
  },
  {
    ref: "09/2026/DAMPS/DM",
    objet:
      "Achat de dispositifs médicaux de monitorage destinés aux établissements de soins relevant du Ministère de la Santé et de la Protection Sociale",
    client: CLIENTS[3]!,
    city: "Rabat",
    category: "Diagnostic",
    budget: 1870000,
    caution: 30000,
    deadline: "2026-09-11",
    stage: 5,
    lines: [
      [
        "Lot n°1 — Moniteur multiparamétrique",
        24,
        "ECG 12D, SpO2, PNI, capnographie",
        "Conforme",
        "p4",
        95,
      ],
      [
        "Lot n°2 — Échographe portable",
        3,
        "Doppler couleur, 3 sondes, DICOM",
        "À vérifier",
        "p8",
        78,
      ],
    ],
  },
  {
    ref: "04/2026/AOOS/CHM6M",
    objet:
      "Acquisition de mobilier médical et de chariots d'urgence pour les besoins des hôpitaux relevant du CHU Mohammed VI de Marrakech",
    client: CLIENTS[1]!,
    city: "Marrakech",
    category: "Mobilier médical",
    budget: 980000,
    caution: 15000,
    deadline: "2026-10-06",
    stage: 2,
    lines: [
      [
        "Lot n°1 — Lit médicalisé électrique",
        80,
        "4 sections, hauteur variable, barrières",
        "Conforme",
        "p5",
        97,
      ],
      ["Lot n°2 — Chariot d'urgence", 15, "6 tiroirs, serrure à code", "Conforme", "p9", 93],
    ],
  },
  {
    ref: "07/2026/SAPP",
    objet:
      "Achat et mise en service d'équipements de stérilisation centrale destinés au CHU Hassan II de Fès",
    client: CLIENTS[4]!,
    city: "Fès",
    category: "Stérilisation",
    budget: 1340000,
    caution: 22000,
    deadline: "2026-09-30",
    stage: 1,
    lines: [
      [
        "Lot n°1 — Stérilisateur autoclave 90 L",
        3,
        "Classe B, cycle 134 °C, EN 13060",
        "À vérifier",
        "p6",
        88,
      ],
      [
        "Lot n°2 — Laveur-désinfecteur d'instruments",
        2,
        "10 paniers DIN, double porte",
        "Conforme",
        "p12",
        91,
      ],
    ],
  },
  {
    ref: "18/2026/DPMEK",
    objet:
      "Achat de matériel médico-technique destiné aux formations sanitaires de la préfecture de Meknès",
    client: CLIENTS[9]!,
    city: "Meknès",
    category: "Bloc opératoire",
    budget: 3260000,
    caution: 50000,
    deadline: "2026-11-02",
    stage: 6,
    result: "Gagné",
    lines: [
      [
        "Lot n°1 — Bistouri électrique 400 W",
        8,
        "Mono/bipolaire, détection de plaque",
        "Conforme",
        "p10",
        96,
      ],
      ["Lot n°2 — Table d'opération électrique", 6, "Trendelenburg ±25°", "Conforme", "p2", 89],
    ],
  },
  {
    ref: "02/2026/DPCAB",
    objet:
      "Achat de matériel médico-technique destiné aux formations sanitaires de la province de Chtouka Aït Baha",
    client: CLIENTS[11]!,
    city: "Agadir",
    category: "Diagnostic",
    budget: 720000,
    caution: 12000,
    deadline: "2026-09-18",
    stage: 3,
    lines: [
      ["Lot n°1 — Échographe portable", 2, "Sonde cardiaque incluse", "Conforme", "p8", 92],
      ["Lot n°2 — Moniteur multiparamétrique", 10, 'Écran ≥ 12"', "Conforme", "p4", 94],
    ],
  },
  {
    ref: "21/2026/SAPP",
    objet:
      "Acquisition d'équipements de réanimation pour le service des soins intensifs du CHU Hassan II de Fès",
    client: CLIENTS[4]!,
    city: "Fès",
    category: "Réanimation",
    budget: 4410000,
    caution: 70000,
    deadline: "2026-09-09",
    stage: 4,
    lines: [
      [
        "Lot n°1 — Respirateur de réanimation",
        12,
        "Compensation de fuites, VNI",
        "Conforme",
        "p7",
        93,
      ],
      [
        "Lot n°2 — Moniteur multiparamétrique",
        30,
        "Centrale de surveillance compatible",
        "À vérifier",
        "p4",
        84,
      ],
      ["Lot n°3 — Chariot d'urgence", 12, "Support défibrillateur", "Conforme", "p9", 90],
    ],
  },
  {
    ref: "32/2026/CHPCH",
    objet:
      "Achat de consommables médicaux stériles à usage unique pour le Centre Hospitalier Provincial de Chichaoua",
    client: CLIENTS[8]!,
    city: "Marrakech",
    category: "Consommables",
    budget: 460000,
    caution: 8000,
    deadline: "2026-09-26",
    stage: 2,
    lines: [
      [
        "Lot unique — Kit de consommables bloc",
        1200,
        "Champs stériles renforcés, lot traçable",
        "Conforme",
        "p13",
        99,
      ],
    ],
  },
  {
    ref: "11/2026/CHRAF",
    objet:
      "Acquisition de mobilier médical destiné aux services d'hospitalisation du Centre Hospitalier Régional Al Farabi",
    client: CLIENTS[10]!,
    city: "Oujda",
    category: "Mobilier médical",
    budget: 615000,
    caution: 10000,
    deadline: "2026-10-14",
    stage: 1,
    lines: [
      ["Lot n°1 — Lit médicalisé électrique", 40, "Charge ≥ 200 kg", "Conforme", "p5", 95],
      ["Lot n°2 — Chariot d'urgence", 6, "Roues antistatiques", "À vérifier", "p9", 79],
    ],
  },
  {
    ref: "28/2026/2",
    objet:
      "Achat d'équipements de stérilisation destinés aux centres hospitaliers relevant du Ministère de la Santé — en 2 lots séparés",
    procedure: AOI,
    client: CLIENTS[2]!,
    city: "Rabat",
    category: "Stérilisation",
    budget: 2890000,
    caution: 45000,
    deadline: "2026-10-21",
    stage: 5,
    lines: [
      [
        "Lot n°1 — Stérilisateur autoclave 90 L",
        9,
        "Imprimante intégrée, traçabilité",
        "Conforme",
        "p6",
        96,
      ],
      ["Lot n°2 — Laveur-désinfecteur d'instruments", 6, "A0 3000", "Conforme", "p12", 92],
    ],
  },
  {
    ref: "47/2026/CHUIRC",
    objet:
      "Acquisition d'équipements de réanimation pour le service des urgences du CHU Ibn Rochd de Casablanca",
    client: CLIENTS[0]!,
    city: "Casablanca",
    category: "Réanimation",
    budget: 1975000,
    caution: 32000,
    deadline: "2026-09-08",
    stage: 6,
    result: "Perdu",
    lines: [
      ["Lot n°1 — Défibrillateur biphasique", 14, "Stimulateur externe", "Non conforme", "p14", 62],
      ["Lot n°2 — Pousse-seringue électrique", 45, "Empilable sur rack", "Conforme", "p11", 91],
    ],
  },
  {
    ref: "06/2026/DPCAB",
    objet:
      "Équipement du bloc opératoire de l'hôpital de proximité de Belfaa — province de Chtouka Aït Baha",
    client: CLIENTS[11]!,
    city: "Agadir",
    category: "Bloc opératoire",
    budget: 1120000,
    caution: 18000,
    deadline: "2026-10-02",
    stage: 3,
    lines: [
      ["Lot n°1 — Éclairage chirurgical LED", 3, "Double coupole, 4500 K", "Conforme", "p3", 94],
      [
        "Lot n°2 — Aspirateur chirurgical électrique",
        6,
        "Niveau sonore < 60 dB",
        "Conforme",
        "p1",
        97,
      ],
    ],
  },
  {
    ref: "15/2026/AOOS/CHIS",
    objet:
      "Acquisition de lits médicalisés électriques pour les services d'hospitalisation du CHU Ibn Sina de Rabat",
    client: CLIENTS[5]!,
    city: "Rabat",
    category: "Mobilier médical",
    budget: 845000,
    caution: 14000,
    deadline: "2026-11-12",
    stage: 2,
    lines: [["Lot unique — Lit médicalisé électrique", 55, "Freins centralisés", "Conforme", "p5", 96]],
  },
  {
    ref: "27/2026/AOOI/CHM6M",
    objet:
      "Acquisition de matériel médico-technique d'imagerie et de monitorage pour les besoins des hôpitaux relevant du CHU Mohammed VI",
    procedure: AOI,
    client: CLIENTS[1]!,
    city: "Marrakech",
    category: "Diagnostic",
    budget: 3050000,
    caution: 48000,
    deadline: "2026-09-29",
    stage: 4,
    lines: [
      ["Lot n°1 — Échographe portable", 6, "DICOM 3.0, archivage PACS", "Conforme", "p8", 90],
      ["Lot n°2 — Moniteur multiparamétrique", 40, "Batterie ≥ 4 h", "Conforme", "p4", 93],
    ],
  },
  {
    ref: "23/2026/DPMEK",
    objet:
      "Achat de consommables médicaux pour les formations sanitaires de la préfecture de Meknès",
    client: CLIENTS[9]!,
    city: "Meknès",
    category: "Consommables",
    budget: 380000,
    caution: 6000,
    deadline: "2026-09-15",
    stage: 5,
    lines: [["Lot unique — Kit de consommables bloc", 900, "Stérilisation EO", "Conforme", "p13", 98]],
  },
  {
    ref: "05/2026/DPSK",
    objet:
      "Équipement de l'hôpital de proximité de Jorf El Melha — province de Sidi Kacem — en 2 lots séparés",
    client: CLIENTS[7]!,
    city: "Fès",
    category: "Bloc opératoire",
    budget: 1660000,
    caution: 26000,
    deadline: "2026-10-09",
    stage: 1,
    lines: [
      ["Lot n°1 — Bistouri électrique 400 W", 5, "Coagulation spray", "Conforme", "p10", 92],
      ["Lot n°2 — Table d'opération électrique", 2, "Commande pédale", "À vérifier", "p2", 83],
    ],
  },
  {
    ref: "37/2026/DMSPSPOA",
    objet:
      "Achat de matériel de stérilisation médico-hospitalier — préfecture d'Oujda-Angad",
    client: CLIENTS[6]!,
    city: "Oujda",
    category: "Stérilisation",
    budget: 1290000,
    caution: 20000,
    deadline: "2026-10-27",
    stage: 3,
    lines: [
      ["Lot unique — Laveur-désinfecteur d'instruments", 4, "EN ISO 15883", "Conforme", "p12", 95],
    ],
  },
  {
    ref: "41/2026/2",
    objet:
      "Achat de mobilier médical destiné aux formations sanitaires de la région de l'Oriental — en 2 lots séparés",
    client: CLIENTS[2]!,
    city: "Oujda",
    category: "Mobilier médical",
    budget: 1450000,
    caution: 23000,
    deadline: "2026-09-12",
    stage: 4,
    lines: [
      ["Lot n°1 — Lit médicalisé électrique", 120, "Barrières ABS rabattables", "Conforme", "p5", 97],
      ["Lot n°2 — Chariot d'urgence", 20, "Serrure à code", "Conforme", "p9", 94],
    ],
  },
  {
    ref: "19/2026/CHPCH",
    objet:
      "Acquisition d'équipements de monitorage pour le service de médecine du Centre Hospitalier Provincial de Chichaoua",
    client: CLIENTS[8]!,
    city: "Marrakech",
    category: "Diagnostic",
    budget: 690000,
    caution: 11000,
    deadline: "2026-11-20",
    stage: 1,
    lines: [["Lot unique — Moniteur multiparamétrique", 8, "Capnographie incluse", "Conforme", "p4", 91]],
  },
];

function statusForStage(
  stage: number,
  lines: Seed["lines"],
  result?: "Gagné" | "Perdu",
): TenderStatus {
  if (stage >= 6) return result ?? "Gagné";
  if (stage === 5) return "Soumis";
  if (stage >= 3) return lines.some((l) => l[3] === "Non conforme") ? "Non conforme" : "Conforme";
  if (stage === 2) return "En analyse";
  return "Nouveau";
}

const D = (day: number, hour: string) => `0${day}/09/2026 ${hour}`.slice(-16);

/** Identifiant d'URL sûr à partir d'une référence de marché (ex. 34/2026/CHUIRC). */
export const slugRef = (ref: string) => ref.replace(/[^A-Za-z0-9]+/g, "-");

/** Exigence CE relevée dans le RC, variable d'un dossier à l'autre. */
function ceFor(i: number, category: Category): CeInfo {
  const rule = CE_RULES[i % 4]!;
  const holders: Record<string, string> = {
    "Bloc opératoire": "MedTech Maghreb",
    Diagnostic: "Sanitas Distribution",
    Réanimation: "MedTech Maghreb",
    Stérilisation: "Cleanmed Industrie",
    "Mobilier médical": "Sophiaco",
    Consommables: "Cleanmed Industrie",
  };
  const holder = holders[category] ?? "MedTech Maghreb";
  const fzanaIsHolder = holder === "Sophiaco";
  return {
    rule,
    rcArticle: `Article ${8 + (i % 6)} du règlement de consultation`,
    holder: fzanaIsHolder ? "Sophiaco (titulaire)" : holder,
    number: `DMP/${2022 + (i % 4)}/${String(100 + i * 37).slice(0, 4)}`,
    fzanaIsHolder,
    authorization: !fzanaIsHolder && i % 3 !== 1,
    usageClaimedBy: rule === "Usage unique" ? (i % 3 === 0 ? "Sophiaco" : null) : null,
  };
}

export const TENDERS: Tender[] = seeds.map((s, i) => {
  const ce = ceFor(i, s.category);
  const requirements: Requirement[] = s.lines.map((l, j) => ({
    id: `${s.ref}-L${j + 1}`,
    article: l[0],
    qty: l[1],
    specs: l[2],
    conformity: l[3],
    productId: l[4],
    score: l[5],
  }));
  const history: HistoryEntry[] = [
    {
      at: D(2 + (i % 6), "09:14"),
      label: "Dossier identifié par l'Agent Veille sur marchespublics.gov.ma",
    },
  ];
  if (s.stage >= 2)
    history.push({
      at: D(2 + (i % 6), "10:02"),
      label: "Fiche de synthèse générée par l'Agent Veille & Analyse",
    });
  if (s.stage >= 3)
    history.push({
      at: D(3 + (i % 5), "11:35"),
      label: `Matching technique terminé — ${requirements.length} ligne(s) analysée(s)`,
    });
  if (s.stage >= 4)
    history.push({ at: D(4 + (i % 4), "08:30"), label: "4 documents générés automatiquement" });
  if (s.stage >= 5)
    history.push({
      at: D(5 + (i % 3), "16:10"),
      label: "Dossier soumis sur le portail des marchés publics",
    });
  if (s.stage >= 6)
    history.push({ at: D(6 + (i % 2), "12:45"), label: `Résultat enregistré : ${s.result}` });

  const avg = Math.round(requirements.reduce((a, r) => a + r.score, 0) / requirements.length);
  return {
    id: slugRef(s.ref),
    ref: s.ref,
    objet: s.objet,
    procedure: s.procedure ?? AOO,
    client: s.client,
    city: s.city,
    category: s.category,
    budget: s.budget,
    caution: s.caution,
    deadline: s.deadline,
    stage: s.stage,
    status: statusForStage(s.stage, s.lines, s.result),
    result: s.result,
    requirements,
    pieces: buildPieces(slugRef(s.ref), s.stage, ce.rule),
    ce,
    history,
    summary: [
      `Objet du marché : ${s.objet}.`,
      `Procédure : ${s.procedure ?? AOO}, ouverture des plis le ${new Date(s.deadline).toLocaleDateString("fr-FR")} à 10h00.`,
      `Budget estimé ${s.budget.toLocaleString("fr-MA")} MAD, caution provisoire ${s.caution.toLocaleString("fr-MA")} MAD.`,
      `${requirements.length} lot(s) analysé(s) — taux de conformité produit estimé à ${avg}% sur la base du catalogue Sophiaco.`,
      `Certificat d'enregistrement (${ce.rcArticle}) : ${ce.rule.toLowerCase()} — ${evaluateCe(ce).message}`,
    ],
  } satisfies Tender;
});

export function conformityRate(t: Tender) {
  return Math.round(t.requirements.reduce((a, r) => a + r.score, 0) / t.requirements.length);
}

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)!;

export const AGENT_LOGS_VEILLE = [
  "→ Connexion au portail marchespublics.gov.ma…",
  "✓ Session établie (TLS 1.3)",
  "→ Application des critères internes : catégories, zone, budget",
  "→ Filtrage sectoriel : santé / équipements médicaux",
  "✓ 47 avis parcourus, 6 correspondances retenues",
  "→ Téléchargement des cahiers des charges (PDF)…",
  "→ Extraction OCR des exigences techniques…",
  "✓ 14 lignes d'exigences extraites",
  "→ Génération des fiches de synthèse…",
  "✓ Terminé — 3 nouveaux dossiers ajoutés",
];

export const AGENT_LOGS_MATCHING = [
  "→ Chargement du catalogue produits Sophiaco (14 références)",
  "→ Normalisation des spécifications techniques…",
  "→ Calcul des scores de similarité (specs, catégorie, quantité)",
  "✓ 12 lignes appariées avec score ≥ 90%",
  "⚠ 3 lignes à vérifier manuellement (score 78–88%)",
  "→ Vérification des certificats d'enregistrement…",
  "✓ Certificat partenaire valide utilisé",
  "→ Consolidation du tableau de conformité…",
  "✓ Matching terminé",
];

const NEW_CLIENTS = CLIENTS;

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

/** Génère un nouvel appel d'offres "découvert" par l'Agent Veille, aligné sur les critères. */
export function generateDiscoveredTender(opts: {
  categories: Category[];
  cities: string[];
  budgetMin: number;
  budgetMax: number;
  existingRefs: string[];
}): Tender {
  const category = pick(opts.categories.length ? opts.categories : CATEGORIES);
  const city = pick(opts.cities.length ? opts.cities : CITIES);
  const min = Math.max(50000, Math.min(opts.budgetMin, opts.budgetMax));
  const max = Math.max(min + 100000, opts.budgetMax);
  const budget = Math.round((min + Math.random() * (max - min)) / 10000) * 10000;

  const client = pick(NEW_CLIENTS);
  const acronym = client.includes("Ibn Rochd")
    ? "CHUIRC"
    : client.includes("Mohammed VI")
      ? "AOOS/CHM6M"
      : client.includes("DAMPS")
        ? "DAMPS/DM"
        : client.includes("DEMR")
          ? "2"
          : client.includes("Hassan II")
            ? "SAPP"
            : client.includes("Ibn Sina")
              ? "AOOS/CHIS"
              : "DMSPS";

  let ref = "";
  do {
    ref = `${String(Math.floor(4 + Math.random() * 90)).padStart(2, "0")}/2026/${acronym}`;
  } while (opts.existingRefs.includes(ref));

  const pool = PRODUCTS.filter((p) => p.category === category);
  const chosen = (pool.length ? pool : PRODUCTS).slice(0, 2);
  const requirements: Requirement[] = chosen.map((p, j) => ({
    id: `${slugRef(ref)}-L${j + 1}`,
    article: `Lot n°${j + 1} — ${p.name.replace(/\s[A-Z0-9-]+$/, "")}`,
    qty: 2 + Math.floor(Math.random() * 40),
    specs: p.specs[0] ?? "Spécifications standard",
    conformity: "Conforme",
    productId: p.id,
    score: 88 + Math.floor(Math.random() * 10),
  }));

  const d = new Date();
  d.setDate(d.getDate() + 20 + Math.floor(Math.random() * 60));
  const deadline = d.toISOString().slice(0, 10);
  const now = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  const at = `${p2(now.getDate())}/${p2(now.getMonth() + 1)}/${now.getFullYear()} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
  const avg = Math.round(requirements.reduce((a, r) => a + r.score, 0) / requirements.length);

  const objet = `Achat de matériel médico-technique (${category.toLowerCase()}) destiné aux formations sanitaires de ${city}`;
  const caution = Math.round((budget * 0.015) / 1000) * 1000;

  const ce = ceFor(Math.floor(Math.random() * 4), category);

  return {
    id: slugRef(ref),
    ref,
    objet,
    procedure: AOO,
    client,
    city,
    category,
    budget,
    caution,
    deadline,
    status: "Nouveau",
    stage: 1,
    requirements,
    pieces: buildPieces(slugRef(ref), 1, ce.rule),
    ce,
    history: [{ at, label: "Dossier identifié par l'Agent Veille sur marchespublics.gov.ma" }],
    summary: [
      `Objet du marché : ${objet}.`,
      `Procédure : ${AOO}, ouverture des plis le ${new Date(deadline).toLocaleDateString("fr-FR")} à 10h00.`,
      `Budget estimé ${budget.toLocaleString("fr-MA")} MAD, caution provisoire ${caution.toLocaleString("fr-MA")} MAD.`,
      `${requirements.length} lot(s) — taux de conformité produit estimé à ${avg}% sur la base du catalogue Sophiaco.`,
    ],
  };
}
