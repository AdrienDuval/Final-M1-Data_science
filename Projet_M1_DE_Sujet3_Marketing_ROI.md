# Projet 3 — Système Intelligent Multi-Modèles : Optimisation du Retour sur Investissement Marketing

**EFREI, DATA Engineering & AI** | Sarah Malaeb | 2025-26  
**Certification** : RNCP40875 Expert en ingénierie de données — Bloc 2  
**Travail** : individuel ou en binôme | **Soumission** : MOODLE

---

## Résumé

Ce projet demande de concevoir un **MVP (Minimum Viable Product)** complet pour l'optimisation du ROI marketing à partir d'un dataset de campagnes publicitaires multi-canaux (TV, Radio, Social Media, Influenceurs). L'objectif est de construire une solution end-to-end allant de l'analyse exploratoire des données jusqu'à un dashboard décisionnel interactif, en passant par l'entraînement et la comparaison d'au moins 4 modèles ML/DL. Une API REST est optionnelle mais valorisée. Le projet évalue la capacité à adopter une posture d'ingénieur IA ou consultant Data, en justifiant chaque choix de manière rigoureuse et défendable.

---

## 1. Cadre Théorique

### 1.1 Machine Learning Supervisé

Le ML supervisé apprend une fonction de prédiction à partir de données labellisées. Dans un contexte marketing orienté performance publicitaire, il permet de :

- Prédire le volume de ventes généré par une combinaison de budgets médias (régression)
- Identifier les campagnes à forte ou faible performance (classification)
- Estimer le ROI d'un mix média (régression)
- Prédire l'impact marginal d'un canal spécifique sur les ventes

**Algorithmes à comparer (obligatoirement au moins 4) :**

| Modèle | Forces |
|--------|--------|
| Régression linéaire | Robustesse, interprétabilité directe |
| Random Forest | Capture des effets non linéaires et interactions complexes |
| Gradient Boosting | Meilleures performances prédictives sur relations subtiles |
| Réseau neuronal (MLP) | Modélisation d'interactions complexes budgets/influenceurs |

L'objectif pédagogique n'est pas d'obtenir le meilleur score, mais de **comprendre pourquoi un modèle fonctionne mieux qu'un autre** dans ce contexte.

### 1.2 Deep Learning

Au moins un modèle Deep Learning (MLP) est **obligatoire**, pour une tâche de classification ou de régression. Son intégration doit être **justifiée** par une analyse critique :

- Quand un modèle simple est suffisant vs quand le DL apporte un gain réel
- Compromis biais/variance
- Risque d'overfitting
- Coût computationnel

> Le Deep Learning n'est pas toujours supérieur — l'objectif est de le prouver par comparaison scientifique.

### 1.3 Dashboarding et Data Visualization

Le dashboard est **obligatoire** et doit être un outil orienté utilisateur métier (CMO, responsable marketing, direction financière). Il doit permettre :

- Visualisation des budgets par canal et des KPI marketing
- Analyse des relations investissements/ventes
- Comparaison des performances des modèles
- Simulation de scénarios budgétaires (ex. +10% budget Social Media)
- Prédictions en temps réel à partir de nouvelles configurations
- Estimation du ROI et analyse des variables les plus influentes

**Framework recommandé** : Streamlit (ou Dash/Plotly)

> Distinguer les visualisations EDA (rapport technique) du dashboard décisionnel (utilisateur final).

### 1.4 API REST (Optionnelle)

Une API REST expose le modèle comme service industrialisable. Si choisie, elle doit inclure :

- `POST /predict` — reçoit les features en JSON, renvoie la prédiction
- `GET /health` — vérifie l'état du service
- `GET /model-info` (optionnel) — informations sur le modèle
- Gestion des erreurs et documentation (README ou Swagger/FastAPI)

**Framework** : FastAPI ou Flask

---

## 2. Objectifs du Projet

Concevoir un système intelligent complet comprenant :

1. Préparation des données (nettoyage, feature engineering)
2. Modélisation multi-algorithmes (au moins 4 modèles)
3. Évaluation comparative rigoureuse
4. Interprétabilité (Feature Importance, SHAP)
5. Interface utilisateur décisionnelle (dashboard interactif)
6. API déployable (optionnelle)

---

## 3. Dataset

**Source Kaggle** : [Dummy Advertising and Sales Data](https://www.kaggle.com/datasets/harrimansaragih/dummy-advertising-and-sales-data)  
**Fichier** : `marketing_and_sales.csv`

### Caractéristiques

| Attribut | Valeur |
|----------|--------|
| Nombre d'enregistrements | ~200 campagnes |
| Type de données | Numériques + catégorielles |
| Variable cible principale | Sales (en million) |
| Nature | Données synthétiques pédagogiques |

### Variables Clés

| Variable | Description |
|----------|-------------|
| `TV` | Budget TV en million |
| `Radio` | Budget Radio en million |
| `Social Media` | Budget Social Media en million |
| `Influencer` | Type : Mega / Macro / Micro / Nano |
| `Sales` | Ventes en million (variable cible) |

---

## 4. Problématiques Prédictives Possibles

> Vous devez choisir **une seule tâche** (classification ou régression). Points bonus pour plusieurs tâches.

### 4.1 Prédiction des Ventes — Régression (tâche principale)
- **Variable cible** : `Sales`
- **Intérêt** : optimiser l'allocation budgétaire, maximiser le ROI, anticiper les performances

### 4.2 Estimation du ROI — Régression
- **Variable cible** : `ROI = Sales / (TV + Radio + Social Media)`
- **Intérêt** : identifier les canaux les plus rentables, détecter les rendements décroissants

### 4.3 Impact Marginal d'un Canal — Régression
- Calculer ∂Sales/∂TV à partir du modèle entraîné ou créer une variable `Delta_Sales`
- **Intérêt** : arbitrage budgétaire, optimisation du mix média

### 4.4 Performance Campagne — Classification
- **Variable cible** : catégorie basée sur les quantiles de ventes (High / Medium / Low Performance)
- **Intérêt** : identifier rapidement les campagnes performantes, segmenter les stratégies

### 4.5 Score d'Efficacité Marketing — Régression ou Classification
- Score continu (exemple) :  
  `MarketingEfficiencyScore = 0.35×Sales_norm + 0.25×ROI_norm + 0.15×TV_efficiency_norm + 0.15×Social_efficiency_norm + 0.10×Radio_efficiency_norm`
- **Intérêt** : vue synthétique de l'efficacité globale de chaque campagne

---

## 5. Prérequis et Exigences

- Minimum **4 modèles** différents comparés
- Au moins **1 modèle Deep Learning**
- Comparaison quantitative obligatoire avec métriques adaptées
- **Dashboard interactif obligatoire** (Streamlit ou Dash)
- API fonctionnelle (optionnel mais valorisé)
- Interprétation de l'importance des features (Feature Importance / SHAP)
- Séparation train/test rigoureuse — **cross-validation recommandée**
- Zéro data leakage (pipelines sklearn recommandés)

---

## 6. Recommandations Méthodologiques

### Analyse Exploratoire (EDA)
Avant toute modélisation : distributions, valeurs extrêmes, cohérence des montants, valeurs manquantes, relations entre variables.

### Déséquilibre des Classes
En classification, analyser le déséquilibre et privilégier Recall, F1, PR-AUC. Appliquer stratified split / class_weight si nécessaire.

### Corrélation et Redondance
Identifier les variables redondantes et les interactions utiles (ex. ratio Sales/Budget, interaction TV×Influencer).

### Progression des Modèles
Commencer par un **baseline simple** (régression linéaire/logistique) avant d'introduire des modèles plus complexes (Random Forest → Gradient Boosting → MLP).

### Anti Data Leakage
Toutes les étapes de preprocessing (imputation, scaling, encodage) doivent être ajustées **uniquement sur le train set**, puis appliquées au test set. Utiliser `sklearn.Pipeline` et `ColumnTransformer`.

### Hyperparamètres
Utiliser GridSearch ou RandomizedSearch avec des plages réalistes et une stratégie expliquée. Objectif : meilleur compromis performance/stabilité, pas le "tuning" maximal.

### Analyse des Erreurs
Ne pas se limiter aux scores globaux. Analyser : matrices de confusion, résidus, exemples mal prédits, causes possibles.

### Interprétabilité

| Technique | Quand l'utiliser | Niveau |
|-----------|-----------------|--------|
| `feature_importances_` | Après entraînement (tree-based) | Basique |
| Permutation Importance | Après évaluation (agnostique modèle) | Recommandé |
| SHAP | Sur le modèle final sélectionné | Avancé |

Questions auxquelles le modèle doit pouvoir répondre :
- Pourquoi cette combinaison budgétaire génère-t-elle plus de ventes ?
- Quel canal contribue le plus à la performance ?
- L'augmentation du budget TV est-elle réellement efficace ?
- Le type d'influenceur joue-t-il un rôle significatif ?

### Structure du Code
Organiser en modules : `data_preprocessing`, `modeling`, `evaluation`, `dashboard`, `api`. Éviter un notebook monolithique. Versionner régulièrement avec **Git**.

---

## 7. Exigences Fonctionnelles Détaillées

| EF | Intitulé | Contenu |
|----|----------|---------|
| **EF1** | Acquisition et Préparation des Données | Pipeline complet : nettoyage, encodage, normalisation, EDA documentée |
| **EF2** | Modélisation Multi-Algorithmes | ≥ 4 modèles (ML classiques + DL), sélection et justification du modèle final |
| **EF3** | Système d'Évaluation | Métriques adaptées (classification : Accuracy, Precision, Recall, F1, ROC-AUC ; régression : MAE, RMSE, R²), tableaux comparatifs, analyse d'erreurs |
| **EF4** | Dashboard Interactif (**Obligatoire**) | Saisie d'un scénario, prédiction en temps réel, comparaison des modèles, feature importance, graphiques interactifs (Streamlit ou Dash/Plotly) |
| **EF5** | API REST (Optionnelle) | `POST /predict`, `GET /health`, gestion des erreurs, documentation README ou Swagger |

---

## 8. Compétences RNCP Évaluées (Bloc 2)

**Bloc 2 : Piloter et implémenter des solutions d'IA en s'aidant notamment de l'IA générative**

| Référence | Compétence | Critères principaux |
|-----------|------------|---------------------|
| C3.1 | Préparer et transformer les données | Outils adaptés, qualité des données, documentation des étapes |
| C3.2 | Communication infographique visuelle | Visualisations interactives, inclusives, temps réel, décisionnelles |
| C3.3 | Analyse exploratoire | Techniques statistiques adaptées, insights exploitables, documentation |
| C4.1 | Stratégie d'intégration de l'IA | Cas d'usage pertinents, impact évalué, feuille de route réalisable |
| C4.2 | Développement de modèles prédictifs | Prétraitement, algorithmes justifiés, code fonctionnel, résultats cohérents |
| C4.3 | Évaluation comparative des modèles | ≥ 2 modèles comparés, métriques appropriées, modèle final validé, écoresponsabilité |

---

## 9. Livrables

- **Code source** fonctionnel (+ documentation technique en annexe, optionnel)
- **Rapport de projet** structuré (démarche, résultats, recommandations)
- **Support de présentation**
- **Présentation et démonstration en classe** lors de la dernière séance (évaluation individuelle, tous les membres participent)
- Soumission sur **MOODLE** (+ Git/GitHub optionnel)

> La grille d'évaluation détaillée est partagée dans un document séparé.

---

*Bonne chance !*
