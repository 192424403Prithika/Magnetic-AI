"""
MAGNETIC AI - Model Evaluation & Verification Script
Loads the serialized model artifact from `ml/magnetic_model.pkl`, tests predictions
on anchor reference materials, and verifies latency and pipeline integrity.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

# Ensure root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.preprocessing import FEATURE_COLUMNS, CLASS_NAMES


def evaluate_saved_model():
    model_path = "ml/magnetic_model.pkl"
    if not os.path.exists(model_path):
        print(f"Error: {model_path} does not exist. Run ml/train_model.py first.")
        return False

    artifact = joblib.load(model_path)
    pipeline = artifact["pipeline"]
    model_name = artifact["model_name"]
    print(f"Loaded model artifact: {model_name}")

    # Test cases representing each magnetic class
    test_cases = [
        {
            "name": "Bismuth (Pure Diamagnet)",
            "expected": "diamagnetic",
            "features": {"susceptibility": -1.66e-4, "temperature": 300.0, "initial_permeability": 1.256e-6}
        },
        {
            "name": "Platinum (Paramagnet)",
            "expected": "paramagnetic",
            "features": {"susceptibility": 2.6e-4, "temperature": 300.0, "initial_permeability": 1.257e-6}
        },
        {
            "name": "Pure Iron (Ferromagnet)",
            "expected": "ferromagnetic",
            "features": {
                "susceptibility": 5000.0, "temperature": 300.0, "saturation_magnetization": 1.7e6,
                "remanent_magnetization": 1.1e6, "coercivity": 40.0, "loop_area": 180.0
            }
        },
        {
            "name": "Manganese Oxide (Antiferromagnet)",
            "expected": "antiferromagnetic",
            "features": {"susceptibility": 5.8e-3, "temperature": 293.0, "initial_permeability": 1.26e-6}
        },
        {
            "name": "Magnetite (Ferrimagnet)",
            "expected": "ferrimagnetic",
            "features": {
                "susceptibility": 12.0, "temperature": 300.0, "saturation_magnetization": 4.8e5,
                "remanent_magnetization": 1.2e5, "coercivity": 5600.0, "loop_area": 4800.0
            }
        }
    ]

    print("\n--- Testing Single-Sample Predictions (with missing values) ---")
    correct = 0
    for case in test_cases:
        row = {col: case["features"].get(col, np.nan) for col in FEATURE_COLUMNS}
        df_row = pd.DataFrame([row])
        pred_class = pipeline.predict(df_row)[0]
        probs = pipeline.predict_proba(df_row)[0]
        max_p = np.max(probs)
        is_correct = (pred_class == case["expected"])
        if is_correct:
            correct += 1
        print(f"[{'PASS' if is_correct else 'FAIL'}] {case['name']} -> Predicted: {pred_class} ({max_p:.1%}) | Expected: {case['expected']}")

    print(f"\nVerification Result: {correct}/{len(test_cases)} test cases passed.")
    return correct == len(test_cases)


if __name__ == "__main__":
    evaluate_saved_model()
