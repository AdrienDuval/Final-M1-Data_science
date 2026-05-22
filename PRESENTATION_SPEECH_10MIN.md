# Script de soutenance — ROI Intelligence (≈ 10 minutes)

**Projet :** Optimisation du ROI marketing par le Machine Learning  
**Public :** Jury EFREI · M1 Data Science & IA  
**Slides :** 10 (voir `ROI_Intelligence_Presentation_v2.pptx`)  
**Durée cible :** 9 min 30 – 10 min (+ questions après)

**Conseil oral :** parlez lentement sur l’architecture et les modèles (~130 mots/min). Une slide ≈ 1 minute.

---

## Répartition du temps

| Slide | Titre | Durée | Qui parle (suggestion binôme) |
|-------|--------|-------|-------------------------------|
| 1 | Titre | 0:45 | Adrien |
| 2 | Problématique | 1:00 | Dat |
| 3 | Objectifs | 0:50 | Adrien |
| 4 | Architecture | 1:10 | Dat |
| 5 | Pipeline ML | 1:00 | Adrien |
| 6 | Modèles ML | 1:15 | Dat |
| 7 | Dashboard | 1:00 | Adrien |
| 8 | Démo | 1:15 | Dat (live) ou Adrien |
| 9 | Bilan critique | 1:00 | Adrien |
| 10 | Conclusion | 0:45 | Dat |
| **Total** | | **~10:00** | |

---

## Slide 1 — Titre (≈ 45 s)

> **À l’écran :** ROI Intelligence · sous-titre ML · chips R² 0.9965 · 4 modèles · 7 pages · <50 ms

**Script :**

« Bonjour. Nous sommes **CHUEMBOU Adrien** et **QUANG DAT**, en Master 1 Data Science & IA à l’EFREI.

Notre projet s’appelle **ROI Intelligence** : un système qui aide les équipes marketing à **prédire le chiffre d’affaires** d’une campagne à partir de ses budgets — TV, Radio, Réseaux sociaux — et du **niveau d’influenceur**.

Concrètement : au lieu de décider au feeling, on **simule** un mix budgétaire et on obtient une **prévision en temps réel**, via quatre modèles de machine learning et un **dashboard** de sept pages.

En chiffres : nos modèles dépassent **R² = 0,99**, l’API répond en **moins de 50 millisecondes**, et tout est **déployable avec Docker**.

Nous allons vous montrer le problème, l’architecture, les modèles, une démo, puis un bilan honnête des limites. »

---

## Slide 2 — Problématique (≈ 1 min)

> **À l’écran :** Colonne rouge « traditionnel » vs verte « ML »

**Script :**

« Aujourd’hui, beaucoup d’allocations publicitaires restent **empiriques** : on répète ce qui a “marché” l’année dernière, sans mesurer proprement le lien **budget → revenu**.

Les problèmes classiques : pas de corrélation formalisée, décisions **après** la campagne, et le même budget peut donner des résultats très différents selon les canaux.

Notre réponse : s’appuyer sur **4 572 campagnes** du dataset Kaggle, entraîner des modèles supervisés, et obtenir une **prédiction live** quand on bouge un curseur.

L’enjeu, en une phrase : passer d’une **intuition** à une décision **data-driven**, **mesurable** et **reproductible**. »

---

## Slide 3 — Objectifs (≈ 50 s)

> **À l’écran :** Grille 4 objectifs

**Script :**

« Le projet répond à **quatre objectifs**, alignés avec le sujet EFREI.

**Un — Prédire** : quatre algorithmes — régression linéaire, forêt aléatoire, gradient boosting, et un réseau de neurones MLP — pour estimer les ventes.

**Deux — Comparer** : validation croisée cinq plis, métriques R², MAE, RMSE, et sélection du meilleur modèle.

**Trois — Exposer** : une **API REST FastAPI** avec prédiction, métriques, importance des variables.

**Quatre — Décider** : un **dashboard Next.js** en sept pages pour simuler, comparer et planifier un budget cible.

De la donnée brute à l’outil métier, en une chaîne complète. »

---

## Slide 4 — Architecture (≈ 1 min 10 s)

> **À l’écran :** Pipeline vertical 5 couches + docker-compose

**Script :**

« L’architecture est **modulaire** : chaque couche peut évoluer sans tout casser.

**Données** : fichier CSV, environ 4 572 lignes, variables TV, Radio, Social Media, Influenceur, et ventes en cible.

**Preprocessing** : pipeline scikit-learn partagé — imputation, standardisation des numériques, **one-hot encoding** pour l’influenceur — pour éviter toute **fuite de données** entre train et test.

**Entraînement** : script `train.py`, **RandomizedSearchCV** — quinze combinaisons testées, cinq plis — puis sauvegarde des modèles en `.pkl`.

**API** : FastAPI charge les modèles au démarrage ; endpoints `/predict`, `/predict/all`, `/metrics`, `/stats`, etc.

**Dashboard** : Next.js 14, TypeScript, graphiques Recharts, proxy vers l’API.

Le tout se lance avec **`docker-compose up`** : API sur le port 8000, interface sur 3000. »

---

## Slide 5 — Pipeline ML (≈ 1 min)

> **À l’écran :** 6 étapes load → dashboard

**Script :**

« Voici le **parcours d’une prédiction**, étape par étape.

**①** Chargement et validation du CSV.  
**②** Construction du préprocesseur.  
**③** Réglage des hyperparamètres avec RandomizedSearchCV.  
**④** Entraînement des quatre modèles et sauvegarde, plus **`splits.pkl`** : le même jeu de test pour toutes les évaluations — c’est notre garantie de **reproductibilité**.  
**⑤** L’API charge les pipelines et répond en moins de 50 ms.  
**⑥** Le dashboard envoie les budgets choisis et affiche revenu, ROI et comparaison des modèles.

Point important pour le jury : le preprocessing est **dans** le pipeline sauvegardé — ce qu’on fait en entraînement est **exactement** ce qu’on fait en production. »

---

## Slide 6 — Les 4 modèles (≈ 1 min 15 s)

> **À l’écran :** Tableau R² + barres · Random Forest BEST

**Script :**

« Nous comparons **quatre modèles** sur la **régression** des ventes.

En validation croisée cinq plis, **tous dépassent R² = 0,99** :

- **Random Forest** : **0,9965** — notre **référence**, utilisé par défaut sur `/predict` ;  
- **Gradient Boosting** : 0,9964 — quasi équivalent ;  
- **Régression linéaire** : 0,9956 — très bon, preuve que la relation est surtout **régulière** ;  
- **MLP** : 0,9941 — deep learning obligatoire au sujet, mais **légèrement derrière** les arbres sur ces données **tabulaires**.

**Pourquoi des scores si proches ?** Le dataset pédagogique est **structuré** : peu de bruit, relation budget–ventes claire. Tout modèle raisonnable atteint un **plafond** élevé. Les petits écarts viennent surtout des **interactions** fines — par exemple TV × Mega — que les arbres capturent un peu mieux que la droite ou le MLP.

**RandomizedSearchCV** optimise profondeur, nombre d’arbres, etc., sans surcharger le temps de calcul.

En résumé : on ne choisit pas le MLP “parce que c’est à la mode”, mais **Random Forest** parce qu’il est **un peu meilleur** et **stable** sur nos métriques. »

---

## Slide 7 — Dashboard (≈ 1 min)

> **À l’écran :** 7 cartes pages

**Script :**

« Le dashboard **ROIintel** compte **sept pages**, chacune pour une question métier.

**Accueil** : KPIs, corrélations, benchmarks de performance.  
**Prévision** : curseurs, prédiction et ROI en direct, consensus des quatre modèles.  
**Optimiseur** : scénarios types — équilibré, TV lourd, digital, budget serré — et courbe de **sensibilité TV**.  
**Planificateur** : objectif de revenu → **budget optimal** par optimisation inverse ; analyse **probabiliste** avec la forêt aléatoire.  
**Comparaison ML** : tableaux R², RMSE, classification High / Medium / Low.  
**Insights** et **Feature importance** : quels canaux comptent le plus — souvent **TV** en tête.

Interface **clair / sombre**, animations Framer Motion, et **bilingue EN/FR** via next-intl.

Pendant la démo, on vous montrera surtout **Prévision** et **Optimiseur**. »

---

## Slide 8 — Démonstration (≈ 1 min 15 s)

> **À l’écran :** 3 colonnes sliders → prédiction → analyse  
> **Live :** lancer API + dashboard avant la soutenance

**Script (avec démo live recommandée) :**

« Passons au **cas concret** affiché sur la slide : **90 M€ TV**, **10 M€ Radio**, **2 M€ Social**, influenceur **Mega**.

**Étape 1 —** Sur la page Prévision ou Optimiseur, on ajuste les curseurs. Pas besoin de cliquer “Valider” : un **debounce** appelle l’API automatiquement.

**Étape 2 —** En moins d’une seconde, l’API renvoie le **revenu prédit**, le **ROI**, l’**efficacité** — revenus par million dépensé — et la **classe** de performance.

**Étape 3 —** On compare les **quatre modèles** côte à côte : si les barres sont proches, la prédiction est **fiable** ; si elles divergent, on est peut‑être en **extrapolation** hors des données d’entraînement.

Option : sur le **Planificateur**, fixer un objectif — par exemple 200 M€ de ventes — et obtenir la **répartition budgétaire** suggérée.

*(Si la démo échoue :)* « L’API tourne avec `uvicorn api.main:app --port 8000` et le front avec `npm run dev` — ou `docker-compose up`. »

---

## Slide 9 — Bilan critique (≈ 1 min)

> **À l’écran :** Forces · Limites · Perspectives

**Script :**

« Nous assumons un **bilan critique** — pas seulement les succès.

**Forces :** précision élevée, architecture **Docker-ready**, API documentée, dashboard complet, pipeline **reproductible**.

**Limites — important pour le jury :**  
- données **synthétiques** : à valider sur de vraies campagnes Google ou Meta ;  
- pas de **MLOps** ni ré-entraînement automatique aujourd’hui ;  
- pas de **saisonnalité** ni tendances temporelles ;  
- l’influenceur est une **catégorie**, pas des métriques d’engagement réelles ;  
- pas d’**authentification** sur l’API en version démo.

**Perspectives :** connecter les APIs ads, séries temporelles, boucle MLOps, attribution multi-touch, déploiement cloud.

Cette honnêteté fait partie de la démarche ingénieur. »

---

## Slide 10 — Conclusion (≈ 45 s)

> **À l’écran :** 3 piliers + Merci

**Script :**

« Pour conclure : **ROI Intelligence** montre qu’on peut transformer un budget publicitaire en décision **précise**, **explicable** et **actionnable**.

Trois piliers :

**Performance** — quatre modèles, R² > 0,994, sélection par validation croisée.  
**Scalabilité** — API découplée du front, extensible à de nouveaux canaux.  
**Explicabilité** — importance des variables, sensibilité, planification inverse.

**Merci pour votre attention.** Nous sommes disponibles pour vos questions — sur les métriques, le choix du Random Forest, ou la stack technique.

»

---

## Phrases utiles pour les questions du jury

| Question probable | Réponse courte |
|-------------------|----------------|
| **Pourquoi R² si proche entre modèles ?** | Données synthétiques structurées → plafond haut ; arbres gagnent sur les interactions fines. |
| **C’est quoi RandomizedSearchCV ?** | On teste 15 réglages au hasard, chacun noté en 5-fold CV ; on garde le meilleur. |
| **R² vs MAE vs RMSE ?** | R² = part de variance expliquée ; MAE = erreur moyenne en M€ ; RMSE pénalise les grosses erreurs. |
| **Data leakage ?** | Tout le preprocessing est dans un Pipeline sklearn fit uniquement sur le train. |
| **Pourquoi pas seulement du deep learning ?** | Sur données tabulaires, forêts / boosting sont souvent au niveau ou meilleurs — le MLP est là pour comparer. |
| **Production réelle ?** | Il faudrait données réelles, monitoring, ré-entraînement, sécurité API. |

---

## Checklist avant de passer à l’amphi

- [ ] `docker-compose up` **ou** API (:8000) + dashboard (:3000) testés la veille  
- [ ] Onglet **Prévision** ou **Optimiseur** ouvert avec le cas 90 / 10 / 2 / Mega  
- [ ] Slide 6 : savoir expliquer **scores proches** en 20 secondes  
- [ ] Chronométre une répétition complète (viser 9 min 30)  
- [ ] Répartir les slides si binôme (tableau ci-dessus)  

---

*Script aligné sur `rebuild_pptx.py` / `GAMMA_PROMPT.md` — EFREI 2025–2026*
