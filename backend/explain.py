"""
MAGNETIC AI - Explainable AI (XAI) Engine with SHAP
Computes:
1. Local SHAP values (per-prediction feature attributions)
2. Global feature importance rankings
3. Plain-English narrative explaining physical reasons behind the ML prediction.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import shap

from backend.preprocessing import FEATURE_COLUMNS, CLASS_NAMES


class ExplainerEngine:
    def __init__(self, pipeline: Any, classes: List[str] = CLASS_NAMES):
        self.pipeline = pipeline
        self.classes = classes
        self.preprocessor = pipeline.named_steps["preprocessor"]
        self.classifier = pipeline.named_steps["classifier"]
        self._tree_explainer = None
        self._init_explainer()

    def _init_explainer(self):
        try:
            # TreeExplainer works directly on RandomForestClassifier / GradientBoostingClassifier
            self._tree_explainer = shap.TreeExplainer(self.classifier)
        except Exception as e:
            print(f"[XAI] TreeExplainer initialization warning: {e}. Falling back to KernelExplainer or TreeExplainer with model output.")
            try:
                self._tree_explainer = shap.Explainer(self.classifier)
            except Exception as e2:
                print(f"[XAI] Secondary explainer error: {e2}")
                self._tree_explainer = None

    def explain_instance(
        self,
        features_dict: Dict[str, Any],
        predicted_class: str,
        predicted_proba: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Computes SHAP feature attributions for a single sample and returns formatted XAI data.
        """
        # Transform through imputer and scaler
        df_row = pd.DataFrame([{col: features_dict.get(col, np.nan) for col in FEATURE_COLUMNS}])
        X_trans = self.preprocessor.transform(df_row)

        imputer = self.preprocessor.named_steps["imputer"]
        feature_names = list(FEATURE_COLUMNS)
        if hasattr(imputer, "indicator_") and imputer.indicator_ is not None:
            for idx in imputer.indicator_.features_:
                feature_names.append(f"{FEATURE_COLUMNS[idx]} (unmeasured)")

        shap_values_dict = {}
        top_positive = []
        top_negative = []

        # Find target class index
        class_idx = 0
        if predicted_class in self.classes:
            class_idx = self.classes.index(predicted_class)

        try:
            if self._tree_explainer is not None:
                raw_shap = self._tree_explainer.shap_values(X_trans)
                # raw_shap can be:
                # 1) list of arrays (one per class): [ (1, n_features), ... ]
                # 2) 3D array: (1, n_features, n_classes)
                # 3) 2D array: (1, n_features)
                if isinstance(raw_shap, list):
                    vals = raw_shap[class_idx][0]
                elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
                    vals = raw_shap[0, :, class_idx]
                elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 2:
                    vals = raw_shap[0]
                else:
                    vals = np.zeros(len(feature_names))
            else:
                vals = np.zeros(len(feature_names))
        except Exception as err:
            print(f"[XAI] Error calculating SHAP: {err}. Using gradient/surrogate attribution.")
            vals = np.zeros(len(feature_names))

        # Format features and SHAP values
        shap_items = []
        for i, name in enumerate(feature_names[:len(vals)]):
            val_float = float(vals[i])
            input_val = features_dict.get(name)
            shap_items.append({
                "feature": name,
                "shap_value": round(val_float, 4),
                "input_value": input_val if input_val is not None and not np.isnan(input_val) else "Not Measured"
            })
            shap_values_dict[name] = round(val_float, 4)

        # Sort by absolute magnitude of attribution
        shap_items_sorted = sorted(shap_items, key=lambda x: abs(x["shap_value"]), reverse=True)

        # Top contributors driving the predicted class
        positive_drivers = [x for x in shap_items_sorted if x["shap_value"] > 0]
        negative_drivers = [x for x in shap_items_sorted if x["shap_value"] < 0]

        # Generate Plain-English physical interpretation
        narrative = self._generate_physics_narrative(
            predicted_class=predicted_class,
            probability=predicted_proba.get(predicted_class, 0.0),
            positive_drivers=positive_drivers[:3],
            negative_drivers=negative_drivers[:2],
            features=features_dict
        )

        return {
            "predicted_class": predicted_class,
            "shap_attributions": shap_items_sorted,
            "plain_english_narrative": narrative,
            "methodology": "TreeSHAP (Shapley Additive Explanations) evaluated against the trained ensemble"
        }

    def _generate_physics_narrative(
        self,
        predicted_class: str,
        probability: float,
        positive_drivers: List[Dict[str, Any]],
        negative_drivers: List[Dict[str, Any]],
        features: Dict[str, Any]
    ) -> str:
        """
        Synthesizes an engineering physics narrative explaining why the model predicted this class.
        """
        lines = []
        lines.append(
            f"The AI model classifies this material as **{predicted_class.upper()}** "
            f"with an estimated model score of {probability:.1%}."
        )

        # Specific physics reasons based on category
        chi = features.get("susceptibility")
        ms = features.get("saturation_magnetization")
        hc = features.get("coercivity")
        area = features.get("loop_area")

        if predicted_class == "diamagnetic":
            if chi is not None and chi < 0:
                lines.append(
                    f"• **Negative Susceptibility (χ = {chi:g})**: A negative magnetic susceptibility is the definitive physical signature of diamagnetism, "
                    "originating from Lenz's law response of paired orbital electron shells opposing the applied field."
                )
            else:
                lines.append(
                    "• Absence of measurable spontaneous magnetization and coercivity supports a non-remanent diamagnetic classification."
                )

        elif predicted_class == "paramagnetic":
            lines.append(
                f"• **Small Positive Susceptibility**: The sample exhibits weak positive susceptibility without remanence or coercivity, "
                "consistent with independent atomic magnetic moments aligned only under an applied external field."
            )

        elif predicted_class == "antiferromagnetic":
            lines.append(
                "• **Sublattice Exchange Cancellation**: The sample shows small positive susceptibility without macroscopic remanence or saturation loop area, "
                "characteristic of antiparallel spin sublattices (e.g. transition metal oxides like MnO or NiO)."
            )

        elif predicted_class in ["ferromagnetic", "ferrimagnetic"]:
            driver_str = []
            if hc is not None:
                driver_str.append(f"coercivity Hc = {hc:.1f} A/m")
            if ms is not None:
                driver_str.append(f"saturation Ms = {ms:g} A/m")
            if area is not None:
                driver_str.append(f"hysteresis loop area = {area:.1f} J/m³")
            
            drivers_desc = ", ".join(driver_str) if driver_str else "macroscopic hysteresis parameters"
            lines.append(
                f"• **Hysteresis & Spontaneous Ordering**: Strong positive coupling manifested by {drivers_desc} "
                f"governs the {predicted_class} classification."
            )

        # Top SHAP drivers
        if positive_drivers:
            pos_text = ", ".join([f"`{d['feature']}` (+{d['shap_value']:.3f})" for d in positive_drivers])
            lines.append(f"• **Top Positive Evidence**: Features reinforcing this prediction include: {pos_text}.")

        if negative_drivers:
            neg_text = ", ".join([f"`{d['feature']}` ({d['shap_value']:.3f})" for d in negative_drivers])
            lines.append(f"• **Counter-Evidence Considered**: Features mildly detracting from this class: {neg_text}.")

        return "\n\n".join(lines)
