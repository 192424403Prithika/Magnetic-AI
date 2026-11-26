"""
MAGNETIC AI - ML Training Pipeline
Trains, cross-validates, and compares 4 classification models:
1. Random Forest (primary)
2. Gradient Boosting
3. Support Vector Machine (RBF, probability=True)
4. Decision Tree

Key Physics & Data Science Requirements:
- GroupKFold by base material_name to strictly prevent data leakage across simulated variants.
- Missing values handled via SimpleImputer(add_indicator=True) and RobustScaler.
- Models tuned and selected based on cross-validated Macro-F1 score.
- Saves:
  - Best model artifact to `ml/magnetic_model.pkl`
  - Model metrics, confusion matrix & comparisons to `ml/metrics.json`
  - Confusion matrix visualization plot to `ml/confusion_matrix.png`
"""

import os
import sys
import json

# Ensure project root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.pipeline import Pipeline
from sklearn.model_selection import GroupKFold, cross_validate
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    accuracy_score,
    precision_score,
    recall_score
)
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from backend.preprocessing import (
    FEATURE_COLUMNS,
    CLASS_NAMES,
    create_preprocessor,
    compute_feature_bounds
)


def extract_base_group(name: str) -> str:
    """Extracts base material name to group variants and prevent leakage."""
    return name.split(" (Simulated")[0].strip()


def run_training():
    dataset_path = "ml/dataset.csv"
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}, generating...")
        from ml.generate_dataset import generate_dataset
        generate_dataset(dataset_path)

    df = pd.read_csv(dataset_path)
    print(f"Loaded dataset: {len(df)} rows.")

    X = df[FEATURE_COLUMNS].copy()
    y = df["material_type"].copy()
    groups = df["material_name"].apply(extract_base_group).values

    bounds = compute_feature_bounds(df)

    # 4 Model Candidates
    candidates = {
        "Random Forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_split=3,
            random_state=42,
            class_weight="balanced"
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=80,
            learning_rate=0.1,
            max_depth=4,
            random_state=42
        ),
        "Support Vector Machine (RBF)": SVC(
            C=10.0,
            kernel="rbf",
            probability=True,
            random_state=42
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=8,
            random_state=42,
            class_weight="balanced"
        )
    }

    gkf = GroupKFold(n_splits=5)
    model_comparisons = {}
    best_model_name = None
    best_f1 = -1.0
    best_pipeline = None

    print("\n--- Evaluating Models with GroupKFold Cross-Validation ---")
    for name, clf in candidates.items():
        pipeline = Pipeline([
            ("preprocessor", create_preprocessor()),
            ("classifier", clf)
        ])

        cv_results = cross_validate(
            pipeline,
            X,
            y,
            groups=groups,
            cv=gkf,
            scoring=["accuracy", "f1_macro", "precision_macro", "recall_macro"],
            return_train_score=False
        )

        acc = float(np.mean(cv_results["test_accuracy"]))
        f1 = float(np.mean(cv_results["test_f1_macro"]))
        prec = float(np.mean(cv_results["test_precision_macro"]))
        rec = float(np.mean(cv_results["test_recall_macro"]))

        model_comparisons[name] = {
            "cv_accuracy": round(acc, 4),
            "cv_f1_macro": round(f1, 4),
            "cv_precision_macro": round(prec, 4),
            "cv_recall_macro": round(rec, 4)
        }
        print(f"[{name}] Acc: {acc:.4f} | Macro-F1: {f1:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f}")

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_pipeline = pipeline

    print(f"\nSelected Best Model: {best_model_name} (Macro-F1: {best_f1:.4f})")

    # Fit best pipeline on full dataset for production artifact
    best_pipeline.fit(X, y)

    # Predictions and detailed evaluation on full dataset
    y_pred = best_pipeline.predict(X)
    report_dict = classification_report(y, y_pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y, y_pred, labels=CLASS_NAMES)

    # Feature importances if available
    feature_importances = {}
    clf_obj = best_pipeline.named_steps["classifier"]
    if hasattr(clf_obj, "feature_importances_"):
        # The imputer with add_indicator creates 7 numeric + missing indicators
        imputer = best_pipeline.named_steps["preprocessor"].named_steps["imputer"]
        imputed_names = list(FEATURE_COLUMNS)
        if hasattr(imputer, "indicator_") and imputer.indicator_ is not None:
            for idx in imputer.indicator_.features_:
                imputed_names.append(f"{FEATURE_COLUMNS[idx]}_missing_flag")
        
        raw_importances = clf_obj.feature_importances_
        for i, imp in enumerate(raw_importances[:len(imputed_names)]):
            feature_importances[imputed_names[i]] = float(round(imp, 4))

    # Save metrics JSON
    metrics_payload = {
        "best_model": best_model_name,
        "classes": CLASS_NAMES,
        "feature_columns": FEATURE_COLUMNS,
        "feature_bounds": bounds,
        "model_comparison": model_comparisons,
        "overall_accuracy": round(float(accuracy_score(y, y_pred)), 4),
        "overall_f1_macro": round(float(f1_score(y, y_pred, average="macro")), 4),
        "per_class_metrics": {
            cls: {
                "precision": round(float(report_dict.get(cls, {}).get("precision", 0.0)), 4),
                "recall": round(float(report_dict.get(cls, {}).get("recall", 0.0)), 4),
                "f1_score": round(float(report_dict.get(cls, {}).get("f1-score", 0.0)), 4),
                "support": int(report_dict.get(cls, {}).get("support", 0))
            }
            for cls in CLASS_NAMES
        },
        "confusion_matrix": cm.tolist(),
        "feature_importances": feature_importances,
        "scientific_disclaimer": (
            "Trained on a small reference + physically simulated dataset; "
            "probabilities are model scores, not validated scientific confidence. "
            "Verify all critical engineering designs with calibrated physical magnetometry (VSM/SQUID)."
        )
    }

    metrics_file = "ml/metrics.json"
    with open(metrics_file, "w") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Saved metrics to {metrics_file}")

    # Plot Confusion Matrix
    plt.figure(figsize=(7, 6))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title(f"Confusion Matrix: {best_model_name}")
    plt.colorbar()
    tick_marks = np.arange(len(CLASS_NAMES))
    plt.xticks(tick_marks, [c[:6] for c in CLASS_NAMES], rotation=45)
    plt.yticks(tick_marks, [c[:6] for c in CLASS_NAMES])

    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], "d"),
                     horizontalalignment="center",
                     color="white" if cm[i, j] > thresh else "black")

    plt.ylabel("True Class")
    plt.xlabel("Predicted Class")
    plt.tight_layout()
    cm_plot_file = "ml/confusion_matrix.png"
    plt.savefig(cm_plot_file, dpi=180)
    plt.close()
    print(f"Saved confusion matrix plot to {cm_plot_file}")

    # Save model artifact
    model_artifact_path = "ml/magnetic_model.pkl"
    joblib.dump({
        "pipeline": best_pipeline,
        "classes": CLASS_NAMES,
        "feature_columns": FEATURE_COLUMNS,
        "bounds": bounds,
        "model_name": best_model_name,
        "metrics": metrics_payload
    }, model_artifact_path)
    print(f"Saved trained model artifact to {model_artifact_path}")


if __name__ == "__main__":
    run_training()
