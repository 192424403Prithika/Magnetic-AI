"""
MAGNETIC AI - Preprocessing and Feature Pipelines
Handles missing values (NaN) with MissingIndicator and robust feature scaling.
SI features:
1. susceptibility (χ)
2. temperature (K)
3. saturation_magnetization (A/m)
4. remanent_magnetization (A/m)
5. coercivity (A/m)
6. initial_permeability (H/m)
7. loop_area (J/m³)
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import RobustScaler

FEATURE_COLUMNS: List[str] = [
    "susceptibility",
    "temperature",
    "saturation_magnetization",
    "remanent_magnetization",
    "coercivity",
    "initial_permeability",
    "loop_area"
]

CLASS_NAMES: List[str] = [
    "diamagnetic",
    "paramagnetic",
    "ferromagnetic",
    "antiferromagnetic",
    "ferrimagnetic"
]


def create_preprocessor() -> Pipeline:
    """
    Creates an sklearn pipeline that:
    1. Imputes missing physical values with median while adding explicit missing-indicator columns.
    2. Scales the features using RobustScaler (handles wide dynamic ranges in magnetic fields).
    """
    preprocessor = Pipeline([
        ("imputer", SimpleImputer(strategy="median", add_indicator=True)),
        ("scaler", RobustScaler())
    ])
    return preprocessor


def compute_feature_bounds(df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    """
    Computes min, max, median, 1st and 99th percentiles for out-of-distribution (OOD) checks.
    """
    bounds = {}
    for col in FEATURE_COLUMNS:
        valid_vals = df[col].dropna()
        if len(valid_vals) > 0:
            bounds[col] = {
                "min": float(valid_vals.min()),
                "max": float(valid_vals.max()),
                "p01": float(np.percentile(valid_vals, 1)),
                "p99": float(np.percentile(valid_vals, 99)),
                "median": float(valid_vals.median())
            }
        else:
            bounds[col] = {"min": 0.0, "max": 0.0, "p01": 0.0, "p99": 0.0, "median": 0.0}
    return bounds


def check_out_of_distribution(
    input_features: Dict[str, Any],
    bounds: Dict[str, Dict[str, float]],
    entropy: float = 0.0,
    max_prob: float = 1.0
) -> Dict[str, Any]:
    """
    Evaluates whether an input sample is Out-Of-Distribution (OOD):
    1. Feature values outside training bounds (p01 - 3*IQR, p99 + 3*IQR).
    2. Prediction entropy high or max probability low (< 0.40).
    """
    ood_flags = []
    reasons = []

    for col in FEATURE_COLUMNS:
        val = input_features.get(col)
        if val is not None and not np.isnan(val):
            col_b = bounds.get(col, {})
            p01 = col_b.get("p01", -np.inf)
            p99 = col_b.get("p99", np.inf)
            span = max(1e-9, p99 - p01)
            lower_bound = p01 - 3.0 * span
            upper_bound = p99 + 3.0 * span

            if val < lower_bound or val > upper_bound:
                ood_flags.append(col)
                reasons.append(
                    f"Feature '{col}' value {val:g} is far outside reference range [{col_b.get('min'):g}, {col_b.get('max'):g}]."
                )

    if max_prob < 0.40:
        ood_flags.append("low_confidence")
        reasons.append(f"Model highest class probability is only {max_prob:.1%}, indicating high ambiguity across classes.")

    if entropy > 1.45:
        ood_flags.append("high_entropy")
        reasons.append(f"Prediction entropy is {entropy:.2f} (high uncertainty across multiple magnetic states).")

    is_ood = len(ood_flags) > 0

    return {
        "is_ood": is_ood,
        "flagged_features": ood_flags,
        "warning_message": (
            "Caution: Input values appear out-of-distribution or ambiguous relative to the training dataset. "
            "Predictions should be interpreted with engineering discretion."
            if is_ood else "Input values within nominal expected distribution ranges."
        ),
        "details": reasons
    }
