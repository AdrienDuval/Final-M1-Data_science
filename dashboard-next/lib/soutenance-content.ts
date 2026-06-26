/**
 * Contenu pédagogique pour la préparation à la soutenance RNCP40875 — Bloc 2.
 * Marketing ROI Optimization — EFREI M1 Data Engineering.
 */

export type CheckItem = { id: string; label: string };

export type Section = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  codeRefs?: { file: string; detail: string }[];
  oralTip?: string;
  status?: "required" | "bonus" | "partial";
};

export type Phase = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
  rncp: string[];
  ef: string[];
  presentationMinutes?: string;
  sections: Section[];
  checklist: CheckItem[];
};

export type RncpCriterion = {
  id: string;
  title: string;
  description: string;
  criteria: string[];
  projectProof: string[];
  files: string[];
};

export type TimelineBlock = {
  minutes: string;
  title: string;
  speaker: string;
  content: string[];
};

export type JuryQuestion = {
  category: string;
  question: string;
  answer: string;
  relatedPhase: string;
};

export const DEFENSE_INFO = {
  title: "Soutenance de fin de M1 — Marketing ROI Optimization",
  dates: "2 & 3 juillet 2026",
  jury: "2 professionnels externes + 1 interne EFREI",
  format: "Oral en binôme — 1 h au total",
  breakdown: [
    { label: "Présentation", value: "20 min" },
    { label: "Échanges avec le jury", value: "30 min" },
    { label: "Délibération", value: "10 min" },
  ],
  certification: "RNCP40875 — Expert en Ingénierie de Données — Bloc 2",
  subject: "Plateforme intelligente multi-modèles pour optimiser le ROI marketing",
  authors: "LE Quang Dat · Adrien CHUEMBOU MBAH",
  datasetOfficial: "marketing_and_sales.csv (Kaggle) — ~200 campagnes (énoncé)",
  datasetUsed: "marketing_labelled.csv — 4 572 campagnes (jeu enrichi, même variables)",
};

export const SUBJECT_REQUIREMENTS = [
  { req: "Choisir UNE tâche prédictive (régression OU classification)", status: "bonus" as const, note: "Régression principale + classification bonus (perf_class)" },
  { req: "≥ 4 modèles dont ≥ 1 Deep Learning (MLP)", status: "required" as const, note: "4 régression + 4 classification, MLP dans les deux" },
  { req: "Comparaison quantitative rigoureuse", status: "required" as const, note: "Régression : MAE, RMSE, R² · Classification : Accuracy, F1-macro, ROC-AUC · + validation croisée 5 folds" },
  { req: "Dashboard interactif obligatoire (Streamlit/Dash)", status: "required" as const, note: "Tableau de bord Next.js (React) interactif — exploration, prédiction, simulation, optimisation inverse" },
  { req: "Orienté métier (CMO = Chief Marketing Officer) — simulation & décision, pas EDA seule", status: "required" as const, note: "Simulateur, Target Planner, Predict — scénarios budgétaires en temps réel" },
  { req: "API REST (optionnelle, bonus)", status: "bonus" as const, note: "FastAPI — 13 endpoints, documentation auto Swagger /docs" },
  { req: "Zéro data leakage (pipelines sklearn)", status: "required" as const, note: "ColumnTransformer + Pipeline, fit sur train uniquement" },
];

export const RNCP_CRITERIA: RncpCriterion[] = [
  {
    id: "C3.1",
    title: "Préparer et transformer les données",
    description: "Utiliser des outils adaptés, garantir la qualité des données, documenter chaque étape.",
    criteria: [
      "Outils adaptés au volume et à la nature des données",
      "Qualité des données vérifiée (manquants, cohérence, outliers)",
      "Documentation claire du pipeline de préparation",
    ],
    projectProof: [
      "Chargement centralisé dans load_data() avec création automatique de perf_class si absent",
      "Imputation médiane (numériques) + mode (catégorielles)",
      "StandardScaler + OneHotEncoder drop-first dans un ColumnTransformer",
      "Split stratifié 80/20 sur perf_class pour équilibrer les classes",
      "EDA (Exploratory Data Analysis = analyse exploratoire) documentée : notebooks/01_eda.ipynb + pages Dashboard / Analytics du tableau de bord Next.js",
    ],
    files: ["src/preprocessing.py", "notebooks/01_eda.ipynb", "data/marketing_labelled.csv"],
  },
  {
    id: "C3.2",
    title: "Communication infographique visuelle",
    description: "Visualisations interactives, inclusives, temps réel, orientées décision.",
    criteria: [
      "Visualisations adaptées au public métier",
      "Interactivité (sliders, scénarios, comparaisons)",
      "Mise à jour en temps réel des KPI",
    ],
    projectProof: [
      "Simulateur Next.js : sliders TV/Radio/Social/Influencer → prédiction instantanée des ventes",
      "Comparaison multi-modèles : POST /predict/all, graphiques Recharts côte à côte",
      "Target Planner : optimisation inverse SLSQP (Sequential Least Squares Programming) + analyse probabiliste RF",
      "Pages Dashboard / Models / Drivers avec KPI, ROI par influenceur, importance des variables",
      "Distinction EDA (analyse technique dans le notebook) vs dashboard décisionnel (Simulateur, Predict, Target Planner)",
    ],
    files: ["dashboard-next/app/simulator/page.tsx", "dashboard-next/app/target-planner/page.tsx", "dashboard-next/app/dashboard/page.tsx"],
  },
  {
    id: "C3.3",
    title: "Analyse exploratoire des données",
    description: "Techniques statistiques adaptées, insights exploitables, documentation.",
    criteria: [
      "Distributions, corrélations, cohérence des montants",
      "Identification des relations investissement → ventes",
      "Insights traduits en choix de modélisation",
    ],
    projectProof: [
      "Corrélation TV/Radio/Social avec Sales — TV souvent le levier dominant",
      "4 niveaux d'influenceur (Mega > Macro > Micro > Nano) encodés en dummy",
      "Distribution des ventes → quantiles 33%/66% pour perf_class",
      "Heatmaps, histogrammes, stats descriptives via API /stats et dashboard",
    ],
    files: ["notebooks/01_eda.ipynb", "api/main.py (/stats)", "dashboard-next/app/dashboard/page.tsx"],
  },
  {
    id: "C4.1",
    title: "Stratégie d'intégration de l'IA",
    description: "Cas d'usage pertinents, impact évalué, feuille de route réalisable.",
    criteria: [
      "Cas d'usage métier clairement défini",
      "Impact business quantifié (ROI, allocation budgétaire)",
      "Architecture déployable et industrialisable",
    ],
    projectProof: [
      "Cas d'usage : CMO alloue budget → prédit ventes → compare scénarios → optimise mix",
      "ROI (Return On Investment = retour sur investissement) = ventes prédites / budget total (ratio renvoyé par /predict)",
      "FastAPI + Docker Compose : service reproductible, healthcheck, modèles embarqués dans l'image",
      "Stack produit unifiée : API FastAPI + tableau de bord Next.js (React) qui consomme l'API REST",
      "Limites assumées : données synthétiques, les arbres n'extrapolent pas → avertissement + repli recommandé sur la régression linéaire",
    ],
    files: ["api/main.py", "docker-compose.yml", "Dockerfile.api"],
  },
  {
    id: "C4.2",
    title: "Développement de modèles prédictifs",
    description: "Prétraitement, algorithmes justifiés, code fonctionnel, résultats cohérents.",
    criteria: [
      "≥ 4 algorithmes comparés dont 1 DL",
      "Hyperparamètres tunés avec stratégie expliquée",
      "Code modulaire et reproductible",
    ],
    projectProof: [
      "Régression : Linear, Random Forest, Gradient Boosting (XGBoost), MLP",
      "Classification : Logistic, RF, GB, MLP — cible perf_class",
      "RandomizedSearchCV : 15 itérations, 5 folds, scoring RMSE (reg) / accuracy (clf)",
      "Progression baseline → arbres → boosting → MLP (esprit du sujet)",
      "splits.pkl + random_state=42 pour reproductibilité exacte",
    ],
    files: ["src/train.py", "src/models.py", "models/*.pkl", "models/cv_results.json"],
  },
  {
    id: "C4.3",
    title: "Évaluation comparative des modèles",
    description: "≥ 2 modèles comparés, métriques appropriées, modèle final validé, écoresponsabilité.",
    criteria: [
      "Métriques adaptées à la tâche (reg vs clf)",
      "Validation croisée + hold-out test",
      "Analyse des erreurs au-delà des scores globaux",
      "Interprétabilité (importance, SHAP)",
    ],
    projectProof: [
      "Régression : R² test = 0.9971 (RF, meilleur modèle), RMSE 5.05 M$, MAE 2.82 M$, analyse des résidus",
      "Classification : Accuracy 0.9737 (Gradient Boosting & Logistique), F1-macro 0.9736, ROC-AUC 0.999",
      "Courbes d'apprentissage MLP, matrice de confusion, permutation importance",
      "SHAP (SHapley Additive exPlanations) optionnel : python src/evaluate.py --shap",
      "Justification : sur données synthétiques structurées, RF/GB ≥ MLP — le Deep Learning n'est pas toujours supérieur sur des données tabulaires",
    ],
    files: ["src/evaluate.py", "models/metrics_regression.csv", "figures/"],
  },
];

export const PRESENTATION_TIMELINE: TimelineBlock[] = [
  {
    minutes: "0–2 min",
    title: "Accroche & contexte métier",
    speaker: "Membre 1",
    content: [
      "Problème : un CMO dépense sur TV, Radio, Social, Influenceurs — difficile de savoir quel mix maximise les ventes",
      "Notre solution : MVP multi-modèles qui prédit les ventes et simule des scénarios budgétaires",
      "Dataset Kaggle, 4 572 campagnes, 4 canaux + niveau influenceur",
    ],
  },
  {
    minutes: "2–5 min",
    title: "Architecture & pipeline de données",
    speaker: "Membre 1",
    content: [
      "Schéma : CSV → preprocessing.py → train.py → models/*.pkl → API → Dashboard",
      "Anti-leakage : tout le preprocessing dans sklearn Pipeline, fit sur train seulement",
      "Deux tâches : régression (Sales) principale + classification (Low/Medium/High) bonus",
    ],
  },
  {
    minutes: "5–10 min",
    title: "Modélisation & comparaison",
    speaker: "Membre 2",
    content: [
      "4 modèles régression : Linear (baseline), RF, Gradient Boosting, MLP (Deep Learning obligatoire)",
      "Tuning RandomizedSearchCV 15 itérations × 5 folds",
      "Résultats : RF R² test = 0.9971 (meilleur) — MLP en dessous (0.9925) → le Deep Learning n'est pas toujours optimal sur ce jeu tabulaire",
      "Classification bonus : 4 modèles, accuracy ≈ 97.4 % (Gradient Boosting & Logistique)",
    ],
  },
  {
    minutes: "10–14 min",
    title: "Évaluation & interprétabilité",
    speaker: "Membre 2",
    content: [
      "Métriques : MAE, RMSE, R² + CV pour la régression ; Accuracy, F1-macro, ROC-AUC pour la classification",
      "Analyse erreurs : résidus, matrice de confusion, courbes d'apprentissage MLP",
      "Feature importance : TV ultra-dominant (r = 0.9995), Radio secondaire, influenceur quasi nul (jeu synthétique)",
      "Permutation importance + SHAP disponible — importance par permutation = recommandée car agnostique au modèle",
    ],
  },
  {
    minutes: "14–18 min",
    title: "Démo live du dashboard",
    speaker: "Membre 1 ou 2",
    content: [
      "Simulateur (/simulator) : bouger les sliders, comparer les 4 modèles en temps réel",
      "Target Planner (/target-planner) : objectif de ventes → budget optimal (SLSQP) + probabilité d'atteinte",
      "Page Models & Drivers : métriques, courbes d'apprentissage, importance des variables",
      "Montrer /docs Swagger si le jury pose des questions sur l'API",
    ],
  },
  {
    minutes: "18–20 min",
    title: "Limites, perspectives & conclusion",
    speaker: "Membre 1",
    content: [
      "Limites : données synthétiques, arbres n'extrapolent pas → repli linéaire hors bornes",
      "Perspectives : données réelles, A/B testing, réentraînement automatique, MLOps",
      "Récap RNCP : EF1–EF5 couverts, bonus API + double tâche + Docker",
      "Merci — questions du jury",
    ],
  },
];

export const PHASES: Phase[] = [
  {
    id: "phase-0",
    number: 0,
    title: "Cadre de la soutenance",
    subtitle: "Format, jury, livrables, ce que le jury attend",
    icon: "GraduationCap",
    rncp: ["Bloc 2 global"],
    ef: ["Tous"],
    sections: [
      {
        id: "p0-format",
        title: "Format oral",
        paragraphs: [
          "La soutenance dure 1 heure en binôme. Le jury a déjà lu votre dossier — l'oral sert à démontrer, pas à tout réexpliquer.",
          "Répartition : 20 min présentation structurée, 30 min questions/réponses, 10 min délibération (vous n'êtes plus dans la salle).",
        ],
        bullets: [
          "Préparez-vous chacun à parler ~10 min",
          "Alternez les rôles : un sur la data/ML, un sur l'architecture/démo",
          "Ayez la démo prête offline (modèles entraînés, API lancée ou Docker up)",
          "Anticipez 15–20 questions techniques du jury",
        ],
        oralTip: "Commencez par UNE phrase métier : « Un directeur marketing veut savoir où investir 100 M$ pour maximiser ses ventes — notre plateforme répond à ça. »",
      },
      {
        id: "p0-livrables",
        title: "Livrables attendus (MOODLE)",
        bullets: [
          "Code source fonctionnel (Git/GitHub recommandé)",
          "Rapport de projet structuré (démarche, résultats, recommandations)",
          "Support de présentation (slides)",
          "Démonstration en classe — tous les membres participent à l'oral",
        ],
        status: "required",
      },
      {
        id: "p0-exigences",
        title: "Checklist exigences du sujet",
        table: {
          headers: ["Exigence", "Statut projet", "Commentaire"],
          rows: SUBJECT_REQUIREMENTS.map((r) => [
            r.req,
            r.status === "required" ? "✅ Requis" : r.status === "bonus" ? "⭐ Bonus" : "⚠️ Partiel",
            r.note,
          ]),
        },
      },
    ],
    checklist: [
      { id: "c0-1", label: "Je connais la durée et le découpage de la soutenance" },
      { id: "c0-2", label: "J'ai lu le sujet officiel (Projet_M1_DE_Sujet3_Marketing_ROI.md)" },
      { id: "c0-3", label: "Le rapport et les slides sont prêts sur MOODLE" },
      { id: "c0-4", label: "La démo fonctionne (tableau de bord Next.js + API, ou Docker Compose)" },
    ],
  },
  {
    id: "phase-1",
    number: 1,
    title: "Problématique & contexte métier",
    subtitle: "Pourquoi ce projet, quelle question on résout",
    icon: "Target",
    rncp: ["C4.1"],
    ef: ["EF2"],
    presentationMinutes: "0–2 min",
    sections: [
      {
        id: "p1-probleme",
        title: "Le problème business",
        paragraphs: [
          "Une entreprise investit dans plusieurs canaux publicitaires. Chaque canal coûte de l'argent. La direction veut maximiser les ventes (Sales) pour un budget donné, ou atteindre un objectif de ventes au coût minimal.",
        ],
        bullets: [
          "TV — budget le plus élevé, impact souvent fort",
          "Radio — canal intermédiaire",
          "Social Media — budget plus petit, croissance digitale",
          "Influencer — catégoriel (Mega, Macro, Micro, Nano) — effet non linéaire",
        ],
        oralTip: "Exemple concret : « Si j'augmente le budget Social Media de 10 % et je réduis la TV de 10 %, que deviennent mes ventes ? » — c'est exactement ce que fait le simulateur.",
      },
      {
        id: "p1-taches",
        title: "Tâches prédictives (choix du sujet)",
        table: {
          headers: ["Tâche", "Cible", "Notre choix"],
          rows: [
            ["4.1 Prédiction des ventes", "Sales (régression)", "✅ Tâche principale"],
            ["4.4 Performance campagne", "Low/Medium/High (classification)", "⭐ Bonus"],
            ["4.2 Estimation ROI directe", "ROI = Sales/Budget", "⚠️ ROI dérivé, pas entraîné"],
            ["4.3 Impact marginal", "∂Sales/∂canal", "⚠️ Partiel (/simulate/tv-sweep)"],
            ["4.5 Score d'efficacité", "Score composite", "❌ Non implémenté"],
          ],
        },
        oralTip: "Le sujet demande UNE tâche — nous avons choisi la régression Sales comme principale, avec la classification en bonus. Justifiez : « Deux angles complémentaires pour le même décideur marketing. »",
      },
    ],
    checklist: [
      { id: "c1-1", label: "Je peux expliquer le problème en 30 secondes sans jargon" },
      { id: "c1-2", label: "Je connais les 4 variables d'entrée et la cible Sales" },
      { id: "c1-3", label: "Je sais pourquoi régression + classification bonus" },
    ],
  },
  {
    id: "phase-2",
    number: 2,
    title: "Données & EDA",
    subtitle: "Acquisition, qualité, exploration — EF1 / C3.1 / C3.3",
    icon: "Database",
    rncp: ["C3.1", "C3.3"],
    ef: ["EF1"],
    presentationMinutes: "2–5 min (partie data)",
    sections: [
      {
        id: "p2-dataset",
        title: "Le dataset",
        bullets: [
          "Source Kaggle : Dummy Advertising and Sales Data",
          "Fichier principal : data/marketing_labelled.csv (4 572 lignes)",
          "Énoncé mentionne ~200 lignes — nous utilisons le jeu enrichi, mêmes colonnes",
          "Variables : TV, Radio, Social Media (numériques, en millions), Influencer (catégoriel), Sales (cible)",
        ],
        codeRefs: [
          { file: "src/preprocessing.py", detail: "load_data() — lignes 34–51" },
          { file: "data/marketing_labelled.csv", detail: "Fichier principal avec perf_class" },
        ],
      },
      {
        id: "p2-eda",
        title: "Analyse exploratoire (EDA)",
        bullets: [
          "Notebook : notebooks/01_eda.ipynb — distributions, corrélations, outliers",
          "TV corrèle quasi parfaitement avec Sales (r = 0.9995), Radio fortement (0.8691), Social modérément (0.5289)",
          "4 niveaux d'influenceur (Mega, Macro, Micro, Nano) mais ventes moyennes quasi identiques (~190–195 M$)",
          "perf_class créé par quantiles 33% / 66% sur Sales → Low / Medium / High (terciles)",
          "Pages Dashboard / Analytics du Next.js + API GET /stats et /analytics pour les KPI agrégés",
        ],
        oralTip: "Distinguez EDA (analyse technique dans le notebook) du dashboard décisionnel (simulateur pour le CMO). Le jury vérifie que vous ne confondez pas les deux.",
        status: "required",
      },
      {
        id: "p2-perf-class",
        title: "Création de perf_class (classification)",
        paragraphs: [
          "Si la colonne perf_class est absente du CSV, load_data() la crée automatiquement avec pd.cut sur les quantiles de Sales.",
          "Cela garantit une répartition équilibrée ~33% par classe — important pour la classification.",
        ],
        codeRefs: [{ file: "src/preprocessing.py", detail: "pd.cut avec q33, q66 — lignes 44–50" }],
      },
    ],
    checklist: [
      { id: "c2-1", label: "Je connais la source Kaggle et le nombre de lignes" },
      { id: "c2-2", label: "Je peux citer 2 insights de l'EDA (ex: corrélation TV-Sales)" },
      { id: "c2-3", label: "Je sais comment perf_class est créé" },
      { id: "c2-4", label: "Je distingue EDA technique vs dashboard métier" },
    ],
  },
  {
    id: "phase-3",
    number: 3,
    title: "Préprocessing & anti-leakage",
    subtitle: "Pipeline sklearn, zéro fuite de données — EF1 / C3.1",
    icon: "Shield",
    rncp: ["C3.1", "C4.2"],
    ef: ["EF1"],
    presentationMinutes: "2–5 min (partie pipeline)",
    sections: [
      {
        id: "p3-pipeline",
        title: "Pipeline de transformation",
        table: {
          headers: ["Type", "Variables", "Étapes"],
          rows: [
            ["Numériques", "TV, Radio, Social Media", "Imputation médiane → StandardScaler"],
            ["Catégorielles", "Influencer", "Imputation mode → OneHotEncoder (drop-first)"],
          ],
        },
        codeRefs: [
          { file: "src/preprocessing.py", detail: "build_preprocessor() — lignes 56–70" },
          { file: "src/preprocessing.py", detail: "build_pipeline(model) — lignes 73–81" },
        ],
      },
      {
        id: "p3-leakage",
        title: "Anti data leakage — CRITIQUE pour le jury",
        paragraphs: [
          "Data leakage = utiliser des informations du test set pendant l'entraînement. Exemple d'erreur : calculer la moyenne de TOUT le dataset pour imputer, puis splitter.",
          "Notre solution : ColumnTransformer + Pipeline sklearn. Le preprocessor est fit UNIQUEMENT sur X_train. Le test set ne voit que transform().",
        ],
        bullets: [
          "split_data() AVANT tout fit — 80/20, stratify sur perf_class",
          "random_state=42 pour reproductibilité",
          "splits.pkl sauvegarde les indices exacts — evaluate.py utilise le même test set",
          "À l'inférence (API/dashboard) : les pipelines sauvegardés (.pkl) appliquent les mêmes transformateurs",
        ],
        oralTip: "Phrase clé : « Toute transformation est encapsulée dans un Pipeline sklearn fit sur le train uniquement — c'est la garantie anti-leakage. »",
        status: "required",
      },
      {
        id: "p3-split",
        title: "Train / test split",
        bullets: [
          "80% train / 20% test",
          "Stratification sur perf_class même pour la régression → classes équilibrées",
          "RANDOM_STATE = 42 partout",
        ],
        codeRefs: [{ file: "src/preprocessing.py", detail: "split_data() — lignes 93–110" }],
      },
    ],
    checklist: [
      { id: "c3-1", label: "Je peux expliquer data leakage avec un exemple concret" },
      { id: "c3-2", label: "Je connais les étapes numériques vs catégorielles" },
      { id: "c3-3", label: "Je sais pourquoi OneHotEncoder drop-first" },
      { id: "c3-4", label: "Je peux expliquer le rôle de splits.pkl" },
    ],
  },
  {
    id: "phase-4",
    number: 4,
    title: "Modélisation multi-algorithmes",
    subtitle: "4 modèles + MLP, tuning, deux stacks — EF2 / C4.2",
    icon: "Brain",
    rncp: ["C4.2"],
    ef: ["EF2"],
    presentationMinutes: "5–10 min",
    sections: [
      {
        id: "p4-regression",
        title: "Modèles de régression (stack FastAPI)",
        table: {
          headers: ["Modèle", "Clé", "Tuning", "Rôle pédagogique"],
          rows: [
            ["Régression linéaire", "linear_regression", "Aucun (baseline)", "Interprétable, extrapole hors bornes"],
            ["Random Forest", "random_forest", "RandomizedSearchCV 15×5", "Meilleur R², capture non-linéarités"],
            ["Gradient Boosting", "gradient_boosting", "RandomizedSearchCV 15×5", "XGBoost si dispo, sinon sklearn GB"],
            ["MLP (Deep Learning)", "mlp", "RandomizedSearchCV 15×5", "Obligatoire — 64→32 neurones, early stopping"],
          ],
        },
        codeRefs: [
          { file: "src/train.py", detail: "define_models() + tune() — entraîne les 4 modèles de régression de l'API" },
          { file: "src/models.py", detail: "entraîne UNIQUEMENT la pile de classification (perf_class)" },
        ],
      },
      {
        id: "p4-classification",
        title: "Modèles de classification (bonus)",
        table: {
          headers: ["Modèle", "Clé", "Cible"],
          rows: [
            ["Régression logistique", "logistic_regression", "perf_class"],
            ["Random Forest", "random_forest", "perf_class"],
            ["Gradient Boosting", "gradient_boosting", "perf_class"],
            ["MLP Classifier", "mlp", "perf_class"],
          ],
        },
        status: "bonus",
      },
      {
        id: "p4-tuning",
        title: "Hyperparamètres & RandomizedSearchCV",
        bullets: [
          "15 itérations × 5 folds = compromis temps/performance (CV = Cross-Validation, validation croisée)",
          "Scoring régression : neg_root_mean_squared_error · Scoring classification : f1_macro",
          "XGBoost (eXtreme Gradient Boosting) avec repli sur sklearn GradientBoosting si le package est absent (robustesse Docker)",
          "MLP : hidden_layer_sizes, alpha, learning_rate_init tunés",
          "Progression pédagogique : Linear → RF → GB → MLP",
        ],
        oralTip: "Le sujet dit : « L'objectif n'est pas le meilleur score, mais de comprendre POURQUOI un modèle est meilleur. » Préparez cette phrase.",
      },
      {
        id: "p4-dl-justification",
        title: "Justification du Deep Learning (MLP)",
        paragraphs: [
          "Le MLP (Multi-Layer Perceptron = perceptron multicouche) est obligatoire. Il performe bien (R² test = 0.9925) mais reste en dessous de RF (0.9971) et GB (0.9969) sur ce jeu synthétique très structuré.",
          "Conclusion défendable : le Deep Learning apporte de la flexibilité mais coûte plus cher en calcul et risque l'overfitting (sur-apprentissage) sur des jeux de taille modérée. Ici, les modèles à arbres suffisent.",
        ],
        bullets: [
          "Architecture : 2 couches cachées 64 → 32 neurones, activation ReLU, optimiseur Adam",
          "Compromis biais/variance : MLP plus flexible → variance plus élevée → risque d'overfitting",
          "Early stopping (arrêt précoce) + validation_fraction=0.1 pour limiter le sur-apprentissage",
          "Courbes d'apprentissage MLP dans figures/ — preuve visuelle",
        ],
        status: "required",
      },
      {
        id: "p4-artifacts",
        title: "Artefacts sauvegardés",
        bullets: [
          "models/{nom}.pkl — pipeline complet (preprocessor + modèle)",
          "models/splits.pkl — indices train/test",
          "models/model_list.json — ordre de chargement API",
          "models/cv_results.json — R² CV moyen ± écart-type",
          "models/pipeline_classification.pkl + label_encoder.pkl — pile de classification",
        ],
      },
    ],
    checklist: [
      { id: "c4-1", label: "Je peux nommer les 4 modèles régression et leur rôle" },
      { id: "c4-2", label: "Je sais pourquoi MLP est obligatoire et comment on le justifie" },
      { id: "c4-3", label: "Je connais RandomizedSearchCV (15 iter, 5 folds)" },
      { id: "c4-4", label: "Je peux expliquer la différence train.py vs models.py" },
    ],
  },
  {
    id: "phase-5",
    number: 5,
    title: "Évaluation & interprétabilité",
    subtitle: "Métriques, CV, erreurs, SHAP — EF3 / C4.3",
    icon: "BarChart3",
    rncp: ["C4.3"],
    ef: ["EF3"],
    presentationMinutes: "10–14 min",
    sections: [
      {
        id: "p5-metrics-reg",
        title: "Métriques régression",
        table: {
          headers: ["Métrique", "Nom complet & signification", "Meilleur (Random Forest)"],
          rows: [
            ["R²", "Coefficient de détermination — % de variance expliquée (1 = parfait)", "0.9971 (test)"],
            ["MAE", "Mean Absolute Error — erreur absolue moyenne (en M$)", "2.82 M$"],
            ["RMSE", "Root Mean Squared Error — erreur quadratique, pénalise les gros écarts", "5.05 M$"],
            ["CV R²", "R² en validation croisée 5 folds (± écart-type) — stabilité", "0.9965 ± 0.0028"],
          ],
        },
        oralTip: "Random Forest est le meilleur modèle sur le test (R² = 0.9971) ET en validation croisée (0.9965) → c'est lui que l'API sélectionne par défaut. Le Gradient Boosting suit de très près (R² = 0.9969). R² aussi proche de 1 est attendu sur des données synthétiques — la généralisation sur des données réelles bruitées serait plus difficile.",
      },
      {
        id: "p5-metrics-clf",
        title: "Métriques classification (perf_class : Low / Medium / High)",
        table: {
          headers: ["Métrique", "Nom complet & signification", "Meilleur (GB & Logistique)"],
          rows: [
            ["Accuracy", "Exactitude — % de prédictions correctes", "0.9737 (97.4 %)"],
            ["F1-macro", "Moyenne harmonique précision/rappel, par classe (équilibré)", "0.9736"],
            ["ROC-AUC", "Receiver Operating Characteristic — Area Under Curve : capacité de discrimination", "0.999 (GB)"],
          ],
        },
        oralTip: "Attention : pour la classification, ce sont le Gradient Boosting et la Régression Logistique qui sont à égalité en tête (97.4 %), pas le Random Forest (97.05 %). Ne confondez pas le meilleur modèle de régression (RF) et de classification (GB/Logistique).",
        status: "bonus",
      },
      {
        id: "p5-evaluation-script",
        title: "Script evaluate.py",
        bullets: [
          "Recharge splits.pkl → même test set que train.py",
          "Génère figures/ : R² comparison, résidus, confusion matrix, learning curves",
          "Permutation importance (agnostique modèle — recommandé EF3)",
          "SHAP optionnel : python src/evaluate.py --shap (TreeExplainer sur RF)",
          "Export CSV : metrics_regression.csv, metrics_classification.csv",
        ],
        codeRefs: [{ file: "src/evaluate.py", detail: "evaluate_regression() + evaluate_classification()" }],
      },
      {
        id: "p5-interpretability",
        title: "Interprétabilité — 3 niveaux",
        table: {
          headers: ["Technique", "Niveau", "Où dans le projet"],
          rows: [
            ["feature_importances_ (intrinsèque)", "Basique (modèles à arbres)", "API /feature-importance, page Drivers Next.js"],
            ["Permutation Importance", "Recommandé (agnostique au modèle)", "evaluate.py, page Drivers Next.js"],
            ["SHAP (SHapley Additive exPlanations)", "Avancé (théorie des jeux)", "evaluate.py --shap (TreeExplainer)"],
          ],
        },
        bullets: [
          "TV est de très loin le canal le plus important (r = 0.9995 avec Sales)",
          "L'influenceur a un impact quasi nul sur les ventes prédites (artefact des données synthétiques)",
          "Honnêteté attendue par le jury : dans un cas réel, l'importance serait bien plus équilibrée entre canaux",
          "Répondre aux questions métier du sujet : quel canal contribue le plus ? L'influenceur compte-t-il ?",
        ],
      },
      {
        id: "p5-errors",
        title: "Analyse des erreurs",
        bullets: [
          "Graphique des résidus du meilleur modèle, la Forêt Aléatoire (figures/residuals_best.png)",
          "Matrice de confusion de la classification (erreurs entre Low / Medium / High)",
          "Courbes d'apprentissage MLP (perte + score de validation par époque)",
          "Hors bornes d'entraînement : les arbres plafonnent (pas d'extrapolation) → le dashboard signale le dépassement et recommande la régression linéaire",
        ],
      },
    ],
    checklist: [
      { id: "c5-1", label: "Je connais R², MAE, RMSE et ce qu'ils signifient" },
      { id: "c5-2", label: "Je peux interpréter la matrice de confusion" },
      { id: "c5-3", label: "Je sais expliquer feature importance vs permutation vs SHAP" },
      { id: "c5-4", label: "J'ai généré les figures (python src/evaluate.py)" },
    ],
  },
  {
    id: "phase-6",
    number: 6,
    title: "Dashboard & visualisation",
    subtitle: "Tableau de bord Next.js, outil décisionnel — EF4 / C3.2",
    icon: "LayoutDashboard",
    rncp: ["C3.2"],
    ef: ["EF4"],
    presentationMinutes: "14–18 min (démo)",
    sections: [
      {
        id: "p6-pages",
        title: "Pages du tableau de bord (Next.js / React)",
        paragraphs: [
          "Le dashboard interactif exigé par le sujet est réalisé avec Next.js 14 (framework React), TypeScript, Tailwind CSS et Recharts (graphiques). Il communique exclusivement avec l'API FastAPI via des appels fetch.",
        ],
        table: {
          headers: ["Page", "Fonction", "Public visé"],
          rows: [
            ["Dashboard (/dashboard)", "KPI agrégés, distribution des ventes, ROI par influenceur", "CMO / direction"],
            ["Models (/models)", "Métriques régression + classification, courbes d'apprentissage", "Data scientist"],
            ["Drivers (/feature-importance)", "Importance des variables (intrinsèque + permutation)", "CMO / direction"],
            ["Predict (/predict)", "Saisie d'une campagne → prédiction des ventes + comparaison des 4 modèles", "CMO"],
            ["Simulator (/simulator)", "Sliders TV/Radio/Social → comparaison des modèles en temps réel", "CMO ⭐"],
            ["Set Goal (/target-planner)", "Objectif de ventes → budget optimal (SLSQP) + probabilité d'atteinte (RF)", "CMO ⭐"],
            ["Analytics (/analytics)", "Statistiques par variable (quartiles, IQR, valeurs aberrantes)", "Analyste"],
          ],
        },
        codeRefs: [
          { file: "dashboard-next/app/", detail: "une page par route (App Router) — démarrage : npm run dev" },
          { file: "dashboard-next/lib/api.ts", detail: "tous les appels fetch vers l'API FastAPI" },
        ],
        oralTip: "Pour la démo, montrez le Simulateur ET le Target Planner — ce sont les fonctionnalités « wow » orientées décision. Insistez : aucun code à toucher, le CMO manipule des curseurs.",
        status: "required",
      },
      {
        id: "p6-architecture",
        title: "Architecture front-end & navigation",
        bullets: [
          "Next.js 14 App Router — rendu côté client (« use client ») pour l'interactivité",
          "Navigation groupée : Tools (Predict, Optimize, Set Goal), Analytics (Dashboard, Models, Drivers), Defense (ce guide RNCP)",
          "Recharts pour les graphiques, Framer Motion pour les animations, thème clair/sombre",
          "SPA (Single-Page Application) qui consomme l'API REST → architecture proche d'un vrai produit industrialisable",
          "i18n (internationalisation) FR / EN via fichiers messages/",
        ],
      },
      {
        id: "p6-demo-script",
        title: "Script de démo recommandé (5 min)",
        bullets: [
          "1. Ouvrir le Simulateur (/simulator) — budgets par défaut → montrer la prédiction du Random Forest",
          "2. Augmenter Social Media de 50 % → montrer l'impact sur les ventes et le ROI",
          "3. Changer l'influenceur Mega → Nano → effet catégoriel (ici quasi nul → bon point d'honnêteté)",
          "4. Comparer les 4 modèles côte à côte (Predict)",
          "5. Target Planner : « Je veux 200 M$ de ventes » → budget optimal calculé (SLSQP)",
          "6. Montrer la page Models avec les métriques de validation croisée",
        ],
      },
    ],
    checklist: [
      { id: "c6-1", label: "Je peux lancer le dashboard Next.js et naviguer toutes les pages" },
      { id: "c6-2", label: "J'ai répété la démo Simulateur + Target Planner" },
      { id: "c6-3", label: "Je distingue dashboard métier (décision) vs graphes EDA (analyse)" },
      { id: "c6-4", label: "Je connais le rôle de chaque page et le public visé" },
    ],
  },
  {
    id: "phase-7",
    number: 7,
    title: "API REST & déploiement",
    subtitle: "FastAPI, Docker, industrialisation — EF5 / C4.1",
    icon: "Server",
    rncp: ["C4.1"],
    ef: ["EF5"],
    presentationMinutes: "mention en démo ou Q&R",
    sections: [
      {
        id: "p7-endpoints",
        title: "Endpoints FastAPI",
        table: {
          headers: ["Méthode", "Route", "Description"],
          rows: [
            ["GET", "/health", "État du service + modèles chargés ✅ requis sujet"],
            ["POST", "/predict", "Meilleur modèle (Random Forest) + ROI ✅ requis sujet"],
            ["POST", "/predict/all", "Les 4 modèles en parallèle (simulateur)"],
            ["GET", "/metrics", "Métriques test + CV (régression)"],
            ["GET", "/metrics/val-test", "Comparaison validation croisée vs test"],
            ["GET", "/metrics/classification", "Métriques des 4 classifieurs"],
            ["GET", "/stats", "KPI agrégés du dataset"],
            ["GET", "/analytics", "Stats par variable (quartiles, IQR, valeurs aberrantes)"],
            ["GET", "/feature-importance", "Importance des variables (meilleur modèle à arbres)"],
            ["GET", "/simulate/tv-sweep", "Balayage du budget TV (impact marginal)"],
            ["POST", "/classify", "Classification perf_class + indice de confiance"],
            ["POST", "/optimize", "Budget optimal pour une cible de ventes (SLSQP)"],
            ["POST", "/probability", "P(Sales ≥ objectif) via les arbres du RF"],
            ["GET", "/docs", "Swagger OpenAPI — documentation auto-générée"],
          ],
        },
        codeRefs: [{ file: "api/main.py", detail: "lifespan FastAPI : charge models/*.pkl une seule fois au démarrage" }],
        status: "bonus",
      },
      {
        id: "p7-docker",
        title: "Docker & industrialisation",
        bullets: [
          "docker-compose up --build → API :8000 + Next.js :3000",
          "Dockerfile.api : entraîne les modèles PENDANT le build (python src/train.py)",
          "Healthcheck sur /health avant de démarrer le frontend",
          "environment.api.yml : conda env reproductible Python 3.11",
        ],
        codeRefs: [
          { file: "docker-compose.yml", detail: "Services api + web" },
          { file: "Dockerfile.api", detail: "Build avec entraînement intégré" },
        ],
      },
      {
        id: "p7-architecture",
        title: "Architecture full-stack",
        paragraphs: [
          "CSV → preprocessing.py → train.py → models/*.pkl → api/main.py (lifespan) → dashboard-next (fetch API)",
          "next.config.js proxy /api/* → localhost:8000 (dev) ou http://api:8000 (Docker)",
        ],
      },
    ],
    checklist: [
      { id: "c7-1", label: "Je connais /health et /predict (exigences sujet)" },
      { id: "c7-2", label: "Je peux montrer /docs Swagger" },
      { id: "c7-3", label: "Je sais lancer docker-compose up --build" },
      { id: "c7-4", label: "Je peux expliquer le flux requête → prédiction" },
    ],
  },
  {
    id: "phase-8",
    number: 8,
    title: "Questions jury & pièges",
    subtitle: "Anticiper les 30 min d'échanges",
    icon: "MessageCircle",
    rncp: ["Tous"],
    ef: ["Tous"],
    sections: [
      {
        id: "p8-traps",
        title: "Pièges fréquents — à éviter",
        bullets: [
          "❌ Confondre EDA et dashboard décisionnel",
          "❌ Ne pas savoir expliquer data leakage",
          "❌ Dire « le MLP est le meilleur » alors que RF l'est — soyez honnêtes",
          "❌ Ne pas connaître les métriques utilisées",
          "❌ Démo qui plante — toujours tester avant",
          "❌ Ignorer les limites (données synthétiques, extrapolation)",
        ],
      },
    ],
    checklist: [
      { id: "c8-1", label: "J'ai relu les 20 questions jury ci-dessous" },
      { id: "c8-2", label: "Chaque membre du binôme a répondu à 5 questions à voix haute" },
      { id: "c8-3", label: "On a un plan B si la démo échoue (screenshots / vidéo)" },
    ],
  },
];

export const JURY_QUESTIONS: JuryQuestion[] = [
  {
    category: "Data & preprocessing",
    question: "Qu'est-ce que le data leakage et comment l'avez-vous évité ?",
    answer: "Le data leakage, c'est quand des informations du test influencent l'entraînement, par exemple imputer avec la moyenne globale. Nous mettons imputation, scaling et encodage dans un ColumnTransformer sklearn, fit uniquement sur X_train via Pipeline. splits.pkl garantit le même test set pour train et evaluate.",
    relatedPhase: "phase-3",
  },
  {
    category: "Data & preprocessing",
    question: "Pourquoi StandardScaler et pas MinMaxScaler ?",
    answer: "StandardScaler centre (moyenne 0) et ramène à une variance unitaire (écart-type 1). Utile quand les features ont des échelles très différentes (TV 10–100 M$, Radio 0–49, Social 0–14). Les modèles linéaires et le MLP en ont besoin pour converger. Les arbres s'en passent, mais on garde un pipeline unifié.",
    relatedPhase: "phase-3",
  },
  {
    category: "Modélisation",
    question: "Pourquoi Random Forest est-il meilleur que le MLP ici ?",
    answer: "Sur ce jeu synthétique tabulaire, les arbres capturent les seuils et les interactions sans configuration complexe. Le MLP a beaucoup plus de paramètres à estimer et coûte plus cher en calcul. R² test = 0.9925 pour le MLP contre 0.9971 pour le Random Forest (meilleur modèle) et 0.9969 pour le Gradient Boosting.",
    relatedPhase: "phase-4",
  },
  {
    category: "Modélisation",
    question: "Pourquoi RandomizedSearchCV et pas GridSearchCV ?",
    answer: "15 combinaisons aléatoires × 5 folds suffisent pour explorer l'espace des hyperparamètres sans faire exploser le temps de calcul. GridSearch testerait toutes les combinaisons, trop long pour un MVP.",
    relatedPhase: "phase-4",
  },
  {
    category: "Modélisation",
    question: "Pourquoi avoir deux scripts d'entraînement (train.py et models.py) ?",
    answer: "train.py produit les 4 pipelines sklearn monolithiques de régression (préprocesseur + modèle) servis par l'API. models.py entraîne uniquement la pile de classification (modèles + préprocesseur + label encoder) consommée par l'endpoint /classify. Le module preprocessing.py est partagé par les deux.",
    relatedPhase: "phase-4",
  },
  {
    category: "Évaluation",
    question: "R² ≈ 0.997, n'est-ce pas suspect ?",
    answer: "Oui, c'est attendu sur des données synthétiques très régulières — la TV corrèle à 0.9995 avec les ventes. Avec des campagnes réelles et du bruit, les scores seraient plus bas. On le dit explicitement dans le bilan critique (limite assumée).",
    relatedPhase: "phase-5",
  },
  {
    category: "Évaluation",
    question: "Quelle est la différence entre feature importance et permutation importance ?",
    answer: "Feature importance (arbres) : mesure interne basée sur la réduction d'impureté, rapide mais biaisée si les features sont corrélées. Permutation importance : on mélange une feature et on mesure la chute de performance. Plus fiable, recommandé par le sujet.",
    relatedPhase: "phase-5",
  },
  {
    category: "Évaluation",
    question: "Qu'est-ce que SHAP et l'avez-vous utilisé ?",
    answer: "SHAP attribue à chaque feature sa contribution à chaque prédiction (théorie des jeux). Disponible via python src/evaluate.py --shap avec TreeExplainer sur Random Forest.",
    relatedPhase: "phase-5",
  },
  {
    category: "Dashboard & métier",
    question: "En quoi votre dashboard est-il orienté métier et pas juste de l'EDA ?",
    answer: "Le Simulateur et le Target Planner permettent au CMO de tester des scénarios (+10 % Social Media par exemple) et d'obtenir une prédiction sans toucher au code. L'EDA (analyse technique) reste dans le notebook et les pages Dashboard / Analytics, distinctes des outils de décision.",
    relatedPhase: "phase-6",
  },
  {
    category: "Dashboard & métier",
    question: "Comment fonctionne le Target Planner ?",
    answer: "Optimisation inverse : on minimise l'écart à l'objectif de ventes sous la contrainte d'un budget maximal. scipy.optimize.minimize avec l'algorithme SLSQP (Sequential Least Squares Programming), exposé par POST /optimize. Analyse probabiliste (POST /probability) : chaque arbre du Random Forest produit une prédiction, on en déduit la distribution et P(Sales ≥ objectif).",
    relatedPhase: "phase-6",
  },
  {
    category: "API & déploiement",
    question: "Comment l'API charge-t-elle les modèles ?",
    answer: "Au démarrage, le lifespan FastAPI lit model_list.json, charge chaque .pkl avec joblib, plus splits.pkl et cv_results.json. Les modèles restent en mémoire. /health confirme qu'ils sont prêts.",
    relatedPhase: "phase-7",
  },
  {
    category: "API & déploiement",
    question: "Que se passe-t-il si on entre des budgets hors des bornes d'entraînement ?",
    answer: "Les modèles à arbres ne peuvent pas extrapoler : ils renvoient la valeur de la feuille la plus proche et sous-estiment les ventes. Le tableau de bord signale visuellement le dépassement (avertissement d'extrapolation) et la régression linéaire — seul modèle capable d'extrapoler — est recommandée pour ces cas. Limite documentée.",
    relatedPhase: "phase-7",
  },
  {
    category: "RNCP / général",
    question: "Pourquoi 4572 lignes alors que le sujet dit ~200 ?",
    answer: "Même source Kaggle, mêmes variables. On utilise marketing_labelled.csv enrichi avec perf_class pré-calculé. load_data() reste compatible avec le CSV brut du sujet.",
    relatedPhase: "phase-2",
  },
  {
    category: "RNCP / général",
    question: "Quelles compétences RNCP Bloc 2 ce projet valide-t-il ?",
    answer: "C3.1 préparation données (pipeline sklearn), C3.2 visualisation décisionnelle, C3.3 EDA (notebook), C4.1 intégration IA (API, Docker, cas CMO), C4.2 modèles prédictifs (4 algos + MLP), C4.3 évaluation comparative (métriques, interprétabilité).",
    relatedPhase: "phase-0",
  },
  {
    category: "RNCP / général",
    question: "Quelles améliorations en production ?",
    answer: "Données réelles avec drift monitoring, réentraînement périodique (MLOps), authentification API, cache Redis, CI/CD, A/B testing des recommandations, feature store pour l'historique campagnes.",
    relatedPhase: "phase-7",
  },
  {
    category: "Modélisation",
    question: "Pourquoi stratifier le split sur perf_class même pour la régression ?",
    answer: "Pour que train et test aient la même proportion de campagnes Low, Medium et High. Ça stabilise l'évaluation et permet d'entraîner la classification sur le même split.",
    relatedPhase: "phase-3",
  },
  {
    category: "Évaluation",
    question: "Pourquoi la classification si le sujet demande une seule tâche ?",
    answer: "La régression Sales est la tâche principale. La classification perf_class est un bonus : le CMO peut savoir si une config sera High ou Low performance. Complémentaire, pas substitut.",
    relatedPhase: "phase-1",
  },
  {
    category: "Dashboard & métier",
    question: "Pourquoi avoir choisi Next.js comme dashboard ?",
    answer: "Le sujet exige un dashboard interactif. Nous avons choisi Next.js (React) plutôt que Streamlit pour livrer une vraie couche produit : une Single-Page Application qui consomme l'API REST FastAPI, avec une architecture full-stack proche d'un produit industrialisable (routing, composants réutilisables, i18n, thème). Toute la logique de prédiction reste côté API, le front ne fait qu'afficher.",
    relatedPhase: "phase-6",
  },
  {
    category: "Data & preprocessing",
    question: "Pourquoi OneHotEncoder avec drop='first' ?",
    answer: "Évite la multicolinéarité parfaite (dummy variable trap). Avec 4 tiers d'influenceur, on encode 3 dummies, le 4e est la référence. handle_unknown='ignore' gère les nouvelles catégories à l'inférence.",
    relatedPhase: "phase-3",
  },
  {
    category: "Évaluation",
    question: "Comment validez-vous que le modèle ne sur-apprend pas ?",
    answer: "Hold-out test 20 % (jeu jamais vu à l'entraînement), validation croisée 5 folds (écart-type ≈ ±0.003), courbes d'apprentissage MLP train/validation, et comparaison validation vs test dans metrics_val_test.csv. L'écart R² CV vs test reste < 0.002 pour tous les modèles.",
    relatedPhase: "phase-5",
  },
];

export const COMMANDS_CHEATSHEET = [
  { cmd: "pip install -r requirements.txt", desc: "Installer dépendances Python" },
  { cmd: "python src/train.py", desc: "Entraîner les 4 modèles de régression (API)" },
  { cmd: "python src/models.py", desc: "Entraîner la pile de classification" },
  { cmd: "python src/evaluate.py", desc: "Métriques + figures" },
  { cmd: "python src/evaluate.py --shap", desc: "Métriques + SHAP (lent)" },
  { cmd: "uvicorn api.main:app --reload --port 8000", desc: "Lancer l'API FastAPI" },
  { cmd: "cd dashboard-next && npm run dev", desc: "Lancer le dashboard Next.js :3000" },
  { cmd: "docker-compose up --build", desc: "Stack complète Docker" },
  { cmd: "python main.py", desc: "Menu CLI orchestrateur" },
];

export type GlossaryTerm = {
  term: string;
  full: string;
  definition: string;
  category: "ML & modèles" | "Métriques" | "Données & pipeline" | "Architecture & déploiement" | "Métier & projet";
};

/**
 * Glossaire — sens complet des sigles et termes techniques.
 * Objectif : pouvoir expliquer CHAQUE mot du projet au jury, sans hésitation.
 */
export const GLOSSARY: GlossaryTerm[] = [
  // ── ML & modèles ──
  { term: "ML", full: "Machine Learning — apprentissage automatique", definition: "Famille de méthodes où un algorithme apprend des règles à partir de données (exemples), au lieu d'être programmé explicitement.", category: "ML & modèles" },
  { term: "DL", full: "Deep Learning — apprentissage profond", definition: "Sous-domaine du ML basé sur les réseaux de neurones à plusieurs couches. Ici représenté par le MLP. Obligatoire dans le sujet.", category: "ML & modèles" },
  { term: "OLS / Régression linéaire", full: "Ordinary Least Squares — moindres carrés ordinaires", definition: "Modèle de référence (baseline). Ajuste une droite/un plan en minimisant la somme des carrés des écarts. Seul modèle capable d'extrapoler hors des bornes vues.", category: "ML & modèles" },
  { term: "RF / Forêt Aléatoire", full: "Random Forest", definition: "Ensemble (bagging) de nombreux arbres de décision entraînés sur des sous-échantillons aléatoires. Réduit la variance. Notre meilleur modèle de régression (R² = 0.9971).", category: "ML & modèles" },
  { term: "GB", full: "Gradient Boosting — gradient boosté", definition: "Ensemble séquentiel : chaque nouvel arbre corrige les erreurs des précédents. Très performant (R² = 0.9969 ici), 2ᵉ derrière le RF.", category: "ML & modèles" },
  { term: "XGBoost", full: "eXtreme Gradient Boosting", definition: "Implémentation optimisée et populaire du Gradient Boosting. Repli automatique sur le GradientBoosting de scikit-learn si le package est absent.", category: "ML & modèles" },
  { term: "MLP", full: "Multi-Layer Perceptron — perceptron multicouche", definition: "Réseau de neurones entièrement connecté. Notre Deep Learning : 2 couches cachées 64 → 32 neurones, activation ReLU, optimiseur Adam, early stopping.", category: "ML & modèles" },
  { term: "Bagging", full: "Bootstrap Aggregating", definition: "Technique d'ensemble : entraîner plusieurs modèles sur des tirages aléatoires des données puis moyenner. Principe du Random Forest.", category: "ML & modèles" },
  { term: "Boosting", full: "Renforcement séquentiel", definition: "Technique d'ensemble où les modèles sont ajoutés l'un après l'autre, chacun corrigeant les erreurs résiduelles du précédent.", category: "ML & modèles" },
  { term: "ReLU", full: "Rectified Linear Unit — unité linéaire rectifiée", definition: "Fonction d'activation f(x) = max(0, x) utilisée dans les couches cachées du MLP. Simple et efficace contre le problème du gradient qui disparaît.", category: "ML & modèles" },
  { term: "Adam", full: "Adaptive Moment Estimation", definition: "Algorithme d'optimisation qui adapte le pas d'apprentissage par paramètre. Utilisé pour entraîner le MLP.", category: "ML & modèles" },
  { term: "Early stopping", full: "Arrêt précoce", definition: "On arrête l'entraînement du MLP dès que la performance sur un jeu de validation interne cesse de s'améliorer, pour éviter l'overfitting.", category: "ML & modèles" },
  { term: "Overfitting", full: "Sur-apprentissage", definition: "Le modèle mémorise le bruit du jeu d'entraînement et généralise mal sur de nouvelles données. Détecté par un écart train/test important.", category: "ML & modèles" },
  { term: "Hyperparamètre", full: "Paramètre de configuration", definition: "Réglage fixé AVANT l'entraînement (nombre d'arbres, profondeur, taux d'apprentissage…). Optimisé ici par RandomizedSearchCV.", category: "ML & modèles" },
  { term: "Biais / Variance", full: "Compromis biais-variance", definition: "Biais = erreur systématique (modèle trop simple). Variance = sensibilité aux données (modèle trop complexe). Le bon modèle équilibre les deux.", category: "ML & modèles" },

  // ── Métriques ──
  { term: "R²", full: "Coefficient de détermination", definition: "Proportion de la variance des ventes expliquée par le modèle. 1 = parfait, 0 = pas mieux que la moyenne. Métrique principale de sélection (en CV).", category: "Métriques" },
  { term: "MAE", full: "Mean Absolute Error — erreur absolue moyenne", definition: "Moyenne des écarts absolus |réel − prédit|. Directement interprétable en M$. RF : 2.82 M$.", category: "Métriques" },
  { term: "RMSE", full: "Root Mean Squared Error — racine de l'erreur quadratique moyenne", definition: "Racine de la moyenne des carrés des erreurs. Pénalise davantage les grosses erreurs que la MAE. RF : 5.05 M$.", category: "Métriques" },
  { term: "CV", full: "Cross-Validation — validation croisée", definition: "On découpe le train en 5 parts (folds), on entraîne sur 4 et valide sur 1, en tournant. Donne une performance moyenne ± écart-type, plus robuste.", category: "Métriques" },
  { term: "Accuracy", full: "Exactitude", definition: "% de prédictions correctes en classification. Meilleur ici : 97.4 % (GB & Logistique).", category: "Métriques" },
  { term: "F1-macro", full: "Score F1 moyenné par classe", definition: "Moyenne harmonique de la précision et du rappel, calculée par classe puis moyennée. Équitable même si les classes sont déséquilibrées.", category: "Métriques" },
  { term: "Précision / Rappel", full: "Precision / Recall", definition: "Précision = parmi les prédits positifs, combien sont corrects. Rappel = parmi les vrais positifs, combien sont retrouvés.", category: "Métriques" },
  { term: "ROC-AUC", full: "Area Under the Receiver Operating Characteristic Curve", definition: "Aire sous la courbe ROC : capacité du modèle à séparer les classes (1 = parfait, 0.5 = hasard). Ici ≈ 0.999.", category: "Métriques" },
  { term: "Résidus", full: "Erreurs de prédiction", definition: "Différence réel − prédit. On les trace pour vérifier qu'ils sont centrés sur zéro et homogènes (homoscédasticité), signe d'un bon modèle.", category: "Métriques" },

  // ── Données & pipeline ──
  { term: "EDA", full: "Exploratory Data Analysis — analyse exploratoire des données", definition: "Étape d'exploration : distributions, corrélations, valeurs manquantes, outliers. Réalisée dans le notebook 01_eda.ipynb.", category: "Données & pipeline" },
  { term: "Data leakage", full: "Fuite de données", definition: "Erreur où des informations du jeu de test influencent l'entraînement (ex : normaliser sur tout le dataset avant de splitter). Évité ici en fit-ant le préprocesseur uniquement sur le train.", category: "Données & pipeline" },
  { term: "Pipeline", full: "Chaîne de traitement sklearn", definition: "Objet qui enchaîne préprocessing + modèle en une seule unité. Garantit que les mêmes transformations s'appliquent à l'entraînement et à l'inférence.", category: "Données & pipeline" },
  { term: "ColumnTransformer", full: "Transformateur par colonnes", definition: "Applique des traitements différents selon le type de colonne (numérique vs catégorielle) au sein d'un même pipeline.", category: "Données & pipeline" },
  { term: "StandardScaler", full: "Normalisation centrée-réduite", definition: "Centre chaque variable numérique (moyenne 0) et la réduit (écart-type 1). Indispensable pour le MLP et les modèles linéaires.", category: "Données & pipeline" },
  { term: "OneHotEncoder", full: "Encodage one-hot (drop='first')", definition: "Transforme la variable catégorielle Influencer en colonnes binaires. drop='first' supprime une modalité pour éviter la multicolinéarité (dummy variable trap).", category: "Données & pipeline" },
  { term: "Imputation", full: "Remplacement des valeurs manquantes", definition: "Médiane pour les numériques, modalité la plus fréquente pour les catégorielles. Calculée sur le train uniquement.", category: "Données & pipeline" },
  { term: "Stratification", full: "Découpage stratifié", definition: "Le split train/test conserve la même proportion de classes (Low/Medium/High). Stabilise l'évaluation et permet d'entraîner la classification sur le même split.", category: "Données & pipeline" },
  { term: "perf_class", full: "Classe de performance", definition: "Cible de classification (Low / Medium / High) créée par découpage des ventes en terciles (quantiles 33 % et 66 %).", category: "Données & pipeline" },
  { term: "Feature importance", full: "Importance des variables", definition: "Mesure interne aux arbres (réduction d'impureté). Rapide mais biaisée si les variables sont corrélées.", category: "Données & pipeline" },
  { term: "Permutation importance", full: "Importance par permutation", definition: "On mélange aléatoirement une variable et on mesure la chute de performance. Agnostique au modèle, plus fiable — recommandée par le sujet.", category: "Données & pipeline" },
  { term: "SHAP", full: "SHapley Additive exPlanations", definition: "Méthode d'interprétabilité issue de la théorie des jeux : attribue à chaque variable sa contribution à CHAQUE prédiction. Via evaluate.py --shap (TreeExplainer).", category: "Données & pipeline" },

  // ── Architecture & déploiement ──
  { term: "API", full: "Application Programming Interface — interface de programmation", definition: "Point d'accès qui permet à d'autres programmes (ici le dashboard) de demander des prédictions au modèle via le réseau.", category: "Architecture & déploiement" },
  { term: "REST", full: "REpresentational State Transfer", definition: "Style d'architecture pour les API web : on appelle des routes (URLs) avec des méthodes HTTP (GET, POST) qui échangent du JSON.", category: "Architecture & déploiement" },
  { term: "FastAPI", full: "Framework API Python", definition: "Bibliothèque pour construire l'API REST. Validation automatique des entrées (Pydantic) et documentation auto-générée (Swagger /docs).", category: "Architecture & déploiement" },
  { term: "Swagger / OpenAPI", full: "Documentation interactive", definition: "Page /docs générée automatiquement par FastAPI : liste les endpoints et permet de les tester depuis le navigateur.", category: "Architecture & déploiement" },
  { term: "Pydantic", full: "Validation de schéma", definition: "Vérifie que les données reçues par l'API respectent le type et les bornes attendues (ex : TV ≥ 0, ≤ 500) avant de prédire.", category: "Architecture & déploiement" },
  { term: "Next.js", full: "Framework React", definition: "Technologie du tableau de bord web (TypeScript, Tailwind, Recharts). App Router, rendu interactif, consomme l'API REST.", category: "Architecture & déploiement" },
  { term: "SPA", full: "Single-Page Application", definition: "Application web qui se charge une fois puis met à jour le contenu dynamiquement, sans recharger la page. Donne une expérience fluide type produit.", category: "Architecture & déploiement" },
  { term: "Docker / Compose", full: "Conteneurisation", definition: "Empaquette l'app et ses dépendances dans des conteneurs reproductibles. docker-compose up --build lance l'API (8000) + le dashboard (3000).", category: "Architecture & déploiement" },
  { term: "SLSQP", full: "Sequential Least Squares Programming", definition: "Algorithme d'optimisation sous contraintes (scipy) utilisé par le Target Planner pour trouver le budget optimal atteignant un objectif de ventes.", category: "Architecture & déploiement" },
  { term: "Lifespan", full: "Cycle de vie FastAPI", definition: "Mécanisme qui charge les modèles .pkl une seule fois au démarrage de l'API et les garde en mémoire pour des réponses rapides.", category: "Architecture & déploiement" },
  { term: "MLOps", full: "Machine Learning Operations", definition: "Pratiques d'industrialisation du ML : surveillance de la dérive (data drift), réentraînement automatique, CI/CD. Cité en perspective.", category: "Architecture & déploiement" },

  // ── Métier & projet ──
  { term: "ROI", full: "Return On Investment — retour sur investissement", definition: "Ici : ventes prédites / budget total (ratio renvoyé par /predict). Indicateur clé pour le décideur marketing.", category: "Métier & projet" },
  { term: "CMO", full: "Chief Marketing Officer — directeur marketing", definition: "Utilisateur cible du produit : il alloue le budget entre canaux et veut maximiser les ventes. Le dashboard est pensé pour lui.", category: "Métier & projet" },
  { term: "MVP", full: "Minimum Viable Product — produit minimum viable", definition: "Version fonctionnelle la plus simple qui démontre la valeur. Cadre notre choix de scope (ex : RandomizedSearchCV plutôt que GridSearch exhaustif).", category: "Métier & projet" },
  { term: "RNCP", full: "Répertoire National des Certifications Professionnelles", definition: "Cadre officiel français des certifications. Notre projet valide le Bloc 2 du titre RNCP40875 (Expert en Ingénierie de Données).", category: "Métier & projet" },
  { term: "KPI", full: "Key Performance Indicator — indicateur clé", definition: "Chiffre de pilotage affiché sur le dashboard : ventes moyennes, ROI moyen, budget moyen, meilleur canal…", category: "Métier & projet" },
  { term: "EF1–EF5", full: "Étapes / Exigences Fonctionnelles", definition: "Découpage pédagogique du projet : données (EF1), modélisation (EF2), évaluation (EF3), dashboard (EF4), déploiement/API (EF5).", category: "Métier & projet" },
];
