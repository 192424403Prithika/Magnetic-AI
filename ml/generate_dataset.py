"""
MAGNETIC AI - Dataset Generator
Generates a realistic, physically grounded dataset of magnetic materials across 5 classes:
- Diamagnetic
- Paramagnetic
- Ferromagnetic
- Antiferromagnetic
- Ferrimagnetic

Features (all SI numeric):
- susceptibility: Volume magnetic susceptibility χ (dimensionless)
- temperature: Temperature T (K)
- saturation_magnetization: Ms (A/m) [NaN for diamagnetic, paramagnetic, antiferromagnetic]
- remanent_magnetization: Mr (A/m) [NaN for diamagnetic, paramagnetic, antiferromagnetic]
- coercivity: Hc (A/m) [NaN for diamagnetic, paramagnetic, antiferromagnetic]
- initial_permeability: μ_i (H/m)
- loop_area: W (J/m³) [NaN for non-hysteretic classes]

Data Origin:
- 'reference': Well-known literature anchor samples (marked 'approximate literature value – verify before citing')
- 'simulated': Physically-motivated variations at different temperatures and microstructure states.
"""

import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import math
import numpy as np
import pandas as pd

from backend.physics_engine import MU_0

np.random.seed(42)

# Reference anchor materials with approximate literature values
REFERENCE_MATERIALS = [
    # 1. DIAMAGNETIC
    {
        "name": "Bismuth (Bi)",
        "type": "diamagnetic",
        "chi": -1.66e-4,
        "T": 300.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 - 1.66e-4),
        "loop_area": np.nan,
    },
    {
        "name": "Pyrolytic Graphite",
        "type": "diamagnetic",
        "chi": -4.0e-4,
        "T": 300.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 - 4.0e-4),
        "loop_area": np.nan,
    },
    {
        "name": "Copper (Cu)",
        "type": "diamagnetic",
        "chi": -9.6e-6,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 - 9.6e-6),
        "loop_area": np.nan,
    },
    {
        "name": "Silver (Ag)",
        "type": "diamagnetic",
        "chi": -2.4e-5,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 - 2.4e-5),
        "loop_area": np.nan,
    },
    {
        "name": "Gold (Au)",
        "type": "diamagnetic",
        "chi": -3.4e-5,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 - 3.4e-5),
        "loop_area": np.nan,
    },
    {
        "name": "Silicon (Si)",
        "type": "diamagnetic",
        "chi": -4.2e-6,
        "T": 300.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 - 4.2e-6),
        "loop_area": np.nan,
    },
    {
        "name": "Lead (Pb)",
        "type": "diamagnetic",
        "chi": -1.8e-5,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 - 1.8e-5),
        "loop_area": np.nan,
    },
    {
        "name": "Water (H2O)",
        "type": "diamagnetic",
        "chi": -9.05e-6,
        "T": 298.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 - 9.05e-6),
        "loop_area": np.nan,
    },

    # 2. PARAMAGNETIC
    {
        "name": "Aluminum (Al)",
        "type": "paramagnetic",
        "chi": 2.2e-5,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 2.2e-5),
        "loop_area": np.nan,
    },
    {
        "name": "Platinum (Pt)",
        "type": "paramagnetic",
        "chi": 2.6e-4,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 2.6e-4),
        "loop_area": np.nan,
    },
    {
        "name": "Magnesium (Mg)",
        "type": "paramagnetic",
        "chi": 1.2e-5,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 1.2e-5),
        "loop_area": np.nan,
    },
    {
        "name": "Titanium (Ti)",
        "type": "paramagnetic",
        "chi": 1.8e-4,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 1.8e-4),
        "loop_area": np.nan,
    },
    {
        "name": "Manganese Sulphate (MnSO4)",
        "type": "paramagnetic",
        "chi": 1.4e-3,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 1.4e-3),
        "loop_area": np.nan,
    },
    {
        "name": "Palladium (Pd)",
        "type": "paramagnetic",
        "chi": 8.0e-4,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 8.0e-4),
        "loop_area": np.nan,
    },
    {
        "name": "Sodium (Na)",
        "type": "paramagnetic",
        "chi": 8.5e-6,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 8.5e-6),
        "loop_area": np.nan,
    },

    # 3. FERROMAGNETIC
    {
        "name": "Pure Iron (Fe)",
        "type": "ferromagnetic",
        "chi": 5000.0,
        "T": 300.0,
        "Ms": 1.71e6,
        "Mr": 1.15e6,
        "Hc": 40.0,
        "mu_i": MU_0 * 250.0,
        "loop_area": 180.0,
    },
    {
        "name": "Silicon Steel (3% Si-Fe)",
        "type": "ferromagnetic",
        "chi": 15000.0,
        "T": 300.0,
        "Ms": 1.60e6,
        "Mr": 1.20e6,
        "Hc": 15.0,
        "mu_i": MU_0 * 1500.0,
        "loop_area": 60.0,
    },
    {
        "name": "Permalloy (Ni80Fe20)",
        "type": "ferromagnetic",
        "chi": 100000.0,
        "T": 300.0,
        "Ms": 8.6e5,
        "Mr": 4.5e5,
        "Hc": 2.0,
        "mu_i": MU_0 * 8000.0,
        "loop_area": 8.0,
    },
    {
        "name": "Supermalloy",
        "type": "ferromagnetic",
        "chi": 300000.0,
        "T": 300.0,
        "Ms": 6.3e5,
        "Mr": 3.2e5,
        "Hc": 0.5,
        "mu_i": MU_0 * 25000.0,
        "loop_area": 2.5,
    },
    {
        "name": "Cobalt (Co)",
        "type": "ferromagnetic",
        "chi": 250.0,
        "T": 300.0,
        "Ms": 1.43e6,
        "Mr": 8.0e5,
        "Hc": 800.0,
        "mu_i": MU_0 * 70.0,
        "loop_area": 3500.0,
    },
    {
        "name": "Nickel (Ni)",
        "type": "ferromagnetic",
        "chi": 600.0,
        "T": 300.0,
        "Ms": 4.85e5,
        "Mr": 2.6e5,
        "Hc": 60.0,
        "mu_i": MU_0 * 110.0,
        "loop_area": 120.0,
    },
    {
        "name": "Alnico 5",
        "type": "ferromagnetic",
        "chi": 4.0,
        "T": 300.0,
        "Ms": 1.05e6,
        "Mr": 9.5e5,
        "Hc": 52000.0,
        "mu_i": MU_0 * 5.0,
        "loop_area": 180000.0,
    },
    {
        "name": "Neodymium Magnet (Nd2Fe14B)",
        "type": "ferromagnetic",
        "chi": 1.15,
        "T": 300.0,
        "Ms": 1.28e6,
        "Mr": 1.20e6,
        "Hc": 875000.0,
        "mu_i": MU_0 * 1.05,
        "loop_area": 3800000.0,
    },
    {
        "name": "Samarium Cobalt (Sm2Co17)",
        "type": "ferromagnetic",
        "chi": 1.05,
        "T": 300.0,
        "Ms": 9.2e5,
        "Mr": 8.6e5,
        "Hc": 1600000.0,
        "mu_i": MU_0 * 1.03,
        "loop_area": 4500000.0,
    },

    # 4. ANTIFERROMAGNETIC
    {
        "name": "Manganese Oxide (MnO)",
        "type": "antiferromagnetic",
        "chi": 5.8e-3,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 5.8e-3),
        "loop_area": np.nan,
    },
    {
        "name": "Nickel Oxide (NiO)",
        "type": "antiferromagnetic",
        "chi": 2.2e-3,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 2.2e-3),
        "loop_area": np.nan,
    },
    {
        "name": "Chromium (Cr bulk)",
        "type": "antiferromagnetic",
        "chi": 3.1e-4,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 3.1e-4),
        "loop_area": np.nan,
    },
    {
        "name": "Iron(II) Oxide (FeO)",
        "type": "antiferromagnetic",
        "chi": 7.5e-3,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 7.5e-3),
        "loop_area": np.nan,
    },
    {
        "name": "Chromium(III) Oxide (Cr2O3)",
        "type": "antiferromagnetic",
        "chi": 2.6e-4,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 2.6e-4),
        "loop_area": np.nan,
    },
    {
        "name": "Hematite (alpha-Fe2O3)",
        "type": "antiferromagnetic",
        "chi": 1.5e-3,
        "T": 293.0,
        "Ms": np.nan,
        "Mr": np.nan,
        "Hc": np.nan,
        "mu_i": MU_0 * (1.0 + 1.5e-3),
        "loop_area": np.nan,
    },

    # 5. FERRIMAGNETIC
    {
        "name": "Magnetite (Fe3O4)",
        "type": "ferrimagnetic",
        "chi": 12.0,
        "T": 300.0,
        "Ms": 4.8e5,
        "Mr": 1.2e5,
        "Hc": 5600.0,
        "mu_i": MU_0 * 15.0,
        "loop_area": 4800.0,
    },
    {
        "name": "Manganese-Zinc Ferrite (MnZn)",
        "type": "ferrimagnetic",
        "chi": 2500.0,
        "T": 300.0,
        "Ms": 3.8e5,
        "Mr": 6.5e4,
        "Hc": 12.0,
        "mu_i": MU_0 * 2000.0,
        "loop_area": 45.0,
    },
    {
        "name": "Nickel-Zinc Ferrite (NiZn)",
        "type": "ferrimagnetic",
        "chi": 800.0,
        "T": 300.0,
        "Ms": 3.2e5,
        "Mr": 7.0e4,
        "Hc": 85.0,
        "mu_i": MU_0 * 650.0,
        "loop_area": 190.0,
    },
    {
        "name": "Yttrium Iron Garnet (YIG)",
        "type": "ferrimagnetic",
        "chi": 120.0,
        "T": 300.0,
        "Ms": 1.4e5,
        "Mr": 2.8e4,
        "Hc": 25.0,
        "mu_i": MU_0 * 100.0,
        "loop_area": 35.0,
    },
    {
        "name": "Cobalt Ferrite (CoFe2O4)",
        "type": "ferrimagnetic",
        "chi": 3.5,
        "T": 300.0,
        "Ms": 3.6e5,
        "Mr": 1.8e5,
        "Hc": 180000.0,
        "mu_i": MU_0 * 2.5,
        "loop_area": 320000.0,
    },
    {
        "name": "Barium Ferrite (BaFe12O19)",
        "type": "ferrimagnetic",
        "chi": 2.8,
        "T": 300.0,
        "Ms": 3.8e5,
        "Mr": 3.2e5,
        "Hc": 240000.0,
        "mu_i": MU_0 * 1.8,
        "loop_area": 420000.0,
    }
]


def generate_dataset(output_path: str = "ml/dataset.csv", target_count_per_class: int = 70) -> pd.DataFrame:
    """
    Builds the complete dataset starting with anchor references and augmenting with physically realistic simulated data.
    """
    rows = []

    # 1. Add reference anchors
    for ref in REFERENCE_MATERIALS:
        rows.append({
            "material_name": ref["name"],
            "susceptibility": float(ref["chi"]),
            "temperature": float(ref["T"]),
            "saturation_magnetization": float(ref["Ms"]) if not np.isnan(ref["Ms"]) else np.nan,
            "remanent_magnetization": float(ref["Mr"]) if not np.isnan(ref["Mr"]) else np.nan,
            "coercivity": float(ref["Hc"]) if not np.isnan(ref["Hc"]) else np.nan,
            "initial_permeability": float(ref["mu_i"]),
            "loop_area": float(ref["loop_area"]) if not np.isnan(ref["loop_area"]) else np.nan,
            "material_type": ref["type"],
            "source": "approximate literature value – verify before citing",
            "data_origin": "reference"
        })

    # Group anchors by class to simulate variations
    classes = ["diamagnetic", "paramagnetic", "ferromagnetic", "antiferromagnetic", "ferrimagnetic"]

    for cat in classes:
        cat_refs = [r for r in REFERENCE_MATERIALS if r["type"] == cat]
        current_count = len(cat_refs)
        needed = target_count_per_class - current_count

        for i in range(needed):
            base_ref = np.random.choice(cat_refs)
            # Sample temperature between 80 K and 800 K (or near 300 K)
            t_sample = float(np.clip(np.random.normal(300.0, 80.0), 50.0, 950.0))
            
            # Physics-based noise/scaling factor
            var = np.random.uniform(0.75, 1.30)
            sim_name = f"{base_ref['name']} (Simulated Var-{i+1})"

            if cat == "diamagnetic":
                # Temperature independent χ (slight experimental noise < 5%)
                chi_sim = float(base_ref["chi"] * np.random.uniform(0.92, 1.08))
                mu_i_sim = float(MU_0 * (1.0 + chi_sim))
                ms_sim = np.nan
                mr_sim = np.nan
                hc_sim = np.nan
                area_sim = np.nan

            elif cat == "paramagnetic":
                # Curie law: χ ~ 1 / T
                ref_t = base_ref["T"]
                # χ(T) = χ(T_ref) * (T_ref / T) * random_variation
                chi_sim = float(base_ref["chi"] * (ref_t / max(20.0, t_sample)) * var)
                mu_i_sim = float(MU_0 * (1.0 + chi_sim))
                ms_sim = np.nan
                mr_sim = np.nan
                hc_sim = np.nan
                area_sim = np.nan

            elif cat in ["ferromagnetic", "ferrimagnetic"]:
                # Temperature dependence with Curie point Tc
                # Assume a representative Tc between 600K and 1200K
                tc = 850.0 if cat == "ferrimagnetic" else 1040.0
                if t_sample >= tc:
                    # Paramagnetic phase above Tc
                    chi_sim = float(np.random.uniform(1e-4, 5e-3))
                    ms_sim = np.nan
                    mr_sim = np.nan
                    hc_sim = np.nan
                    area_sim = np.nan
                    mu_i_sim = float(MU_0 * (1.0 + chi_sim))
                else:
                    # Below Tc: Ms(T) = Ms0 * (1 - T/Tc)^0.35
                    factor = ((1.0 - t_sample / tc) / (1.0 - 300.0 / tc)) ** 0.35
                    factor = float(np.clip(factor, 0.2, 1.25))

                    ms_sim = float(base_ref["Ms"] * factor * var)
                    # Squareness ratio Mr / Ms with slight variance
                    sq = np.clip((base_ref["Mr"] / base_ref["Ms"]) * np.random.uniform(0.85, 1.15), 0.1, 0.95)
                    mr_sim = float(ms_sim * sq)

                    # Coercivity variation (grain size / pinning variation)
                    grain_factor = np.random.uniform(0.7, 1.4)
                    hc_sim = float(base_ref["Hc"] * grain_factor)

                    # Loop area scales roughly with 4 * Hc * Br
                    br_approx = MU_0 * (hc_sim + mr_sim)
                    approx_area = 4.0 * hc_sim * br_approx * np.random.uniform(0.65, 0.95)
                    area_sim = float(max(1.0, approx_area))

                    chi_sim = float(ms_sim / max(10.0, hc_sim * 2.0))
                    mu_i_sim = float(base_ref["mu_i"] * var)

            elif cat == "antiferromagnetic":
                # Néel peak around TN
                tn = 300.0
                if t_sample <= tn:
                    chi_sim = float(base_ref["chi"] * (0.3 + 0.7 * (t_sample / tn)) * var)
                else:
                    chi_sim = float(base_ref["chi"] * (tn / t_sample) * var)
                mu_i_sim = float(MU_0 * (1.0 + chi_sim))
                ms_sim = np.nan
                mr_sim = np.nan
                hc_sim = np.nan
                area_sim = np.nan

            rows.append({
                "material_name": sim_name,
                "susceptibility": chi_sim,
                "temperature": t_sample,
                "saturation_magnetization": ms_sim,
                "remanent_magnetization": mr_sim,
                "coercivity": hc_sim,
                "initial_permeability": mu_i_sim,
                "loop_area": area_sim,
                "material_type": cat,
                "source": "approximate literature value – verify before citing",
                "data_origin": "simulated"
            })

    df = pd.DataFrame(rows)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated dataset with {len(df)} samples saved to {output_path}")
    print("Class distribution:\n", df["material_type"].value_counts())
    return df


if __name__ == "__main__":
    generate_dataset()
