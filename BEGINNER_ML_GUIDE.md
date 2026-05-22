# Beginner’s guide — Data science & ML terms in this project

**Language:** English · **Level:** beginner-friendly  
**Project:** Marketing ROI Optimization (EFREI M1 Data Engineering)

This guide explains **what words mean**, **why we use them**, **where they appear in our code**, and **how they connect to real examples** from our dataset and results.

---

## Table of contents

1. [The big picture (in plain English)](#1-the-big-picture-in-plain-english)
2. [What the school project required](#2-what-the-school-project-required)
3. [What we actually built](#3-what-we-actually-built)
4. [Our data — row by row](#4-our-data--row-by-row)
5. [Data science vocabulary](#5-data-science-vocabulary)
6. [Preprocessing — before the model sees data](#6-preprocessing--before-the-model-sees-data)
7. [Machine learning basics](#7-machine-learning-basics)
8. [Our four regression models](#8-our-four-regression-models)
9. [Our four classification models](#9-our-four-classification-models)
10. [How we pick and improve models](#10-how-we-pick-and-improve-models)
11. [Metrics — how we know if we did well](#11-metrics--how-we-know-if-we-did-well)
12. [Understanding our results with examples](#12-understanding-our-results-with-examples)
13. [Interpretability — why did the model say that?](#13-interpretability--why-did-the-model-say-that)
14. [Apps & deployment words](#14-apps--deployment-words)
15. [One full example: from sliders to prediction](#15-one-full-example-from-sliders-to-prediction)
16. [Quick glossary (A–Z)](#16-quick-glossary-az)

---

## 1. The big picture (in plain English)

Imagine you run marketing for a company. For each campaign you spend money on:

- **TV ads**
- **Radio ads**
- **Social media ads**
- An **influencer** (Mega celebrity down to Nano micro-influencer)

At the end you get **Sales** (revenue).

**Our goal:** learn patterns from **past campaigns** so we can **guess Sales** (or performance level) for **new** budget mixes — without running the campaign first.

That is **machine learning**: the computer finds rules from historical examples.

**ROI (Return On Investment)** in this project is roughly:

> “For every euro spent on ads, how much did we get back in sales?”

Example: spend 135M total, predict 214M sales → you gained more than you spent (positive ROI).

---

## 2. What the school project required

| Requirement | Plain meaning | Did we do it? |
|-------------|---------------|---------------|
| Use a marketing dataset | Realistic ad + sales table | Yes — ~4,572 campaigns in `marketing_labelled.csv` |
| **At least 4 ML models** | Compare different “brains” | Yes — 4 for sales, 4 for performance class |
| **At least 1 deep learning model** | Neural network (MLP) | Yes — MLP for regression and classification |
| **Regression OR classification** | Predict a number OR a category | **Both** (sales = number, perf = category) |
| **Dashboard** | Interactive website for managers | Yes — Streamlit + Next.js |
| **No data leakage** | Don’t cheat by letting test data influence training | Yes — sklearn `Pipeline` |
| **Model comparison** | Tables/charts showing who wins | Yes — metrics CSV, dashboard pages |
| **Feature importance / SHAP** | Explain which inputs matter | Yes — API, Streamlit, `evaluate.py --shap` |
| **API (optional bonus)** | Program can call predictions over HTTP | Yes — FastAPI on port 8000 |

---

## 3. What we actually built

Think of **three doors** into the same brain:

```
Past campaigns (CSV)
        ↓
   Clean & scale data (preprocessing.py)
        ↓
   Train models (train.py / models.py) → save .pkl files
        ↓
   ┌────────────┬──────────────┬─────────────────┐
   Streamlit    FastAPI API    Next.js website
   (full lab)   (predictions)  (pretty dashboard)
```

| Piece | File / folder | What a beginner should remember |
|-------|---------------|----------------------------------|
| Data | `data/marketing_labelled.csv` | Each row = one campaign |
| Training (API stack) | `src/train.py` | Trains 4 models to predict **Sales** |
| Training (Streamlit stack) | `src/models.py` | Trains 4 + 4 models (sales + performance class) |
| Evaluation | `src/evaluate.py` | Scores models, saves charts |
| Streamlit UI | `dashboard/app.py` | Sliders, charts, “target planner” |
| API | `api/main.py` | `/predict`, `/metrics`, etc. |
| Web UI | `dashboard-next/` | Modern dashboard calling the API |
| Saved models | `models/*.pkl` | Frozen trained brains on disk |

---

## 4. Our data — row by row

**Real row from our file:**

| TV | Radio | Social Media | Influencer | Sales | perf_class |
|----|-------|--------------|------------|-------|------------|
| 83.0 | 30.0 | 6.9 | Mega | 298.2 | High |

**In words:** A Mega-influencer campaign with big TV/Radio spend produced **high sales**, so we label it **High** performance.

**Another row:**

| TV | Radio | Social Media | Influencer | Sales | perf_class |
|----|-------|--------------|------------|-------|------------|
| 16.0 | 6.6 | 2.9 | Mega | 54.7 | Low |

Same influencer tier, **much smaller budgets** → **Low** sales → **Low** class.

### Column types (important vocabulary)

| Term | Meaning | Our columns |
|------|---------|-------------|
| **Feature** (input) | What we know before predicting | TV, Radio, Social Media, Influencer |
| **Target** (output) | What we want to predict | Sales (number) or perf_class (label) |
| **Numeric feature** | A number you can add/average | TV, Radio, Social Media |
| **Categorical feature** | A label from a fixed list | Influencer: Mega, Macro, Micro, Nano |
| **Regression target** | A continuous number | Sales (e.g. 54.7, 298.2) |
| **Classification target** | A category | Low, Medium, High |

**`perf_class`:** we did not measure this in the real world separately — we **created** it by splitting Sales into thirds (bottom 33% = Low, middle = Medium, top = High). That gives us a second learning task for school.

---

## 5. Data science vocabulary

### Dataset / sample / observation

- **Dataset** = the whole spreadsheet (~4,572 rows).
- **Sample** (or **observation**, **row**) = one campaign.

**Why it matters:** models learn from many samples, not from one row.

**Where:** `load_data()` in `src/preprocessing.py`.

---

### EDA (Exploratory Data Analysis)

**What:** looking at charts and summaries *before* modeling — “what’s in the data?”

**Why:** catch weird values, see if TV and Sales move together, etc.

**Where:** `notebooks/01_eda.ipynb`, Streamlit tab “Data Overview”, Next.js home page (`/stats`).

**Example question EDA answers:** “Do Mega influencers usually have higher sales than Nano?”

---

### Train / test split

**What:** hide ~20% of rows as a **final exam** the model never studied during training.

**Why:** if you grade the model on the same rows it memorized, scores look too good and lie about real-world performance.

**Where:** `split_data()` in `preprocessing.py`; exact split saved in `models/splits.pkl`.

**Analogy:** study with 80% of flashcards, quiz on the other 20%.

---

### Cross-validation (CV)

**What:** split training data into 5 rotating mini-exams, average the score.

**Why:** more stable than a single lucky/unlucky split.

**Where:** `RandomizedSearchCV`, `cross_val_score` in `train.py`; results in `models/cv_results.json`.

**Our example (regression R² mean):**

| Model | CV R² (approx.) |
|-------|-----------------|
| random_forest | 0.9958 |
| gradient_boosting | 0.9956 |
| linear_regression | 0.9950 |
| mlp | 0.9935 |

Higher ≈ better fit on unseen folds.

---

### Data leakage

**What:** accidentally letting **future or test information** influence training (cheating).

**Bad example:** compute average Sales on the **whole** file, then train — the model “saw” test sales through that average.

**Our fix:** imputation and scaling happen **inside** a sklearn **Pipeline** fitted only on training rows.

**Where:** `build_pipeline()` in `preprocessing.py`.

---

### Pipeline (sklearn)

**What:** a chain: `raw row → clean → encode → model.predict()`.

**Why:** same steps at training and at prediction time; no leakage.

**Where:** `build_pipeline(model)` wraps preprocessor + estimator.

---

### Hyperparameters

**What:** knobs you set *before* training (tree depth, learning rate), not learned from data.

**Why:** wrong knobs → underfit or overfit.

**Where:** tuned for Random Forest, Gradient Boosting, MLP via `RandomizedSearchCV`.

---

### Overfitting vs underfitting

| Problem | Plain English | Symptom |
|---------|---------------|---------|
| **Underfitting** | Model too simple — didn’t learn patterns | Bad on train AND test |
| **Overfitting** | Memorized noise — great on train, worse on new data | Great train, worse test |

**Why we care:** MLP and big forests can overfit; we use CV, early stopping (MLP), and compare on test set.

---

### `.pkl` file (joblib)

**What:** saved trained pipeline on disk.

**Why:** don’t retrain every time you open the dashboard.

**Where:** `models/random_forest.pkl`, etc.

---

## 6. Preprocessing — before the model sees data

Models want **numbers in sensible ranges**. Raw data needs cleaning.

### Missing values / imputation

**What:** empty cells. **Imputation** = fill them (we use **median** for budgets, **most frequent** for Influencer).

**Why:** sklearn models can’t handle NaN in many cases.

**Where:** `SimpleImputer` in `build_preprocessor()`.

**Example:** if one row had blank Radio, we replace with typical Radio (~median of train set only).

---

### Standardization (StandardScaler)

**What:** transform each numeric column to “how many standard deviations from average.”

**Why:** MLP and linear models behave better when TV (0–300) and Social (0–27) are on similar scales.

**Where:** numeric branch of `ColumnTransformer`.

**Layman:** instead of “TV = 83”, the model might see “TV = +1.2 compared to typical campaign.”

---

### One-Hot Encoding

**What:** turn categories into 0/1 columns.

**Why:** “Mega” is not greater than “Nano” — it’s a name, not a quantity.

**Our Influencer** has 4 levels → with `drop="first"` we get **3 dummy columns**, e.g.:

| Influencer | Macro | Micro | Nano |
|------------|-------|-------|------|
| Mega | 0 | 0 | 0 |
| Macro | 1 | 0 | 0 |
| Micro | 0 | 1 | 0 |
| Nano | 0 | 0 | 1 |

(Mega is the “reference” dropped column — all zeros means Mega.)

**Where:** `OneHotEncoder` in `preprocessing.py`.

**Common mistake name:** people say “hot encoding” — the correct term is **one-hot encoding**.

---

### Label encoder (classification only)

**What:** turns words Low/Medium/High into numbers 0, 1, 2 for the classifier.

**Why:** some algorithms need numeric class IDs internally.

**Where:** `models/label_encoder.pkl` (Streamlit stack).

**Note:** different from one-hot — this is for the **target**, not Influencer features.

---

### Feature engineering (light in our project)

**What:** creating new columns from old ones (ratios, interactions).

**Our example:** `Total_Budget = TV + Radio + Social Media`, `ROI = Sales / Total_Budget` — used in **stats/dashboard**, not always as model inputs.

**Where:** API `lifespan` in `api/main.py` for `/stats`.

---

## 7. Machine learning basics

### Supervised learning

**What:** learn from examples where you know the right answer (Sales or perf_class).

**Why:** marketing history has past sales — perfect for supervised learning.

---

### Regression vs classification

| | Regression | Classification |
|---|------------|----------------|
| **Predicts** | A number | A category |
| **Our target** | Sales | perf_class (Low/Medium/High) |
| **Question** | “How much revenue?” | “Which performance bucket?” |
| **Example output** | 214.7 million | “High” |

---

### Inference / prediction

**What:** using a trained model on **new** inputs.

**Where:** `POST /predict`, Streamlit “Predict” tab, simulator sliders.

---

## 8. Our four regression models

All try to predict **Sales** from TV, Radio, Social Media, Influencer.

### Linear Regression

**Layman:** draw the best straight-line (actually a flat hyperplane) through the data:  
`Sales ≈ a×TV + b×Radio + c×Social + d×(influencer dummies) + constant`.

**Strengths:** simple, fast, **can extrapolate** beyond training range (useful when budgets go higher than history).

**Weaknesses:** can’t easily capture “TV only works well with Mega influencers” unless you add interaction terms manually.

**Where:** `linear_regression` in `train.py` / `models.py`.

**When we force it:** Streamlit switches to linear regression if you push sliders **above** max training budgets and had picked a tree model (trees can’t extrapolate well).

---

### Random Forest

**Layman:** hundreds of **decision trees** each ask yes/no questions (“TV > 50?”), each votes a sales number; final answer = average vote.

**Strengths:** captures non-linear patterns and interactions; often best on tabular marketing data.

**Weaknesses:** doesn’t predict well **outside** the range of values seen in training.

**Where:** `random_forest.pkl`; feature importance in API `/feature-importance`.

**Project result:** test **R² ≈ 0.997**, among the top models.

---

### Gradient Boosting (XGBoost in our project)

**Layman:** build trees **one after another**, each fixing previous mistakes — like a team where each new member specializes in past errors.

**Strengths:** very strong accuracy on structured data; handles complex patterns.

**Weaknesses:** slower to train; like forests, bad at far out-of-range inputs.

**Where:** `gradient_boosting` key (XGBoost if installed, else sklearn `GradientBoostingRegressor`).

**Project result:** test **R² ≈ 0.9973** (slightly best RMSE in `metrics_regression.csv`).

---

### MLP (Multi-Layer Perceptron) — our “deep learning” model

**Layman:** a small **neural network** — layers of numbers that multiply inputs, apply ReLU (“keep positive, zero out negative”), and combine until one sales output.

**Architecture we use (roughly):** hidden layers like 64 → 32 neurons, ReLU, Adam optimizer, **early stopping** (stop if validation error stops improving).

**Strengths:** can model messy interactions.

**Weaknesses:** needs more data and tuning; on this dataset **trees beat MLP** slightly.

**Where:** `mlp` in both training scripts.

**Project result:** R² ≈ 0.994 — still excellent, but **4th** among regressors here.

**Lesson for class:** deep learning is **not automatically best** — compare scientifically.

---

## 9. Our four classification models

Predict **perf_class** (Low / Medium / High).

### Logistic Regression

**Layman:** despite the name, it’s for **classification**. It estimates probability of each class using a smooth (sigmoid/softmax) function of features.

**Strengths:** simple baseline, fast, interpretable coefficients.

**Weaknesses:** assumes relatively simple boundaries between classes.

**Where:** `logistic_regression_classification.pkl`.

**Our result:** Accuracy ≈ **97.4%** — solid baseline.

---

### Random Forest (classifier)

Same forest idea, but each tree votes **Low / Medium / High** instead of a number.

**Our result:** Accuracy ≈ **97.1%**.

---

### Gradient Boosting (classifier)

Boosted trees for categories.

**Our result:** Accuracy ≈ **97.4%**, ROC-AUC ≈ **0.999** (excellent ranking of classes).

---

### MLP (classifier)

Neural net with softmax output → probabilities for three classes.

**Our result:** Accuracy ≈ **96.6%** — good, slightly below trees on this task.

---

## 10. How we pick and improve models

### Baseline

**What:** the simplest reasonable model (linear / logistic) to beat.

**Why:** if complex models can’t beat baseline, they’re not worth the complexity.

---

### RandomizedSearchCV

**What:** try **15 random combinations** of hyperparameters, each scored with **5-fold CV**.

**Why:** full grid search of all combinations would take too long.

**Where:** `tune()` in `train.py`, tuning grids in `models.py`.

**Layman:** shake a dice 15 times on knob settings, keep the best average exam score.

---

### Best model selection (API `/predict`)

**What:** API loads all models but `/predict` uses the one with **best cross-validated R²** (often random forest or gradient boosting).

**Where:** logic in `api/main.py` when building predictions.

---

### Target Planner (Streamlit) — optimization, not ML

**What:** given a **target sales** number, `scipy.optimize.minimize` (SLSQP) adjusts TV/Radio/Social to get close while minimizing total spend.

**Why:** answers “what budget hits 200M sales?” — operations research on top of ML.

**Where:** `dashboard/app.py` tab “Target Planner”.

---

### Probability from Random Forest trees

**What:** each tree in the forest predicts a slightly different sales number; we look at the spread to estimate **P(Sales ≥ goal)**.

**Why:** single point prediction hides uncertainty.

**Where:** `rf_prediction_distribution()` in Streamlit.

---

## 11. Metrics — how we know if we did well

### Regression metrics (Sales)

| Metric | Plain English | Lower or higher is better? | Our typical scale |
|--------|---------------|----------------------------|-------------------|
| **R²** (R-squared) | % of sales variation explained (1.0 = perfect) | Higher | ~0.994–0.997 |
| **MAE** | Average absolute error in same units as Sales (millions) | Lower | ~2.7–3.0 |
| **RMSE** | Like MAE but punishes big errors more | Lower | ~4.8–7.3 |

**R² example in words:** R² = 0.997 means “predictions are extremely close to true sales on the test campaigns.”

**MAE example:** MAE = 2.67 → on average we’re off by about **2.67 million** in sales prediction.

**Where:** `models/metrics_regression.csv`, `/metrics` endpoint.

---

### Classification metrics (perf_class)

| Metric | Plain English | Higher is better? |
|--------|---------------|-------------------|
| **Accuracy** | % of campaigns labeled correctly | Yes (~97%) |
| **Precision** | When we say “High”, how often right? | Yes |
| **Recall** | Of all true “High”, how many caught? | Yes |
| **F1-macro** | Balance of precision & recall, all classes equal | Yes |
| **ROC-AUC** | How well model **ranks** classes (1.0 = perfect) | Yes (~0.997–0.999) |

**Accuracy example:** 0.9737 → about **97 campaigns wrong per 1000**.

**Confusion matrix** (from `evaluate.py`): table of “predicted vs actual” — see which class gets confused.

**Where:** `models/metrics_classification.csv`, figures `confusion_matrix.png`.

---

## 12. Understanding our results with examples

### Regression (from `metrics_regression.csv`)

| Model | MAE | RMSE | R² |
|-------|-----|------|-----|
| gradient_boosting | 2.67 | 4.83 | 0.9973 |
| random_forest | 2.82 | 5.22 | 0.9969 |
| linear_regression | 2.67 | 7.25 | 0.994 |
| mlp | 3.01 | 7.23 | 0.994 |

**Story:** all models are **excellent** on this synthetic dataset. Gradient boosting wins slightly on RMSE/R². MLP is still strong but not #1 — valid report conclusion: “trees enough; DL optional here.”

---

### Classification (from `metrics_classification.csv`)

| Model | Accuracy | F1-macro | ROC-AUC |
|-------|----------|----------|---------|
| logistic_regression | 0.9737 | 0.9736 | 0.9975 |
| gradient_boosting | 0.9737 | 0.9736 | 0.999 |
| random_forest | 0.9705 | 0.9705 | 0.9979 |
| mlp | 0.9661 | 0.966 | 0.9975 |

**Story:** classes are **easy to separate** because they were built from sales thirds on clean data. Differences between models are small.

---

### API prediction example

**You send:**

```json
{
  "TV": 100,
  "Radio": 25,
  "Social_Media": 10,
  "Influencer": "Mega"
}
```

**You might get back (illustrative):**

```json
{
  "predicted_sales": 214.73,
  "roi": 1.6072,
  "total_budget": 135.0,
  "vs_average": 21.53,
  "model_used": "gradient_boosting"
}
```

**Reading it:**

- **total_budget** = 100 + 25 + 10 = **135** (millions in dataset units).
- **predicted_sales** ≈ **215** → model expects strong revenue.
- **roi** in API is formatted as a ratio/percent style metric from sales vs budget (see `api/main.py` for exact formula).
- **vs_average** = how much above typical historical sales.
- **model_used** = which brain answered.

**Compare four models at once:** `POST /predict/all` — used by Next.js simulator to draw side-by-side bars.

---

### When sliders go crazy (out-of-range)

Training saw TV up to ~297. If you type TV = 400:

- **Tree models** may give weird flat predictions (they never saw 400).
- **Streamlit** switches to **linear regression** automatically for that prediction.

**Where:** `effective_reg_model()` in `dashboard/app.py`, `TRAIN_BOUNDS` constant.

---

## 13. Interpretability — why did the model say that?

### Feature importance (tree models)

**What:** score per input column — “how much did this feature help splits?”

**Why:** marketing manager asks “Is TV worth it?”

**Where:** `/feature-importance`, Streamlit tab, `figures/feature_importance.png`.

**Typical finding:** TV and Radio often rank high; influencer tier matters but less than big budgets.

---

### Permutation importance

**What:** shuffle one column randomly; if error jumps, that feature mattered.

**Why:** works even when model isn’t trees — more trustworthy “stress test.”

**Where:** `evaluate.py`, Streamlit.

---

### SHAP

**What:** for one prediction, assigns **+/- contribution** of each feature to push sales up or down.

**Why:** explains a **single campaign**, not just global averages.

**Where:** `python src/evaluate.py --shap` (slow).

**Layman:** receipt showing “TV added +40M, Nano influencer subtracted −5M.”

---

### Residuals

**What:** error per row = actual Sales − predicted Sales.

**Why:** plot should look like random cloud; patterns mean model missed something systematic.

**Where:** `figures/residuals_best.png`.

---

## 14. Apps & deployment words

| Term | Plain English | Our project |
|------|---------------|-------------|
| **FastAPI** | Python web framework for APIs | `api/main.py` |
| **Endpoint** | URL + method (GET/POST) | `/predict`, `/health` |
| **Streamlit** | Quick Python dashboards | `dashboard/app.py` |
| **Next.js** | React framework for production web UI | `dashboard-next/` |
| **Docker** | Package app + dependencies in a container | `Dockerfile.api`, `docker-compose.yml` |
| **CORS** | Browser security allowing frontend to call API | Enabled in FastAPI |
| **Lifespan** | Code run once at API startup (load models) | `lifespan()` in `api/main.py` |

---

## 15. One full example: from sliders to prediction

**Scenario:** Marketing manager asks: “If we spend TV=50, Radio=20, Social=5 with a **Macro** influencer, what sales should we expect?”

1. **Input features** gathered (dashboard sliders or JSON body).
2. **Preprocessor** (inside saved `.pkl`):
   - Fill missing (if any)
   - Scale TV, Radio, Social
   - One-hot encode Influencer → Macro = 1 on Macro column
3. **Model** (e.g. Random Forest) runs through trees → **predicted Sales ≈ X**
4. **Post-processing:**
   - Compute **total budget** = 75
   - Compute **ROI** vs budget
   - Compare X to **average sales** in dataset for “vs average”
5. **Show** on screen or return JSON.

**If they also want performance class:** classification pipeline outputs **Medium** (example only — run real model for exact label).

**If they want a sales target of 200:** Target Planner searches budgets that minimize cost while prediction ≈ 200.

---

## 16. Quick glossary (A–Z)

| Term | One-line meaning |
|------|------------------|
| **Accuracy** | % correct class labels |
| **API** | HTTP service other programs call |
| **Boosting** | Sequentially fix errors with new trees |
| **Categorical** | Label from fixed list (Influencer) |
| **Classification** | Predict a category |
| **ColumnTransformer** | Different preprocessing per column type |
| **Cross-validation** | Multiple train/val splits for stable score |
| **CV folds** | Number of splits (we use 5) |
| **Dashboard** | Visual UI for humans |
| **Decision tree** | Flowchart of if/else rules |
| **Deep learning** | Neural networks with many layers (here: small MLP) |
| **Drop-first** | One-hot with N−1 columns to avoid redundancy |
| **EDA** | Explore data before modeling |
| **Endpoint** | Specific API URL |
| **Feature** | Input column |
| **F1-macro** | Classification balance metric across classes |
| **Gradient Boosting** | Additive tree boosting (XGBoost variant) |
| **Hyperparameter** | Manual model setting tuned by search |
| **Imputation** | Fill missing values |
| **Inference** | Predict on new data |
| **Influencer tier** | Mega / Macro / Micro / Nano |
| **Joblib** | Library to save/load sklearn models |
| **Label encoder** | Map class names to 0,1,2 |
| **Leakage** | Test info contaminating train |
| **Linear regression** | Predict number with weighted sum |
| **Logistic regression** | Predict class probabilities |
| **MAE** | Mean absolute error |
| **MLP** | Feed-forward neural network |
| **Model** | Trained mathematical mapping features → target |
| **Numeric** | Number feature |
| **One-hot encoding** | Category → multiple 0/1 columns |
| **Overfitting** | Memorize noise, fail on new data |
| **Performance class** | Low / Medium / High from sales quantiles |
| **Pipeline** | Chained preprocessing + model |
| **Precision** | Trustworthiness of positive predictions |
| **Random Forest** | Ensemble of voting trees |
| **RandomizedSearchCV** | Random hyperparameter search with CV |
| **Recall** | Coverage of true positives |
| **Regression** | Predict a number (Sales) |
| **Residual** | Actual − predicted |
| **RMSE** | Root mean squared error |
| **ROI** | Return on investment (sales vs spend) |
| **R²** | Fraction of variance explained |
| **ROC-AUC** | Class separation quality |
| **Sample** | One row / campaign |
| **Scaler** | Rescale numeric features |
| **SHAP** | Per-prediction feature contributions |
| **Supervised learning** | Learn from labeled examples |
| **Target** | What we predict (Sales or perf_class) |
| **Test set** | Held-out final evaluation rows |
| **Train set** | Rows used to fit model |
| **Underfitting** | Too simple to capture pattern |
| **XGBoost** | Fast gradient boosting library |

---

## What to say in a presentation (30 seconds)

> “We studied thousands of fictional marketing campaigns with TV, Radio, Social, and influencer spend. We trained several models to predict sales and performance tier, compared them honestly on a hidden test set, explained which channels matter most, and built dashboards plus an API so a manager can slide budgets and see predicted revenue and ROI instantly.”

---

## Related docs

- Technical setup: [README.md](README.md)
- Full project write-up (French): [DOCUMENTATION_PROJET.md](DOCUMENTATION_PROJET.md)
- Course brief: [Projet_M1_DE_Sujet3_Marketing_ROI.md](Projet_M1_DE_Sujet3_Marketing_ROI.md)

---

*Written for beginners — ask your teammate or teacher if any section should go deeper.*
