import sys
import warnings
import numpy as np
import pandas as pd
import joblib
import streamlit as st
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from scipy.optimize import minimize

warnings.filterwarnings("ignore")
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "src"))

from utils import roi_estimate, influencer_options, get_feature_names

st.set_page_config(page_title="Marketing ROI Dashboard", page_icon="📊", layout="wide")

# ── Constants ─────────────────────────────────────────────────────────────────
TRAIN_BOUNDS = {"TV": (0.0, 297.0), "Radio": (0.0, 49.6), "Social Media": (0.0, 26.9)}
TREE_MODELS  = {"random_forest", "gradient_boosting"}
MODEL_LABELS = {
    "linear_regression": "Linear Regression",
    "random_forest":     "Random Forest",
    "gradient_boosting": "Gradient Boosting",
    "mlp":               "MLP",
}

def fmt(name):
    return MODEL_LABELS.get(name, name.replace("_", " ").title())

def is_oor(tv, radio, sm):
    return (tv    > TRAIN_BOUNDS["TV"][1] or
            radio > TRAIN_BOUNDS["Radio"][1] or
            sm    > TRAIN_BOUNDS["Social Media"][1])

def effective_reg_model(model_name, tv, radio, sm):
    """Return model_name unless OOR + tree model → fall back to linear regression."""
    if is_oor(tv, radio, sm) and model_name in TREE_MODELS:
        return "linear_regression"
    return model_name

# ── Data & model loading ──────────────────────────────────────────────────────
@st.cache_data
def load_data():
    return pd.read_csv(ROOT / "data" / "marketing_labelled.csv")

@st.cache_resource
def load_artifacts():
    prep_reg = joblib.load(ROOT / "models" / "pipeline_regression.pkl")
    prep_clf = joblib.load(ROOT / "models" / "pipeline_classification.pkl")
    le       = joblib.load(ROOT / "models" / "label_encoder.pkl")
    models_reg, models_clf = {}, {}
    for name in ["linear_regression", "random_forest", "gradient_boosting", "mlp"]:
        p = ROOT / "models" / f"{name}_regression.pkl"
        if p.exists():
            models_reg[name] = joblib.load(p)
    for name in ["logistic_regression", "random_forest", "gradient_boosting", "mlp"]:
        p = ROOT / "models" / f"{name}_classification.pkl"
        if p.exists():
            models_clf[name] = joblib.load(p)
    metrics_reg = pd.read_csv(ROOT / "models" / "metrics_regression.csv") \
        if (ROOT / "models" / "metrics_regression.csv").exists() else pd.DataFrame()
    metrics_clf = pd.read_csv(ROOT / "models" / "metrics_classification.csv") \
        if (ROOT / "models" / "metrics_classification.csv").exists() else pd.DataFrame()
    return prep_reg, prep_clf, le, models_reg, models_clf, metrics_reg, metrics_clf

# ── Load ──────────────────────────────────────────────────────────────────────
df = load_data()
with st.spinner("Loading ML models from disk..."):
    try:
        prep_reg, prep_clf, le, models_reg, models_clf, metrics_reg, metrics_clf = load_artifacts()
        MODELS_LOADED = True
    except Exception as e:
        MODELS_LOADED = False
        st.sidebar.warning(f"Models not loaded: {e}\nRun `python main.py` first.")

model_options = list(models_reg.keys()) if MODELS_LOADED else ["N/A"]
if "active_model" not in st.session_state or st.session_state.active_model not in model_options:
    st.session_state.active_model = model_options[0]

# ── Sidebar ───────────────────────────────────────────────────────────────────
st.sidebar.title("Marketing ROI")
st.sidebar.caption("M1 Data Engineering · EFREI")
st.sidebar.markdown("---")
st.sidebar.markdown("Select a model in the **Predict**, **Budget Simulator**, or **Target Planner** tab.")

# ── Prediction helpers ────────────────────────────────────────────────────────
def predict_reg(model_name, tv, radio, sm, inf):
    name = effective_reg_model(model_name, tv, radio, sm)
    X    = pd.DataFrame([{"TV": tv, "Radio": radio, "Social Media": sm, "Influencer": inf}])
    return float(models_reg[name].predict(prep_reg.transform(X))[0]), name

def rf_prediction_distribution(tv, radio, sm, inf):
    """Return per-tree predictions from Random Forest for uncertainty estimation."""
    rf  = models_reg.get("random_forest")
    if rf is None or not hasattr(rf, "estimators_"):
        return None
    X   = pd.DataFrame([{"TV": tv, "Radio": radio, "Social Media": sm, "Influencer": inf}])
    Xt  = prep_reg.transform(X)
    return np.array([tree.predict(Xt)[0] for tree in rf.estimators_])

# ── Model selector widget ─────────────────────────────────────────────────────
def model_selector(key_suffix=""):
    """
    Horizontal radio for selecting the active regression model.
    No pre-computation of OOR — that only matters at prediction time.
    """
    active = st.session_state.active_model
    idx    = model_options.index(active) if active in model_options else 0
    selected = st.radio(
        "Regression model",
        options=model_options,
        format_func=fmt,
        index=idx,
        horizontal=True,
        key=f"model_radio_{key_suffix}",
    )
    st.session_state.active_model = selected
    return selected

# ── Tabs ──────────────────────────────────────────────────────────────────────
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "Data Overview", "Model Comparison", "Feature Importance",
    "Predict", "Budget Simulator", "Target Planner",
])

# ── TAB 1 — Data Overview ─────────────────────────────────────────────────────
with tab1:
    st.header("Data Overview")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Rows", f"{len(df):,}")
    c2.metric("Missing (TV)", int(df["TV"].isnull().sum()))
    c3.metric("Missing (Sales)", int(df["Sales"].isnull().sum()))
    c4.metric("Classes", df["perf_class"].nunique() if "perf_class" in df else "-")

    st.subheader("Feature Distributions")
    num_cols = ["TV", "Radio", "Social Media", "Sales"]
    fig, axes = plt.subplots(2, 2, figsize=(10, 6))
    for ax, col in zip(axes.flatten(), num_cols):
        sns.histplot(df[col].dropna(), kde=True, ax=ax, color="steelblue", bins=40)
        ax.set_title(col)
    plt.tight_layout(); st.pyplot(fig); plt.close()

    st.subheader("Correlation Heatmap")
    fig2, ax2 = plt.subplots(figsize=(6, 4))
    sns.heatmap(df[num_cols].corr(), annot=True, fmt=".2f",
                cmap="coolwarm", ax=ax2, vmin=-1, vmax=1)
    plt.tight_layout(); st.pyplot(fig2); plt.close()

    st.subheader("Sales by Influencer Tier")
    fig3, ax3 = plt.subplots(figsize=(7, 4))
    order = [o for o in ["Mega", "Macro", "Micro", "Nano"] if o in df["Influencer"].unique()]
    sns.boxplot(data=df, x="Influencer", y="Sales", order=order, palette="Set2", ax=ax3)
    plt.tight_layout(); st.pyplot(fig3); plt.close()

    if "perf_class" in df.columns:
        st.subheader("Campaign Performance Class Distribution")
        counts = df["perf_class"].value_counts()
        fig4, ax4 = plt.subplots(figsize=(5, 3))
        counts.plot(kind="bar", color=["#2ecc71", "#f39c12", "#e74c3c"], ax=ax4, edgecolor="k")
        ax4.set_ylabel("Count"); plt.xticks(rotation=0)
        plt.tight_layout(); st.pyplot(fig4); plt.close()

# ── TAB 2 — Model Comparison ──────────────────────────────────────────────────
with tab2:
    st.header("Model Comparison")
    col_r, col_c = st.columns(2)

    with col_r:
        st.subheader("Regression Metrics")
        if not metrics_reg.empty:
            disp = metrics_reg.copy()
            if "Model" in disp.columns:
                disp["Model"] = disp["Model"].apply(fmt)
            st.dataframe(
                disp.style
                    .highlight_max(subset=["R2"] if "R2" in disp.columns else None, color="#c6efce")
                    .highlight_min(subset=["RMSE","MAE"] if "RMSE" in disp.columns else None, color="#c6efce"),
                width="stretch",
            )
            if "R2" in metrics_reg.columns:
                fig5, ax5 = plt.subplots(figsize=(6, 3))
                metrics_reg.assign(Model=metrics_reg["Model"].apply(fmt)).plot(
                    x="Model", y="R2", kind="bar", ax=ax5,
                    color="steelblue", edgecolor="k", legend=False)
                ax5.set_ylabel("R2"); ax5.set_title("Regression R²")
                plt.xticks(rotation=25, ha="right"); plt.tight_layout()
                st.pyplot(fig5); plt.close()
        else:
            st.info("Run `python main.py` option 3 to generate metrics.")

    with col_c:
        st.subheader("Classification Metrics")
        if not metrics_clf.empty:
            disp = metrics_clf.copy()
            if "Model" in disp.columns:
                disp["Model"] = disp["Model"].apply(fmt)
            st.dataframe(
                disp.style.highlight_max(
                    subset=["F1-macro"] if "F1-macro" in disp.columns else None, color="#c6efce"),
                width="stretch",
            )
            if "F1-macro" in metrics_clf.columns:
                fig6, ax6 = plt.subplots(figsize=(6, 3))
                metrics_clf.assign(Model=metrics_clf["Model"].apply(fmt)).plot(
                    x="Model", y="F1-macro", kind="bar", ax=ax6,
                    color="coral", edgecolor="k", legend=False)
                ax6.set_ylabel("F1-macro"); ax6.set_title("Classification F1-macro")
                plt.xticks(rotation=25, ha="right"); plt.tight_layout()
                st.pyplot(fig6); plt.close()
        else:
            st.info("Run `python main.py` option 3 to generate metrics.")

# ── TAB 3 — Feature Importance ────────────────────────────────────────────────
with tab3:
    st.header("Feature Importance")
    shap_img = ROOT / "figures" / "shap_summary.png"
    fi_img   = ROOT / "figures" / "feature_importance.png"

    if shap_img.exists():
        st.subheader("SHAP Summary Plot")
        st.image(str(shap_img), width="stretch")
    else:
        st.info("SHAP plot not found. Run `python main.py` option 3 first.")

    if fi_img.exists():
        st.subheader("Native Feature Importance")
        st.image(str(fi_img), width="stretch")

    best = st.session_state.active_model
    if MODELS_LOADED and best in models_reg:
        m = models_reg[best]
        if hasattr(m, "feature_importances_") or hasattr(m, "coef_"):
            feat_names = get_feature_names(prep_reg)
            imp = (m.feature_importances_ if hasattr(m, "feature_importances_")
                   else np.abs(m.coef_).flatten())
            imp = imp[:len(feat_names)]
            df_imp = pd.DataFrame({"Feature": feat_names, "Importance": imp}).sort_values("Importance")
            st.subheader(f"Live Importance: {fmt(best)}")
            fig7, ax7 = plt.subplots(figsize=(7, 4))
            ax7.barh(df_imp["Feature"], df_imp["Importance"], color="steelblue", edgecolor="k")
            ax7.set_xlabel("Importance"); plt.tight_layout()
            st.pyplot(fig7); plt.close()

# ── TAB 4 — Predict ───────────────────────────────────────────────────────────
with tab4:
    st.header("Predict Sales & Campaign Performance")

    chosen_model = model_selector("predict")
    st.markdown("---")

    col1, col2 = st.columns(2)
    with col1:
        tv = st.slider("TV Budget ($M)", 0.0, 600.0, 50.0, 1.0,
            help=f"Training range: 0 – {TRAIN_BOUNDS['TV'][1]:.0f} M. "
                 "Values above auto-switch to Linear Regression.")
        st.caption(f"Training range: 0 – {TRAIN_BOUNDS['TV'][1]:.0f} M  "
                   f"{'🟠 out of range' if tv > TRAIN_BOUNDS['TV'][1] else '🟢 in range'}")

        radio_v = st.slider("Radio Budget ($M)", 0.0, 100.0, 20.0, 0.5,
            help=f"Training range: 0 – {TRAIN_BOUNDS['Radio'][1]:.1f} M.")
        st.caption(f"Training range: 0 – {TRAIN_BOUNDS['Radio'][1]:.1f} M  "
                   f"{'🟠 out of range' if radio_v > TRAIN_BOUNDS['Radio'][1] else '🟢 in range'}")

        sm = st.slider("Social Media Budget ($M)", 0.0, 60.0, 5.0, 0.5,
            help=f"Training range: 0 – {TRAIN_BOUNDS['Social Media'][1]:.1f} M.")
        st.caption(f"Training range: 0 – {TRAIN_BOUNDS['Social Media'][1]:.1f} M  "
                   f"{'🟠 out of range' if sm > TRAIN_BOUNDS['Social Media'][1] else '🟢 in range'}")

        inf = st.selectbox("Influencer Tier", influencer_options(),
            help="Mega = celebrity reach · Nano = niche/micro audience.")

    if MODELS_LOADED and st.button("Predict", type="primary"):
        with st.spinner(f"Running prediction..."):
            pred_sales, used_model = predict_reg(chosen_model, tv, radio_v, sm, inf)

        # Notify if model was overridden due to OOR
        if used_model != chosen_model:
            st.info(f"⚡ **{fmt(chosen_model)}** can't extrapolate beyond training range — "
                    f"used **{fmt(used_model)}** instead.")

        with st.spinner("Classifying campaign performance..."):
            if "random_forest" in models_clf:
                m_clf    = models_clf["random_forest"]
                X_tc     = prep_clf.transform(
                    pd.DataFrame([{"TV": tv, "Radio": radio_v, "Social Media": sm, "Influencer": inf}]))
                clf_pred  = m_clf.predict(X_tc)[0]
                clf_label = le.inverse_transform([clf_pred])[0]
                clf_prob  = m_clf.predict_proba(X_tc)[0].max()
                if is_oor(tv, radio_v, sm) and pred_sales > df["Sales"].max():
                    clf_label, clf_prob = "High", 1.0
            else:
                clf_label, clf_prob = "N/A", 0.0

        roi = roi_estimate(pred_sales, tv, radio_v, sm)

        with col2:
            st.metric("Predicted Sales", f"${pred_sales:,.2f}M",
                      help="Predicted by the selected regression model.")
            st.metric("Estimated ROI", f"{roi:+.1f}%",
                      help="(Predicted Sales − Total Budget) / Total Budget × 100.")
            color = {"High": "green", "Medium": "orange", "Low": "red"}.get(clf_label, "gray")
            st.markdown(
                f'<p style="font-size:0.85rem;margin-bottom:2px;color:rgba(255,255,255,0.6)">'
                f'Campaign Performance '
                f'<span title="High/Medium/Low based on Q33/Q66 sales quantiles." '
                f'style="cursor:help;color:#aaa;">(?)</span></p>'
                f'<p style="font-size:1.6rem;font-weight:700;color:{color};margin:0">{clf_label}</p>'
                f'<p style="font-size:0.8rem;color:rgba(255,255,255,0.5)">{clf_prob*100:.0f}% confidence</p>',
                unsafe_allow_html=True,
            )

# ── TAB 5 — Budget Simulator ──────────────────────────────────────────────────
with tab5:
    st.header("Budget Simulator")
    st.caption("Set a base budget, then drag the % sliders to see how sales change in real time.")

    if not MODELS_LOADED:
        st.warning("Models not loaded. Run `python main.py` first.")
    else:
        chosen_sim = model_selector("sim")
        st.markdown("---")

        col_s1, col_s2 = st.columns(2)
        with col_s1:
            base_tv = st.number_input("Base TV ($M)", value=50.0, min_value=0.0, step=1.0,
                help=f"Starting TV budget. Training max: {TRAIN_BOUNDS['TV'][1]:.0f} M.")
            base_radio = st.number_input("Base Radio ($M)", value=20.0, min_value=0.0, step=1.0,
                help=f"Starting Radio budget. Training max: {TRAIN_BOUNDS['Radio'][1]:.1f} M.")
            base_sm = st.number_input("Base Social Media ($M)", value=5.0, min_value=0.0, step=0.5,
                help=f"Starting Social Media budget. Training max: {TRAIN_BOUNDS['Social Media'][1]:.1f} M.")
            base_inf = st.selectbox("Base Influencer Tier", influencer_options(), key="sim_inf",
                help="Influencer tier used throughout the simulation.")
            st.caption("🟠 Base values exceed training range — using Linear Regression."
                       if is_oor(base_tv, base_radio, base_sm)
                       else "🟢 All base values within training range.")

        with col_s2:
            tv_pct    = st.slider("TV change (%)", -80, 200, 0, 5,
                                  help="+50% means TV × 1.5.")
            radio_pct = st.slider("Radio change (%)", -80, 200, 0, 5)
            sm_pct    = st.slider("Social Media change (%)", -80, 200, 0, 5)

        tv_new    = base_tv    * (1 + tv_pct    / 100)
        radio_new = base_radio * (1 + radio_pct / 100)
        sm_new    = base_sm    * (1 + sm_pct    / 100)

        with st.spinner("Computing projections..."):
            base_sales, _ = predict_reg(chosen_sim, base_tv, base_radio, base_sm, base_inf)
            new_sales,  _ = predict_reg(chosen_sim, tv_new, radio_new, sm_new, base_inf)

        delta_pct = (new_sales - base_sales) / base_sales * 100 if base_sales else 0

        r1, r2, r3 = st.columns(3)
        r1.metric("Baseline Sales", f"${base_sales:,.2f}M",
                  help="Predicted sales at base budget, 0% change.")
        r2.metric("Projected Sales", f"${new_sales:,.2f}M", delta=f"{delta_pct:+.1f}%",
                  help="Predicted sales after applying % changes.")
        r3.metric("Budget Change",
                  f"${tv_new + radio_new + sm_new:,.1f}M",
                  delta=f"{tv_new+radio_new+sm_new - base_tv-base_radio-base_sm:+.1f}M",
                  help="Total adjusted budget vs baseline.")

        st.subheader("Sales sensitivity: TV budget sweep")
        st.caption("Predicted sales as TV spend increases 0 → 600 M, other channels held fixed.")
        with st.spinner("Generating sensitivity chart..."):
            tv_range    = np.linspace(0, 600, 80)
            sales_curve = [predict_reg(chosen_sim, t, radio_new, sm_new, base_inf)[0]
                           for t in tv_range]

        fig_sim, ax_sim = plt.subplots(figsize=(8, 3))
        ax_sim.plot(tv_range, sales_curve, color="steelblue", linewidth=2)
        ax_sim.axvline(tv_new, color="red", linestyle="--",
                       label=f"Current TV = {tv_new:.0f} M")
        ax_sim.axvline(TRAIN_BOUNDS["TV"][1], color="orange", linestyle=":",
                       linewidth=1.5, label=f"Training max ({TRAIN_BOUNDS['TV'][1]:.0f} M)")
        ax_sim.set(xlabel="TV Budget ($M)", ylabel="Predicted Sales ($M)",
                   title="Sales vs TV Budget")
        ax_sim.legend(); plt.tight_layout()
        st.pyplot(fig_sim); plt.close()

# ── TAB 6 — Target Planner ────────────────────────────────────────────────────
with tab6:
    st.header("Target Planner")
    st.caption(
        "Two tools in one: **① Inverse Prediction** — set a sales target and find the budget that reaches it. "
        "**② Probability Analysis** — given your current budget, estimate the chance of hitting a sales goal."
    )

    if not MODELS_LOADED:
        st.warning("Models not loaded. Run `python main.py` first.")
    else:
        # ── Section 1: Inverse Prediction ────────────────────────────────────
        st.subheader("① Inverse Prediction — Budget for a Sales Target")
        st.markdown(
            "Enter a target sales figure and choose an influencer tier. "
            "The optimizer will find the TV / Radio / Social Media mix that gets closest to your goal."
        )

        ip_col1, ip_col2 = st.columns(2)
        with ip_col1:
            # Determine max allowable target based on the currently selected model.
            # Tree models (RF, GB) are hard-capped at their training output ceiling;
            # Linear Regression and MLP can extrapolate so we allow 3× the training max.
            _max_train_sales = float(df["Sales"].max())
            _cur_ip_model    = st.session_state.get("ip_model", model_options[0])
            _target_ceiling  = float(
                _max_train_sales if _cur_ip_model in TREE_MODELS
                else round(_max_train_sales * 3.0 / 10) * 10
            )
            target_sales = st.number_input(
                "Target Sales ($M)",
                value=min(200.0, _target_ceiling),
                min_value=1.0,
                max_value=_target_ceiling,
                step=10.0,
                help=(
                    f"Max: ${_target_ceiling:,.0f}M — training ceiling for tree models."
                    if _cur_ip_model in TREE_MODELS
                    else f"Max: ${_target_ceiling:,.0f}M — Linear Regression / MLP can extrapolate."
                ),
            )
            ip_inf = st.selectbox("Influencer Tier", influencer_options(), key="ip_inf",
                help="Influencer tier to assume for the budget recommendation.")
            ip_model = st.radio(
                "Model for optimization", model_options,
                format_func=fmt, horizontal=True, key="ip_model",
                help="Which regression model the optimizer uses internally.")
            max_budget = st.number_input(
                "Max total budget ($M)", value=400.0, min_value=10.0, step=10.0,
                help="Upper bound on TV + Radio + Social Media combined spend.")

        if st.button("Find Optimal Budget", type="primary"):
            max_train_sales = float(df["Sales"].max())

            # ── Target-OOR check ──────────────────────────────────────────────
            # Tree models (RF, GB) are capped at their training output range and
            # cannot predict beyond the highest Sales value seen during training.
            # If the target exceeds that ceiling, the optimizer converges to garbage.
            # Fix: auto-switch to Linear Regression for out-of-range targets.
            target_oor = target_sales > max_train_sales and ip_model in TREE_MODELS
            effective_ip_model = "linear_regression" if target_oor else ip_model

            if target_oor:
                st.warning(
                    f"**Target ${target_sales:,.0f}M is above the training ceiling "
                    f"(${max_train_sales:,.0f}M).** "
                    f"Tree models cannot extrapolate beyond values seen during training — "
                    f"switched automatically to **Linear Regression** for this optimization."
                )

            with st.spinner("Running optimizer..."):
                # Objective: minimize (predicted - target)^2
                def objective(x):
                    tv_o, rad_o, sm_o = float(x[0]), float(x[1]), float(x[2])
                    pred, _ = predict_reg(effective_ip_model, tv_o, rad_o, sm_o, ip_inf)
                    return (pred - target_sales) ** 2

                # Start from median values in training data
                x0     = [df["TV"].median(), df["Radio"].median(), df["Social Media"].median()]
                bounds = [(0, 600), (0, 100), (0, 60)]
                # Budget constraint: total <= max_budget
                constraints = [{"type": "ineq", "fun": lambda x: max_budget - sum(x)}]

                result = minimize(objective, x0, method="SLSQP",
                                  bounds=bounds, constraints=constraints,
                                  options={"maxiter": 500, "ftol": 1e-6})

                opt_tv, opt_radio, opt_sm = result.x
                opt_pred, opt_used = predict_reg(effective_ip_model, opt_tv, opt_radio, opt_sm, ip_inf)
                opt_total   = opt_tv + opt_radio + opt_sm
                opt_roi     = roi_estimate(opt_pred, opt_tv, opt_radio, opt_sm)

            with ip_col2:
                st.markdown("**Recommended budget**")
                b1, b2, b3 = st.columns(3)
                b1.metric("TV",          f"${opt_tv:.1f}M")
                b2.metric("Radio",       f"${opt_radio:.1f}M")
                b3.metric("Social Media",f"${opt_sm:.1f}M")

                st.metric("Total Budget", f"${opt_total:.1f}M")
                gap = opt_pred - target_sales
                st.metric("Predicted Sales",
                           f"${opt_pred:,.2f}M",
                           delta=f"{gap:+.2f}M vs target",
                           delta_color="normal")
                st.metric("Estimated ROI", f"{opt_roi:+.1f}%")

                # Model-override notices
                if target_oor:
                    st.info(
                        f"Used **Linear Regression** — target ${target_sales:,.0f}M exceeds "
                        f"training max ${max_train_sales:,.0f}M. Linear Regression can extrapolate; "
                        "tree models are hard-capped at their training output range."
                    )
                elif opt_used != ip_model:
                    st.caption(f"⚡ Optimizer used **{fmt(opt_used)}** (Linear Regression) "
                               "because the solution is outside training input bounds.")

                # Warn if even linear regression couldn't close the gap
                # (e.g. max_budget is too low)
                if abs(gap) > target_sales * 0.10:
                    st.warning(
                        f"The optimizer is still **${abs(gap):,.1f}M "
                        f"({'above' if gap > 0 else 'below'} target** "
                        f"after using the full budget cap of ${max_budget:,.0f}M. "
                        "Try raising the **Max total budget** to close the gap."
                    )

                # Budget breakdown pie
                fig_pie, ax_pie = plt.subplots(figsize=(4, 4))
                sizes  = [opt_tv, opt_radio, opt_sm]
                labels = [f"TV\n${opt_tv:.1f}M", f"Radio\n${opt_radio:.1f}M",
                          f"Social\n${opt_sm:.1f}M"]
                colors = ["#4C9BE8", "#E88A4C", "#4CE8A0"]
                wedges, texts, autotexts = ax_pie.pie(
                    sizes, labels=labels, colors=colors,
                    autopct="%1.0f%%", startangle=90,
                    wedgeprops={"edgecolor": "white", "linewidth": 1.5})
                for t in autotexts:
                    t.set_fontsize(10)
                ax_pie.set_title("Budget Allocation", pad=12)
                plt.tight_layout()
                st.pyplot(fig_pie); plt.close()

        st.markdown("---")

        # ── Section 2: Probability Analysis ──────────────────────────────────
        st.subheader("② Probability Analysis — Chance of Hitting a Sales Goal")
        st.markdown(
            "Given your budget inputs, the Random Forest ensemble estimates how likely you are "
            "to reach a sales goal (using the spread of individual tree predictions)."
        )

        pa_col1, pa_col2 = st.columns(2)
        with pa_col1:
            pa_tv    = st.slider("TV Budget ($M)", 0.0, 600.0, 50.0, 1.0, key="pa_tv",
                help=f"Training range: 0 – {TRAIN_BOUNDS['TV'][1]:.0f} M.")
            pa_radio = st.slider("Radio Budget ($M)", 0.0, 100.0, 20.0, 0.5, key="pa_radio",
                help=f"Training range: 0 – {TRAIN_BOUNDS['Radio'][1]:.1f} M.")
            pa_sm    = st.slider("Social Media ($M)", 0.0, 60.0, 5.0, 0.5, key="pa_sm",
                help=f"Training range: 0 – {TRAIN_BOUNDS['Social Media'][1]:.1f} M.")
            pa_inf   = st.selectbox("Influencer Tier", influencer_options(), key="pa_inf")
            pa_goal  = st.number_input(
                "Sales goal ($M)", value=150.0, min_value=1.0, step=10.0,
                help="The threshold you want to exceed. The tool estimates P(sales ≥ this value).")

        with pa_col2:
            with st.spinner("Computing prediction distribution..."):
                tree_preds = rf_prediction_distribution(pa_tv, pa_radio, pa_sm, pa_inf)

            if tree_preds is not None:
                mean_pred = float(np.mean(tree_preds))
                std_pred  = float(np.std(tree_preds))
                prob_hit  = float(np.mean(tree_preds >= pa_goal))

                st.metric("RF Mean Prediction", f"${mean_pred:,.2f}M",
                          help="Average across all Random Forest trees.")
                st.metric("Prediction Spread (±1σ)",
                          f"${mean_pred - std_pred:,.2f}M – ${mean_pred + std_pred:,.2f}M",
                          help="Range covering ~68% of tree predictions.")

                # Probability gauge
                color_prob = "green" if prob_hit >= 0.7 else "orange" if prob_hit >= 0.4 else "red"
                st.markdown(
                    f'<p style="font-size:0.9rem;color:rgba(255,255,255,0.6);margin-bottom:4px">'
                    f'P(sales ≥ ${pa_goal:.0f}M)</p>'
                    f'<p style="font-size:2rem;font-weight:700;color:{color_prob};margin:0">'
                    f'{prob_hit*100:.1f}%</p>'
                    f'<p style="font-size:0.8rem;color:rgba(255,255,255,0.45)">'
                    f'Based on {len(tree_preds)} RF trees</p>',
                    unsafe_allow_html=True,
                )

                # Distribution histogram
                fig_dist, ax_dist = plt.subplots(figsize=(6, 3))
                ax_dist.hist(tree_preds, bins=40, color="steelblue",
                             edgecolor="white", alpha=0.85, label="Tree predictions")
                ax_dist.axvline(mean_pred, color="white", linewidth=1.5,
                                linestyle="--", label=f"Mean = ${mean_pred:.1f}M")
                ax_dist.axvline(pa_goal, color="orange", linewidth=2,
                                linestyle="-", label=f"Goal = ${pa_goal:.0f}M")
                ax_dist.fill_betweenx(
                    [0, ax_dist.get_ylim()[1] if ax_dist.get_ylim()[1] > 0 else 1],
                    pa_goal, max(tree_preds),
                    alpha=0.15, color="green", label=f"P(≥ goal) = {prob_hit*100:.1f}%"
                )
                ax_dist.set(xlabel="Predicted Sales ($M)",
                            ylabel="Number of trees",
                            title="RF Prediction Distribution")
                ax_dist.legend(fontsize=8); plt.tight_layout()
                st.pyplot(fig_dist); plt.close()
            else:
                st.warning("Random Forest model not available for uncertainty estimation.")
