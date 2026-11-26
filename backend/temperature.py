"""
MAGNETIC AI - Temperature-Dependent Magnetism Module
Implements:
1. Curie–Weiss Law for Paramagnets: χ(T) = C / (T - θ)
2. Ferromagnetic / Ferrimagnetic Saturation: Ms(T) = Ms0 * (1 - T / Tc)^β (default β ≈ 0.35)
3. Antiferromagnetic Néel Peak: Peak in χ at TN, decreasing for T < TN and following Curie-Weiss for T > TN
4. Diamagnetic Temperature Independence: χ(T) ≈ constant (Langevin diamagnetism)
5. Reference Table with standard literature transition temperatures (clearly marked as reference values).
"""

import math
from typing import Dict, Any, List, Optional
import numpy as np


# Standard Literature Reference Transition Temperatures
# ALL values marked with note: "approximate literature value – verify before citing"
REFERENCE_TRANSITION_TEMPERATURES = [
    {
        "material": "Iron (Fe)",
        "type": "ferromagnetic",
        "critical_temp_name": "Curie Temperature (Tc)",
        "critical_temp_k": 1043.0,
        "ms0_A_per_m": 1.74e6,
        "beta": 0.36,
        "source": "approximate literature value – verify before citing"
    },
    {
        "material": "Cobalt (Co)",
        "type": "ferromagnetic",
        "critical_temp_name": "Curie Temperature (Tc)",
        "critical_temp_k": 1388.0,
        "ms0_A_per_m": 1.44e6,
        "beta": 0.35,
        "source": "approximate literature value – verify before citing"
    },
    {
        "material": "Nickel (Ni)",
        "type": "ferromagnetic",
        "critical_temp_name": "Curie Temperature (Tc)",
        "critical_temp_k": 627.0,
        "ms0_A_per_m": 5.1e5,
        "beta": 0.34,
        "source": "approximate literature value – verify before citing"
    },
    {
        "material": "Magnetite (Fe3O4)",
        "type": "ferrimagnetic",
        "critical_temp_name": "Curie Temperature (Tc)",
        "critical_temp_k": 858.0,
        "ms0_A_per_m": 4.8e5,
        "beta": 0.35,
        "source": "approximate literature value – verify before citing"
    },
    {
        "material": "Manganese Oxide (MnO)",
        "type": "antiferromagnetic",
        "critical_temp_name": "Néel Temperature (TN)",
        "critical_temp_k": 118.0,
        "chi_peak": 5.8e-3,
        "beta": None,
        "source": "approximate literature value – verify before citing"
    },
    {
        "material": "Nickel Oxide (NiO)",
        "type": "antiferromagnetic",
        "critical_temp_name": "Néel Temperature (TN)",
        "critical_temp_k": 523.0,
        "chi_peak": 2.2e-3,
        "beta": None,
        "source": "approximate literature value – verify before citing"
    },
    {
        "material": "Bismuth (Bi)",
        "type": "diamagnetic",
        "critical_temp_name": "Melting Point",
        "critical_temp_k": 544.5,
        "chi_const": -1.66e-4,
        "beta": None,
        "source": "approximate literature value – verify before citing"
    },
    {
        "material": "Aluminum (Al)",
        "type": "paramagnetic",
        "critical_temp_name": "Melting Point",
        "critical_temp_k": 933.5,
        "c_constant": 2.2e-3,
        "beta": None,
        "source": "approximate literature value – verify before citing"
    }
]


def calculate_temperature_curves(
    material_type: str,
    t_min: float = 10.0,
    t_max: float = 1200.0,
    num_points: int = 200,
    tc_or_tn: Optional[float] = None,
    ms0: Optional[float] = None,
    beta: float = 0.35,
    curie_constant: float = 0.1,
    weiss_constant_theta: float = 0.0,
    chi_base: float = 1e-4
) -> Dict[str, Any]:
    """
    Computes temperature response:
    - Ms(T): Saturation magnetization vs Temperature (for ferro/ferrimagnets)
    - χ(T): Susceptibility vs Temperature
    - 1 / χ(T): Reciprocal susceptibility vs Temperature
    - Phase identification: Ordered (Ferro/Ferri/AFM) vs Disordered (Paramagnetic)
    """
    mat_type = material_type.lower().strip()
    t_arr = np.linspace(t_min, t_max, num_points)

    ms_curve: List[Optional[float]] = []
    chi_curve: List[float] = []
    inv_chi_curve: List[float] = []
    phase_labels: List[str] = []

    critical_temp = tc_or_tn

    if mat_type in ["ferromagnetic", "ferrimagnetic"]:
        tc = critical_temp if (critical_temp and critical_temp > 0) else 1043.0
        ms_zero = ms0 if (ms0 and ms0 > 0) else 1.7e6
        theta = tc  # For ferromagnetic Curie-Weiss law above Tc

        for t in t_arr:
            if t < tc:
                # Below Tc: Spontaneous magnetization dominates
                # Ms(T) = Ms0 * (1 - T / Tc)^beta
                reduced_t = 1.0 - (t / tc)
                val_ms = ms_zero * (reduced_t ** beta)
                ms_curve.append(float(val_ms))
                # Very high effective susceptibility in ferro region
                # Modeled as proportional to Ms(T)
                eff_chi = max(100.0, (val_ms / ms_zero) * 5000.0)
                chi_curve.append(float(eff_chi))
                inv_chi_curve.append(float(1.0 / eff_chi))
                phase_labels.append("Ferromagnetic / Ordered Phase")
            else:
                # Above Tc: Paramagnetic behavior governed by Curie-Weiss: χ = C / (T - Tc)
                ms_curve.append(0.0)
                dt = max(0.5, t - tc)
                chi = curie_constant / dt
                chi_curve.append(float(chi))
                inv_chi_curve.append(float(dt / curie_constant))
                phase_labels.append("Paramagnetic (Disordered Phase, T > Tc)")

        critical_info = {
            "critical_temp_name": "Curie Temperature (Tc)",
            "critical_temp_value": tc,
            "unit": "K",
            "equation_below": f"Ms(T) = Ms0 · (1 - T / {tc:.1f})^{beta:.2f}",
            "equation_above": f"χ(T) = C / (T - {tc:.1f}) [Curie-Weiss Law]"
        }

    elif mat_type == "antiferromagnetic":
        tn = critical_temp if (critical_temp and critical_temp > 0) else 300.0
        peak_chi = chi_base if chi_base > 0 else 5e-3

        for t in t_arr:
            ms_curve.append(0.0)  # Net spontaneous magnetization is zero due to sub-lattice antiparallel cancellation
            if t <= tn:
                # Below Néel temperature: Sublattices freeze antiparallel, susceptibility drops as T -> 0
                # χ(T) ≈ χ_peak * (0.3 + 0.7 * (T / TN))
                chi = peak_chi * (0.25 + 0.75 * (t / tn))
                chi_curve.append(float(chi))
                inv_chi_curve.append(float(1.0 / max(1e-9, chi)))
                phase_labels.append("Antiferromagnetic Phase (T < TN, Sublattice Ordering)")
            else:
                # Above TN: Paramagnetic phase with negative Weiss constant θ ≈ -TN
                # χ(T) = C / (T + |theta|)
                dt = (t - tn) + 20.0
                chi = peak_chi * (20.0 / dt)
                chi_curve.append(float(chi))
                inv_chi_curve.append(float(1.0 / max(1e-9, chi)))
                phase_labels.append("Paramagnetic Phase (T > TN, Disordered)")

        critical_info = {
            "critical_temp_name": "Néel Temperature (TN)",
            "critical_temp_value": tn,
            "unit": "K",
            "equation_below": "χ decreases towards 0 as T → 0 due to rigid sublattice pinning",
            "equation_above": "χ(T) = C / (T + θ) [Curie–Weiss with negative θ]"
        }

    elif mat_type == "paramagnetic":
        theta = weiss_constant_theta
        for t in t_arr:
            ms_curve.append(0.0)
            # χ(T) = C / (T - θ)
            dt = max(1.0, t - theta)
            chi = max(1e-9, curie_constant / dt)
            chi_curve.append(float(chi))
            inv_chi_curve.append(float(1.0 / chi))
            phase_labels.append("Paramagnetic Phase")

        critical_info = {
            "critical_temp_name": "Characteristic Weiss Constant (θ)",
            "critical_temp_value": theta,
            "unit": "K",
            "equation_below": "χ(T) = C / (T - θ)",
            "equation_above": "1/χ(T) = (T - θ) / C (Linear Curie-Weiss Plot)"
        }

    elif mat_type == "diamagnetic":
        # Langevin Diamagnetism: Temperature-independent negative susceptibility
        # χ = - (N * μ0 * e^2 / (6 * m_e)) * sum(<r_i^2>) ≈ constant
        const_chi = chi_base if chi_base < 0 else -1.6e-5
        for t in t_arr:
            ms_curve.append(0.0)
            chi_curve.append(float(const_chi))
            inv_chi_curve.append(float(1.0 / abs(const_chi)))
            phase_labels.append("Diamagnetic (Temperature-Independent Orbital Response)")

        critical_info = {
            "critical_temp_name": "No Critical Temperature (Langevin Diamagnetism)",
            "critical_temp_value": 0.0,
            "unit": "K",
            "equation_below": "χ(T) = constant < 0 (Orbital electron Lenz-law response)",
            "equation_above": "Independent of temperature until melting/phase transformation"
        }

    else:
        # Generic fallback
        for t in t_arr:
            ms_curve.append(0.0)
            chi_curve.append(1e-5)
            inv_chi_curve.append(1e5)
            phase_labels.append("Unknown Material Type")
        critical_info = {
            "critical_temp_name": "N/A",
            "critical_temp_value": 0.0,
            "unit": "K",
            "equation_below": "N/A",
            "equation_above": "N/A"
        }

    return {
        "material_type": mat_type,
        "temperature_k": t_arr.tolist(),
        "saturation_ms": ms_curve,
        "susceptibility_chi": chi_curve,
        "inv_susceptibility": inv_chi_curve,
        "phase_labels": phase_labels,
        "critical_info": critical_info,
        "reference_table": REFERENCE_TRANSITION_TEMPERATURES
    }
