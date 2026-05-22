# PROMPT COMPLET POUR GAMMA AI — ROI Intelligence

Copie-colle l'intégralité du bloc ci-dessous dans Gamma AI (mode "Paste text or outline").

---

## INSTRUCTIONS DE DESIGN — À inclure en tête de prompt

> **Design system à respecter sur toutes les slides :**
> Style : dashboard analytique sombre, professionnel, fintech/data science. Inspiré d'une interface d'analytics avancée.
> Fond principal : #0e1525 (bleu marine très sombre)
> Fond des cartes : #0f172a avec bordure subtile rgba(255,255,255,0.08)
> Couleur principale (accent) : #3b82f6 (bleu électrique)
> Couleur secondaire : #8b5cf6 (violet)
> Couleur tertiaire : #06b6d4 (cyan)
> Succès / positif : #10b981 (vert émeraude)
> Avertissement : #f59e0b (ambre)
> Texte principal : #e2e8f0 (blanc cassé)
> Texte secondaire : #64748b (gris ardoise)
> Police : Inter — titres en gras 700, corps en 400, chiffres en mono tabular
> Cartes : coins arrondis 12–16px, bordure légèrement lumineuse dans la couleur d'accent sur les slides clés
> Langage visuel : grandes métriques chiffrées, barres horizontales, diagrammes de flux, blocs icône+titre+description
> Éviter les dégradés bon marché — utiliser uniquement des dégradés sombres navy-à-navy ou navy-à-bleu subtil
> Aucune image stock générique — préférer des visualisations de données, schémas techniques, UI mockups sombres
> Format : 16:9, 10 slides

---

## SLIDES

---

### Slide 1 — TITRE

**Layout :** Titre centré en grand, sous-titre en dessous en bleu électrique, tagline en gris sous le sous-titre. Ligne séparatrice fine bleue. École + étudiants en bas de slide.

**Image à générer :** Fond sombre #0e1525 avec un halo radial bleu (#3b82f6) diffus partant du centre-droit. Motif abstrait géométrique en arrière-plan — lignes de circuit, nœuds de réseau de données, très subtil et basse opacité (< 15%). Effet professionnel, pas clipart.

**Contenu :**

# ROI Intelligence

**Optimisation du retour sur investissement marketing par le Machine Learning**

*Système de prédiction multi-modèles et tableau de bord décisionnel en temps réel*

---

Soutenance de projet · EFREI Paris · M1 Data Science & Intelligence Artificielle · Année universitaire 2025–2026

CHUEMBOU ADRIEN · QUANG DAT

---

### Slide 2 — PROBLÉMATIQUE

**Layout :** Titre en haut. Une phrase d'accroche italique sous le titre. Deux colonnes côte à côte séparées par un trait vertical lumineux — colonne gauche fond légèrement rouge/sombre, colonne droite fond légèrement bleu. Citation en bas centrée sur toute la largeur.

**Image à générer :** Colonne gauche : icône ou illustration d'un tableau Excel statique, flou ou grisé, symbolisant l'approche manuelle et empirique. Colonne droite : graphique de prédiction dynamique avec courbe bleue lumineuse et axe de données — style dashboard moderne.

**Contenu :**

## Problématique

*Les budgets publicitaires sont encore trop souvent alloués à l'intuition — pas à la donnée.*

**❌ Approche traditionnelle**
- Allocation empirique basée sur l'expérience passée
- Aucune corrélation mesurée entre budget investi et revenu généré
- Décisions prises a posteriori, après les campagnes
- Même budget, résultats imprévisibles selon les canaux utilisés
- Impossible de simuler l'impact avant d'engager les dépenses

**✅ Notre approche Machine Learning**
- Modèles entraînés sur 4 572 campagnes documentées
- Prédiction du chiffre d'affaires en temps réel selon le budget alloué
- 4 canaux analysés : TV, Radio, Social Media, Influenceur
- R² > 0.994 sur l'ensemble des modèles — corrélation quasi-parfaite
- Simulation live : ajustez le budget, le revenu s'affiche instantanément

> *L'enjeu : transformer une intuition budgétaire en décision data-driven, mesurable et reproductible.*

---

### Slide 3 — OBJECTIFS DU PROJET

**Layout :** Titre + accroche en haut. Grille 2×2 de cartes numérotées — chaque carte a un grand numéro coloré (bleu), une icône, un titre en blanc et une description courte en gris. Cartes avec bordure bleue subtile et coins arrondis.

**Image à générer :** 4 cartes sombres disposées en grille 2×2. Chaque carte a une icône vectorielle minimaliste dans la couleur d'accent correspondante : ① graphique en hausse (bleu), ② balance de comparaison (violet), ③ serveur/API (cyan), ④ tableau de bord (vert). Style flat design moderne sur fond sombre.

**Contenu :**

## Objectifs du projet

*Quatre ambitions concrètes, de la donnée brute à la décision business éclairée.*

**① Prédire**
Construire 4 modèles ML capables de prédire le chiffre d'affaires à partir du mix budgétaire TV · Radio · Social Media · Influenceur.

**② Comparer & Sélectionner**
Évaluer objectivement chaque modèle via validation croisée 5 plis (R², MAE, RMSE) et sélectionner automatiquement le plus performant.

**③ Exposer via API REST**
Déployer les modèles entraînés via une API FastAPI scalable, interrogeable en temps réel par n'importe quel client applicatif.

**④ Visualiser & Décider**
Proposer un dashboard interactif en 7 pages permettant de simuler, comparer et optimiser les allocations budgétaires marketing.

---

### Slide 4 — ARCHITECTURE DE LA SOLUTION

**Layout :** Titre + accroche. Pipeline vertical à 5 étapes connectées par des flèches lumineuses bleues. Chaque étape est un bloc/carte avec un label de couche en couleur, un titre et une description courte. Note architecturale en bas en gris italique.

**Image à générer :** Diagramme de flux vertical ou horizontal de style infrastructure moderne sur fond sombre. 5 blocs rectangulaires arrondis connectés par des flèches lumineuses bleues animées (effet data flow). Chaque bloc a une icône : base de données, engrenage, cerveau/ML, serveur, écran. Couleurs : bleu à violet en dégradé de gauche à droite sur les blocs.

**Contenu :**

## Architecture de la solution

*Une architecture modulaire en cinq couches, de la donnée brute à la décision business — chaque couche est indépendante et remplaçable.*

**[DONNÉES]** `data/Dummy Data HSS.csv`
4 572 lignes · 5 variables : TV budget, Radio budget, Social Media budget, Influencer tier, Sales (cible)

↓

**[PREPROCESSING]** `src/preprocessing.py`
sklearn Pipeline : imputation médiane + StandardScaler (numérique) · OneHotEncoder drop-first (Influencer : Mega / Macro / Micro / Nano)

↓

**[ENTRAÎNEMENT ML]** `src/train.py`
RandomizedSearchCV · 15 itérations · validation croisée 5 plis · 4 algorithmes en parallèle → artefacts .pkl (joblib)

↓

**[API REST]** `api/main.py` — FastAPI
6 endpoints : `/predict` · `/predict/all` · `/metrics` · `/feature-importance` · `/stats` · `/health` — chargement des modèles via lifespan

↓

**[DASHBOARD]** `dashboard-next/`
Next.js 14 · TypeScript · Tailwind CSS · Recharts · Framer Motion · 7 pages analytiques · mode clair/sombre · Docker-ready

> *Déployable en une commande : `docker-compose up` — API sur :8000, dashboard sur :3000.*

---

### Slide 5 — PIPELINE ML : DES DONNÉES À LA PRÉDICTION

**Layout :** Titre + accroche. Flow horizontal à 6 étapes numérotées, connectées par une ligne lumineuse bleue. Chaque étape = bulle ou hexagone avec numéro, nom de la fonction, et détail en dessous. Note technique en bas en encadré.

**Image à générer :** Pipeline horizontal data science style moderne sur fond sombre. 6 hexagones ou cercles numérotés (①②③④⑤⑥) connectés par une ligne bleue lumineuse avec effet de flux. Couleurs en dégradé bleu → violet → cyan de gauche à droite. Petites icônes dans chaque nœud : fichier CSV, engrenage, loupe, cerveau, serveur, écran.

**Contenu :**

## Pipeline ML : de la donnée brute à la prédiction en temps réel

*Chaque prédiction parcourt un pipeline rigoureusement validé — de la saisie brute jusqu'à l'inférence en moins de 50 ms.*

① `load_data()` → Chargement CSV · 4 572 lignes · validation du schéma de données

② `build_preprocessor()` → StandardScaler (TV, Radio, Social Media) + OneHotEncoder (Influencer 4 catégories)

③ `tune()` → RandomizedSearchCV · 15 itérations · 5-fold CV · optimisation R² en parallèle

④ `train_all()` → 4 modèles entraînés et sauvegardés en `.pkl` via joblib · `splits.pkl` préserve la séparation train/test

⑤ `api/main.py` → Chargement des modèles au démarrage (lifespan) · inférence REST < 50 ms par requête

⑥ Dashboard → Sliders budgétaires → appel API → prédiction affichée en temps réel sans rechargement de page

> *`models/splits.pkl` garantit la reproductibilité : les métriques sont toujours calculées sur le même jeu de test.*

---

### Slide 6 — LES 4 MODÈLES ML : PERFORMANCES COMPARÉES

**Layout :** Titre + accroche. À gauche : tableau de comparaison propre avec les 4 modèles et leurs métriques. À droite : graphique de barres horizontales des R² avec le Random Forest surligné en or/bleu. En dessous à droite : carte de highlight "Meilleur modèle" avec le score en grand.

**Image à générer :** À gauche : tableau sombre avec en-têtes en bleu, ligne "Random Forest" mise en évidence avec bordure bleue et badge "MEILLEUR". À droite : graphique à barres horizontales sombre, barre Random Forest en bleu électrique plus lumineuse que les autres (en gris). Style data visualization moderne. Carte metric en bas à droite : grand "0.9965" en bleu avec label R² et une mention "R² = 0.9965 · 99.65% de la variance expliquée".

**Contenu :**

## Les 4 modèles ML — Performances en validation croisée 5 plis

*Tous les modèles dépassent R² = 0.99 — le Random Forest s'impose comme référence avec la meilleure précision et la plus faible variance.*

| Modèle | R² moyen | Écart-type | Statut |
|---|---|---|---|
| 🏆 Random Forest | **0.9965** | ±0.0028 | **SÉLECTIONNÉ** |
| Gradient Boosting (XGBoost) | 0.9964 | ±0.0028 | — |
| Régression Linéaire | 0.9956 | ±0.0032 | — |
| MLP Neural Network | 0.9941 | ±0.0034 | — |

**🏆 Random Forest — R² = 0.9965**
Le modèle explique **99.65% de la variance des ventes**. Utilisé par défaut sur l'endpoint `/predict`.

L'hyperparamétrage par RandomizedSearchCV (15 itérations) optimise automatiquement `n_estimators`, `max_depth` et `min_samples_split` sans surapprentissage.

---

### Slide 7 — DASHBOARD : 7 PAGES D'INTELLIGENCE MARKETING

**Layout :** Titre + accroche. Grille de 7 cartes (4 en haut + 3 en bas), chaque carte avec une icône, un titre de page et une description d'une ligne. Cartes sombres avec bordure colorée selon la fonction (bleue, violette, cyan…).

**Image à générer :** Grille de 7 cartes UI sombres style "app navigation cards". Chaque carte simule une miniature de dashboard (fond #0f172a, quelques éléments visuels schématiques : graphiques, sliders, métriques). Icônes minimalistes en haut à gauche de chaque carte. Style cohérent avec le design system décrit. Effet glow subtil sur les bordures.

**Contenu :**

## Dashboard — 7 pages d'intelligence marketing

*De la prédiction brute à l'optimisation stratégique — chaque page répond à une question business précise.*

**📊 Accueil** — Vue d'ensemble globale · KPIs clés · matrice de corrélation entre canaux · benchmark de revenus

**🎯 Prévision des revenus** — Sliders budgétaires · prédiction temps réel · ROI · efficacité · consensus des 4 modèles

**⚙️ Optimiseur budgétaire** — Présets stratégiques (Balanced, TV Heavy, Digital, Lean) · courbe de sensibilité TV · comparaison des modèles

**🗺️ Planificateur cible** — Objectif de revenu → budget optimal par inversion de modèle + simulation Monte Carlo Random Forest

**🤖 Comparaison des modèles** — Métriques détaillées · diagramme radar · matrice de confusion · performances par classe

**💡 Insights & Corrélations** — Importance des features · corrélation par canal · ROI moyen par tier d'influenceur (Mega/Macro/Micro/Nano)

**📈 Feature Importance** — Classement SHAP · importance par permutation · corrélation canal-revenu avec statistiques détaillées

---

### Slide 8 — DÉMONSTRATION

**Layout :** Titre + accroche + exemple de cas réel. 3 étapes numérotées en ligne ou en colonne, chaque étape avec un encadré simulant une capture d'écran du dashboard (interface sombre).

**Image à générer :** 3 mockups de captures d'écran du dashboard sombre côte à côte ou empilés. Mockup 1 : sliders avec valeurs TV=90M, Radio=10M, Social=2M. Mockup 2 : carte de résultat avec un grand chiffre de revenu prédit en bleu, ROI en vert. Mockup 3 : graphique de comparaison des 4 modèles en barres colorées. Effet de cadre lumineux bleu autour de chaque mockup.

**Contenu :**

## Démonstration — du budget au ROI en temps réel

*Cas d'usage réel : allouer 90M€ TV + 10M€ Radio + 2M€ Social Media avec un influenceur Mega.*

**① Ajuster les sliders budgétaires**
L'utilisateur déplace les curseurs TV, Radio et Social Media et sélectionne le tier d'influenceur. Interface animée (Framer Motion), aucun bouton à cliquer — la prédiction se met à jour en continu.

**② Prédiction instantanée < 50 ms**
Le modèle Random Forest renvoie le chiffre d'affaires prédit via l'API FastAPI. ROI, efficacité (revenue per $M) et classe de performance (High/Medium/Low) s'affichent simultanément.

**③ Analyser, comparer, optimiser**
Les 4 modèles affichent leurs prédictions en parallèle. La courbe de sensibilité TV montre le point de rendement décroissant. Le planificateur inverse calcule le budget minimal pour atteindre un objectif de revenu donné.

> *Aucune action manuelle requise — chaque changement de slider déclenche automatiquement un appel API avec debounce 650 ms.*

---

### Slide 9 — BILAN CRITIQUE

**Layout :** Titre + accroche. 3 colonnes visuellement distinctes avec bordure colorée : gauche = vert (Forces), centre = orange (Limites), droite = bleu (Perspectives). Chaque colonne a une icône en haut et des bullet points.

**Image à générer :** 3 colonnes de hauteur égale sur fond sombre. Colonne gauche avec bordure supérieure verte (#10b981) et icône shield/check. Colonne centre avec bordure supérieure orange (#f59e0b) et icône warning triangle. Colonne droite avec bordure supérieure bleue (#3b82f6) et icône rocket/arrow-up. Style épuré, pas de remplissage fort — juste des bordures lumineuses en haut de chaque colonne.

**Contenu :**

## Bilan critique

*Un système performant et démontrable aujourd'hui, avec une trajectoire claire d'amélioration continue.*

**💪 Forces**
- R² > 0.99 sur les 4 modèles — prédictions ultra-précises
- Architecture modulaire et Docker-ready
- API REST documentée et scalable (FastAPI)
- Dashboard complet : 7 pages, mode clair/sombre, responsive
- Pipeline sklearn reproductible (splits.pkl, joblib)
- Déployable en une commande : `docker-compose up`

**⚠️ Limites**
- Dataset synthétique — à valider sur données réelles (Google Ads, Meta)
- Pas de feedback utilisateur ni de ré-entraînement automatique
- Saisonnalité et tendances temporelles non modélisées
- Influencer réduit à une variable catégorielle simple (pas de reach/engagement)

**🚀 Perspectives**
- Intégration d'APIs publicitaires réelles (Google Ads, Meta Ads)
- Modèles de séries temporelles (Prophet, LSTM) pour la saisonnalité
- Boucle de ré-entraînement automatique (MLOps, Airflow)
- Module d'attribution multi-touch (Shapley values)
- Déploiement cloud : GCP / AWS avec auto-scaling

---

### Slide 10 — CONCLUSION

**Layout :** Titre + accroche impactante. 3 piliers en bas en ligne (cartes horizontales larges), chaque pilier avec une icône, un titre et une description. Texte de remerciement centré en dessous avec une ligne séparatrice fine.

**Image à générer :** Fond sombre avec halo bleu diffus central (effet de clôture élégante). 3 blocs/cartes horizontaux en bas avec bordure bleue subtile. Icônes : ① graphique barres (Performance), ② modules connectés (Scalabilité), ③ loupe/explication (Explicabilité). Style sobre, pas de fioritures — impact par la clarté.

**Contenu :**

## Conclusion

*ROI Intelligence démontre qu'il est possible de transformer un budget publicitaire en décision data-driven — précise, explicable et actionnable.*

**① Performance**
Quatre modèles ML atteignent R² > 0.994, évalués rigoureusement par validation croisée et sélectionnés automatiquement via RandomizedSearchCV.

**② Scalabilité**
Architecture modulaire Docker-ready : API FastAPI indépendante du frontend, modèles rechargés sans redémarrage, extensible à de nouveaux canaux ou algorithmes.

**③ Explicabilité**
Dashboard de 7 pages : importance des features, analyse de sensibilité par canal, planification inverse — chaque décision budgétaire est justifiée par la donnée.

---

*Merci pour votre attention.*
*Nous sommes disponibles pour répondre à vos questions.*

---
*ADRIEN CHUEMBOU · QUANG DAT — EFREI Paris · M1 Data Science & IA · 2025–2026*
