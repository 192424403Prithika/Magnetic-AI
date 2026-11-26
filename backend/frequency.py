"""
MAGNETIC AI - Frequency-Dependent Core Loss Analysis
Implements the Bertotti / Steinmetz theoretical loss separation model:
    P_total = P_hysteresis + P_classical_eddy + P_excess
    P_hysteresis = Ph * f = W_h * f          (Linear in frequency)
    P_eddy       = Pe * f^2                  (Quadratic in frequency)
    P_excess     = Pexc * f^1.5              (Anomalous dynamic loss)

Units:
- Specific volumetric loss P: W/m³
- Specific mass loss P_mass: W/kg (dividing by density ρ in kg/m³)
- Energy loss per cycle W: J/m³ (W = P / f = W_h + Pe * f + Pexc * f^0.5)

LABEL: Clearly labelled as 'theoretical model, not measured data'.
"""

from typing import Dict, Any, List, Optional
import numpy as np


def compute_frequency_losses(
    wh_cycle: float = 120.0,       # Hysteresis loss per cycle W_h in J/m³ (area of quasi-static B-H loop)
    ke_eddy: float = 0.005,        # Classical eddy current loss coefficient Pe in J·s/m³ (W·s²/m³)
    k_exc: float = 0.05,           # Excess / anomalous loss coefficient Pexc in J·s^0.5/m³
    f_min: float = 10.0,           # Min frequency in Hz (e.g. 10 Hz)
    f_max: float = 10000.0,        # Max frequency in Hz (e.g. 10 kHz)
    num_points: int = 150,
    density_kg_per_m3: float = 7850.0  # Mass density ρ in kg/m³ (e.g. electrical steel ~7650-7850 kg/m³)
) -> Dict[str, Any]:
    """
    Computes volumetric power losses (W/m³) and mass power losses (W/kg) vs frequency f (Hz).
    """
    wh_cycle = max(0.0, float(wh_cycle))
    ke_eddy = max(0.0, float(ke_eddy))
    k_exc = max(0.0, float(k_exc))
    f_min = max(1.0, float(f_min))
    f_max = max(f_min * 2.0, float(f_max))
    density = max(100.0, float(density_kg_per_m3))

    freqs = np.linspace(f_min, f_max, num_points)

    # Power loss components (W/m³)
    p_h = wh_cycle * freqs
    p_e = ke_eddy * (freqs ** 2)
    p_exc = k_exc * (freqs ** 1.5)
    p_tot = p_h + p_e + p_exc

    # Energy loss per cycle (J/m³)
    w_tot = p_tot / freqs

    # Mass specific power loss (W/kg)
    p_tot_mass = p_tot / density
    p_h_mass = p_h / density
    p_e_mass = p_e / density
    p_exc_mass = p_exc / density

    return {
        "disclaimer": "THEORETICAL MODEL, NOT MEASURED DATA. Core losses are calculated using Bertotti statistical loss separation theory with user-specified or extracted coefficients.",
        "model_equation": "P_tot(f) = W_h · f + k_e · f² + k_exc · f^1.5",
        "parameters": {
            "wh_cycle_J_per_m3": wh_cycle,
            "ke_eddy": ke_eddy,
            "k_exc": k_exc,
            "density_kg_per_m3": density
        },
        "frequency_hz": freqs.tolist(),
        "power_loss_hysteresis_W_per_m3": p_h.tolist(),
        "power_loss_eddy_W_per_m3": p_e.tolist(),
        "power_loss_excess_W_per_m3": p_exc.tolist(),
        "power_loss_total_W_per_m3": p_tot.tolist(),
        "energy_loss_per_cycle_J_per_m3": w_tot.tolist(),
        "power_loss_total_W_per_kg": p_tot_mass.tolist(),
        "power_loss_hysteresis_W_per_kg": p_h_mass.tolist(),
        "power_loss_eddy_W_per_kg": p_e_mass.tolist()
    }
