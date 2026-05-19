# Marketing ROI Optimization — Projet M1 Data Engineering

**EFREI** | Sarah Malaeb | 2025-26 | RNCP40875 Bloc 2

## Objective

Predict Sales from multi-channel marketing budgets (TV, Radio, Social Media, Influencer)
and build an interactive dashboard for budget simulation and ROI estimation.

## Project Structure

```
project-data-science/
├── data/
│   └── Dummy Data HSS.csv        # Raw dataset from Kaggle (~4572 rows)
├── notebooks/
│   └── 01_eda.ipynb              # Exploratory Data Analysis
├── src/
│   ├── preprocessing.py          # sklearn Pipeline: impute + encode + scale
│   ├── train.py                  # Train & save all 4 models
│   └── evaluate.py               # Metrics, comparison table, SHAP
├── models/                       # Saved .pkl pipelines (joblib)
├── dashboard/
│   └── app.py                    # Streamlit interactive dashboard
├── api/
│   └── main.py                   # FastAPI inference service (optional)
├── requirements.txt
└── README.md
```

## Setup

```bash
pip install -r requirements.txt
```

## Usage

### Run EDA notebook
```bash
jupyter notebook notebooks/01_eda.ipynb
```

### Train all models
```bash
python src/train.py
```

### Launch dashboard
```bash
streamlit run dashboard/app.py
```

### Start API (optional)
```bash
uvicorn api.main:app --reload
```

## Models

| Model | Type | Library |
|-------|------|---------|
| Linear Regression | Baseline | scikit-learn |
| Random Forest | Ensemble | scikit-learn |
| XGBoost | Gradient Boosting | xgboost |
| MLP | Deep Learning | scikit-learn |

## Dataset

Source: [Kaggle — Dummy Advertising and Sales Data](https://www.kaggle.com/datasets/harrimansaragih/dummy-advertising-and-sales-data)

| Feature | Type | Description |
|---------|------|-------------|
| TV | float | TV budget (millions) |
| Radio | float | Radio budget (millions) |
| Social Media | float | Social Media budget (millions) |
| Influencer | str | Influencer tier: Mega / Macro / Micro / Nano |
| Sales | float | Target — Sales in millions |
