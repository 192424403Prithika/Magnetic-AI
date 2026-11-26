"""
MAGNETIC AI - Production Classifier Service
Loads the trained ML pipeline and exposes clean inference methods with:
1. Probabilistic 5-category magnetic classification (Trained ML Ensemble)
2. Hard vs Soft material behavior classification for ferromagnetic/ferrimagnetic samples
3. Out-of-distribution (OOD) and ambiguity detection
4. SHAP feature attributions and plain-English physical explanations
5. Industrial application suitability recommendations
6. Curated preset reference materials library
"""

import os
import json
import math
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import joblib

from backend.preprocessing import (
    FEATURE_COLUMNS,
    CLASS_NAMES,
    check_out_of_distribution
)
from backend.physics_engine import classify_hard_or_soft_magnetic, MU_0
from backend.explain import ExplainerEngine
from backend.recommendations import evaluate_application_suitability

MODEL_PATH = "ml/magnetic_model.pkl"
METRICS_PATH = "ml/metrics.json"

# Curated presets library for easy testing and demonstrations
PRESET_MATERIALS = [
    {
        "id": "fe_pure",
        "name": "Pure Iron (Soft Ferromagnet)",
        "category_expected": "ferromagnetic",
        "description": "High saturation, low coercivity soft magnetic element used in electromagnets and pole pieces.",
        "features": {
            "susceptibility": 5000.0,
            "temperature": 300.0,
            "saturation_magnetization": 1.71e6,
            "remanent_magnetization": 1.15e6,
            "coercivity": 40.0,
            "initial_permeability": float(MU_0 * 250.0),
            "loop_area": 180.0
        }
    },
    {
        "id": "ndfeb_n42",
        "name": "Neodymium Magnet (Nd2Fe14B, Hard Ferromagnet)",
        "category_expected": "ferromagnetic",
        "description": "Sintered rare-earth permanent magnet with ultra-high energy product and extreme coercivity.",
        "features": {
            "susceptibility": 1.15,
            "temperature": 300.0,
            "saturation_magnetization": 1.28e6,
            "remanent_magnetization": 1.20e6,
            "coercivity": 875000.0,
            "initial_permeability": float(MU_0 * 1.05),
            "loop_area": 3800000.0
        }
    },
    {
        "id": "permalloy",
        "name": "Permalloy (Ni80Fe20, Ultra-Soft)",
        "category_expected": "ferromagnetic",
        "description": "Nickel-iron alloy possessing exceptionally high permeability and negligible coercivity, ideal for magnetic shielding.",
        "features": {
            "susceptibility": 100000.0,
            "temperature": 300.0,
            "saturation_magnetization": 8.6e5,
            "remanent_magnetization": 4.5e5,
            "coercivity": 2.0,
            "initial_permeability": float(MU_0 * 8000.0),
            "loop_area": 8.0
        }
    },
    {
        "id": "magnetite",
        "name": "Magnetite (Fe3O4, Natural Ferrimagnet)",
        "category_expected": "ferrimagnetic",
        "description": "Inverted spinel ferrite with opposing Fe2+ and Fe3+ sublattice moments yielding net spontaneous magnetization.",
        "features": {
            "susceptibility": 12.0,
            "temperature": 300.0,
            "saturation_magnetization": 4.8e5,
            "remanent_magnetization": 1.2e5,
            "coercivity": 5600.0,
            "initial_permeability": float(MU_0 * 15.0),
            "loop_area": 4800.0
        }
    },
    {
        "id": "mnzn_ferrite",
        "name": "MnZn Soft Ferrite",
        "category_expected": "ferrimagnetic",
        "description": "High-frequency ceramic ferrite with high resistivity (> 1 Ω·m) and low eddy loss for switch-mode transformers.",
        "features": {
            "susceptibility": 2500.0,
            "temperature": 300.0,
            "saturation_magnetization": 3.8e5,
            "remanent_magnetization": 6.5e4,
            "coercivity": 12.0,
            "initial_permeability": float(MU_0 * 2000.0),
            "loop_area": 45.0
        }
    },
    {
        "id": "bismuth",
        "name": "Bismuth (Strong Diamagnet)",
        "category_expected": "diamagnetic",
        "description": "Strongest standard elemental diamagnet, exhibits repulsive Lenz-law orbital response in inhomogeneous fields.",
        "features": {
            "susceptibility": -1.66e-4,
            "temperature": 300.0,
            "saturation_magnetization": None,
            "remanent_magnetization": None,
            "coercivity": None,
            "initial_permeability": float(MU_0 * (1.0 - 1.66e-4)),
            "loop_area": None
        }
    },
    {
        "id": "aluminum",
        "name": "Aluminum (Paramagnet)",
        "category_expected": "paramagnetic",
        "description": "Pauli paramagnetic metal containing conduction electrons that align slightly with an applied magnetic field.",
        "features": {
            "susceptibility": 2.2e-5,
            "temperature": 293.0,
            "saturation_magnetization": None,
            "remanent_magnetization": None,
            "coercivity": None,
            "initial_permeability": float(MU_0 * (1.0 + 2.2e-5)),
            "loop_area": None
        }
    },
    {
        "id": "mno",
        "name": "Manganese Oxide (MnO, Antiferromagnet)",
        "category_expected": "antiferromagnetic",
        "description": "Classic Néel antiferromagnet (TN ≈ 118 K) exhibiting antiparallel Superexchange between Mn2+ ions via O2-.",
        "features": {
            "susceptibility": 5.8e-3,
            "temperature": 293.0,
            "saturation_magnetization": None,
            "remanent_magnetization": None,
            "coercivity": None,
            "initial_permeability": float(MU_0 * (1.0 + 5.8e-3)),
            "loop_area": None
        }
    }
]


class MagneticClassifierService:
    def __init__(self):
        self.model_loaded = False
        self.pipeline = None
        self.classes = CLASS_NAMES
        self.feature_columns = FEATURE_COLUMNS
        self.bounds = {}
        self.explainer = None
        self.metrics = {}
        self.load_model()

    def load_model(self):
        if not os.path.exists(MODEL_PATH):
            print(f"Warning: {MODEL_PATH} not found. Training model now...")
            try:
                from ml.train_model import run_training
                run_training()
            except Exception as e:
                print(f"Failed to auto-train model: {e}")
                return

        try:
            artifact = joblib.load(MODEL_PATH)
            self.pipeline = artifact["pipeline"]
            self.classes = artifact.get("classes", CLASS_NAMES)
            self.feature_columns = artifact.get("feature_columns", FEATURE_COLUMNS)
            self.bounds = artifact.get("bounds", {})
            self.metrics = artifact.get("metrics", {})
            self.explainer = ExplainerEngine(self.pipeline, self.classes)
            self.model_loaded = True
            print("Successfully loaded ML pipeline and Explainer Engine.")
        except Exception as e:
            print(f"Error loading model artifact: {e}")

    def classify(self, input_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes end-to-end ML classification with XAI, OOD warnings, hard/soft labeling, and recommendations.
        """
        if not self.model_loaded or self.pipeline is None:
            raise RuntimeError("ML model is not loaded.")

        # Prepare features DataFrame
        cleaned_features = {}
        for col in self.feature_columns:
            val = input_features.get(col)
            if val is not None and not (isinstance(val, float) and math.isnan(val)):
                cleaned_features[col] = float(val)
            else:
                cleaned_features[col] = np.nan

        df_input = pd.DataFrame([cleaned_features])

        # 1. ML Prediction & Probabilities
        predicted_class = str(self.pipeline.predict(df_input)[0])
        probabilities_raw = self.pipeline.predict_proba(df_input)[0]

        prob_dict = {
            self.classes[i]: round(float(prob), 4)
            for i, prob in enumerate(probabilities_raw)
        }
        max_prob = float(np.max(probabilities_raw))

        # Calculate prediction entropy: -sum(p * log2(p))
        entropy = float(-np.sum([p * np.log2(p) for p in probabilities_raw if p > 1e-9]))

        # 2. Out-Of-Distribution (OOD) Check
        ood_result = check_out_of_distribution(
            input_features=cleaned_features,
            bounds=self.bounds,
            entropy=entropy,
            max_prob=max_prob
        )

        # 3. Hard vs Soft Sub-Classifier
        # Hard/soft is a behavior class for ferromagnetic or ferrimagnetic materials based on Hc
        hc_val = cleaned_features.get("coercivity")
        br_val = cleaned_features.get("remanent_magnetization")
        area_val = cleaned_features.get("loop_area")

        if predicted_class in ["ferromagnetic", "ferrimagnetic"] and hc_val is not None and not np.isnan(hc_val):
            hard_soft_info = classify_hard_or_soft_magnetic(
                coercivity_hc=hc_val,
                remanence_br=br_val,
                loop_area=area_val
            )
        else:
            hard_soft_info = {
                "behavior_class": "Not Applicable",
                "class_code": "na",
                "coercivity_value": None,
                "unit": "A/m",
                "description": f"Hard/soft behavior classification is only defined for remanent ferromagnetic and ferrimagnetic materials.",
                "note": "Hard vs soft is a behavior class, NOT a fifth fundamental magnetic ordering category."
            }

        # 4. Explainable AI (SHAP & Narrative)
        xai_info = self.explainer.explain_instance(
            features_dict=cleaned_features,
            predicted_class=predicted_class,
            predicted_proba=prob_dict
        )

        # 5. Industrial Application Suitability
        ms_val = cleaned_features.get("saturation_magnetization")
        mu_val = cleaned_features.get("initial_permeability")
        bs_approx = MU_0 * (ms_val + (hc_val or 0.0)) if ms_val is not None and not np.isnan(ms_val) else 0.1

        applications = evaluate_application_suitability(
            category=predicted_class,
            coercivity_hc=hc_val if hc_val is not None and not np.isnan(hc_val) else None,
            remanence_br=br_val if br_val is not None and not np.isnan(br_val) else None,
            saturation_bs=bs_approx,
            loop_area=area_val if area_val is not None and not np.isnan(area_val) else None,
            initial_permeability=mu_val if mu_val is not None and not np.isnan(mu_val) else None
        )

        return {
            "predicted_category": predicted_class,
            "probabilities": prob_dict,
            "confidence_score": round(max_prob, 4),
            "entropy": round(entropy, 3),
            "hard_soft_classification": hard_soft_info,
            "out_of_distribution": ood_result,
            "xai": xai_info,
            "applications": applications,
            "input_features": cleaned_features,
            "disclaimer": (
                "Trained on a small reference + simulated dataset; "
                "probabilities are model scores, not validated scientific confidence. "
                "Physical measurements using VSM, SQUID, or Epstein frame are required for certified material qualification."
            )
        }


# Singleton service instance
classifier_service = MagneticClassifierService()
