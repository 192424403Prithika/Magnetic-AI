"""
MAGNETIC AI - Physics Engine
Standard SI Units:
- Magnetic Field Intensity H: A/m
- Magnetization M: A/m
- Magnetic Flux Density B: Tesla (T)
- Magnetic Susceptibility χ: Dimensionless (SI, volume susceptibility)
- Permeability of Free Space μ0: 4π * 10^-7 H/m (T·m/A)
- Energy Loss Density W: J/m³ per cycle
- Power Loss Density P: W/m³
"""

import math
from typing import Dict, Any, Tuple, Optional, List
import numpy as np

# Exact physical constant (2019 SI redefinition: μ0 ≈ 4π * 10^-7 T*m/A)
MU_0: float = 4.0 * math.pi * 1e-7  # ~1.25663706212e-6 H/m


def compute_b_from_h_and_m(h: np.ndarray, m: np.ndarray) -> np.ndarray:
    """
    Computes magnetic flux density B = μ0 * (H + M) in Tesla (T).
    H in A/m, M in A/m.
    """
    return MU_0 * (h + m)


def compute_m_from_h_and_b(h: np.ndarray, b: np.ndarray) -> np.ndarray:
    """
    Computes magnetization M = (B / μ0) - H in A/m.
    H in A/m, B in Tesla.
    """
    return (b / MU_0) - h


def compute_susceptibility(m: float, h: float) -> float:
    """
    Computes volume magnetic susceptibility χ = M / H (dimensionless).
    Returns 0.0 if H is near 0.
    """
    if abs(h) < 1e-12:
        return 0.0
    return m / h


def compute_permeability(b: float, h: float) -> float:
    """
    Computes total magnetic permeability μ = B / H in H/m (T·m/A).
    """
    if abs(h) < 1e-12:
        return MU_0
    return b / h


def compute_relative_permeability(chi: float) -> float:
    """
    Computes relative permeability μr = 1 + χ (dimensionless).
    """
    return 1.0 + chi


def find_zero_crossings_linear(x: np.ndarray, y: np.ndarray) -> List[float]:
    """
    Finds roots where y(x) = 0 using robust linear interpolation between adjacent sign changes.
    Returns list of x values where y crosses 0.
    """
    roots: List[float] = []
    n = len(y)
    for i in range(n - 1):
        y1, y2 = y[i], y[i + 1]
        x1, x2 = x[i], x[i + 1]
        if y1 == 0.0:
            roots.append(float(x1))
        elif y1 * y2 < 0.0:
            # Linear interpolation: x = x1 - y1 * (x2 - x1) / (y2 - y1)
            x_zero = x1 - y1 * (x2 - x1) / (y2 - y1)
            roots.append(float(x_zero))
    return roots


def calculate_hysteresis_loop_area(h: np.ndarray, b: np.ndarray) -> float:
    """
    Calculates the closed hysteresis loop energy loss per cycle:
    W = ∮ H dB in J/m³
    Using numerical trapezoidal integration or Green's theorem / shoelace on closed polygon.
    For standard B-H curve where B is plotted on y-axis and H on x-axis:
    ∮ H dB = 0.5 * |∑ (H_i * B_{i+1} - H_{i+1} * B_i)|
    """
    if len(h) < 3 or len(b) < 3:
        return 0.0
    
    # Ensure closed loop by appending first point if not identical
    h_closed = np.array(h, dtype=float)
    b_closed = np.array(b, dtype=float)
    if not (np.isclose(h_closed[0], h_closed[-1]) and np.isclose(b_closed[0], b_closed[-1])):
        h_closed = np.append(h_closed, h_closed[0])
        b_closed = np.append(b_closed, b_closed[0])

    # Green's theorem / shoelace formula for closed loop area in H-B plane:
    # Area = 0.5 * |∮ (H dB - B dH)| = ∮ H dB for a closed counter-clockwise or clockwise curve
    area = 0.5 * np.abs(np.sum(h_closed[:-1] * b_closed[1:] - h_closed[1:] * b_closed[:-1]))
    return float(area)


def extract_loop_parameters(h: np.ndarray, b: np.ndarray, m: Optional[np.ndarray] = None) -> Dict[str, float]:
    """
    Extracts fundamental magnetic hysteresis parameters from closed H-B or H-M arrays:
    - Hc (coercivity): reverse field at B=0 (or M=0) in A/m
    - Br (remanence / remanent flux density): B at H=0 in Tesla
    - Mr (remanent magnetization): M at H=0 in A/m
    - Ms (saturation magnetization): peak M at max H in A/m
    - Bs (saturation flux density): peak B at max H in Tesla
    - Loop area W (J/m³)
    - Initial permeability μ_i (H/m)
    - Relative permeability μ_r,max
    """
    h_arr = np.asarray(h, dtype=float)
    b_arr = np.asarray(b, dtype=float)
    if m is None:
        m_arr = compute_m_from_h_and_b(h_arr, b_arr)
    else:
        m_arr = np.asarray(m, dtype=float)

    # 1. Coercivity Hc: roots of B(H) = 0
    h_zeros_b = find_zero_crossings_linear(h_arr, b_arr)
    if len(h_zeros_b) > 0:
        # Coercivity is positive scalar magnitude of zero crossings
        hc = float(np.mean([abs(z) for z in h_zeros_b]))
    else:
        hc = 0.0

    # 2. Remanence Br: roots of H(B) = 0, i.e., B value where H crosses 0
    b_at_h0 = find_zero_crossings_linear(b_arr, h_arr)
    if len(b_at_h0) > 0:
        br = float(np.mean([abs(z) for z in b_at_h0]))
    else:
        # Fallback: find point where H is closest to 0
        min_idx = np.argmin(np.abs(h_arr))
        br = float(abs(b_arr[min_idx]))

    # Remanent magnetization Mr
    m_at_h0 = find_zero_crossings_linear(m_arr, h_arr)
    if len(m_at_h0) > 0:
        mr = float(np.mean([abs(z) for z in m_at_h0]))
    else:
        min_idx = np.argmin(np.abs(h_arr))
        mr = float(abs(m_arr[min_idx]))

    # 3. Saturation Ms and Bs
    ms = float(np.max(np.abs(m_arr)))
    bs = float(np.max(np.abs(b_arr)))

    # 4. Loop Area W (J/m³)
    loop_area = calculate_hysteresis_loop_area(h_arr, b_arr)

    # 5. Initial and Maximum Permeability
    # Near H = 0 for virgin curve or lowest nonzero H
    non_zero_mask = np.abs(h_arr) > 1e-5
    if np.any(non_zero_mask):
        permeabilities = np.abs(b_arr[non_zero_mask] / h_arr[non_zero_mask])
        mu_max = float(np.max(permeabilities))
        # Initial permeability: lowest H above 0
        lowest_h_idx = np.argmin(np.abs(h_arr[non_zero_mask]))
        mu_i = float(permeabilities[lowest_h_idx])
    else:
        mu_max = MU_0
        mu_i = MU_0

    return {
        "coercivity_hc": hc,              # A/m
        "remanence_br": br,               # T
        "remanent_magnetization_mr": mr,  # A/m
        "saturation_ms": ms,              # A/m
        "saturation_bs": bs,              # T
        "loop_area": loop_area,           # J/m³
        "initial_permeability": mu_i,     # H/m
        "max_permeability": mu_max,       # H/m
        "relative_max_permeability": mu_max / MU_0
    }


def classify_hard_or_soft_magnetic(
    coercivity_hc: float,
    remanence_br: Optional[float] = None,
    loop_area: Optional[float] = None
) -> Dict[str, Any]:
    """
    Classifies ferromagnetic / ferrimagnetic material samples as Hard, Soft, or Semi-Hard (Intermediate).
    IMPORTANT: Hard vs Soft is a BEHAVIOR CLASS, NOT a fundamental ordering category.
    
    Standard Engineering Physics Thresholds (in SI A/m):
    - Soft Magnetic: Coercivity Hc < 1,000 A/m (~1.0 kA/m ≈ 12.5 Oe). High permeability, narrow loop, low hysteresis loss.
      Examples: Soft iron, Silicon steel, Permalloy, MnZn ferrite.
    - Intermediate / Semi-Hard: 1,000 A/m <= Hc <= 10,000 A/m (1 to 10 kA/m).
      Examples: Medium carbon steels, recording media alloys, Alnico 2/3.
    - Hard Magnetic: Coercivity Hc > 10,000 A/m (> 10 kA/m ≈ 125 Oe). Often > 100 kA/m for modern NdFeB/SmCo.
      High remanence, large loop area, resistant to demagnetization.
      Examples: Nd2Fe14B, SmCo, Hard Ferrite (BaFe12O19), Alnico 5.
    """
    if coercivity_hc < 1000.0:
        classification = "Soft Magnetic Material"
        category_code = "soft"
        description = (
            f"Coercivity Hc = {coercivity_hc:.1f} A/m (< 1.0 kA/m threshold). "
            "Exhibits narrow hysteresis loop, rapid domain wall motion, high permeability, and low hysteresis core losses. "
            "Ideal for AC electromagnetic applications, transformer cores, inductors, and magnetic shielding."
        )
    elif coercivity_hc <= 10000.0:
        classification = "Intermediate / Semi-Hard Material"
        category_code = "intermediate"
        description = (
            f"Coercivity Hc = {coercivity_hc:.1f} A/m (between 1.0 kA/m and 10.0 kA/m). "
            "Exhibits moderate resistance to demagnetization. "
            "Commonly used in magnetic recording, security tags, relays, and specialized hysteresis couplings."
        )
    else:
        classification = "Hard Magnetic Material (Permanent Magnet)"
        category_code = "hard"
        description = (
            f"Coercivity Hc = {coercivity_hc:.1f} A/m (> 10.0 kA/m threshold). "
            "High coercivity and broad hysteresis loop indicating strong pinning of domain walls and high magnetocrystalline anisotropy. "
            "Ideal for permanent magnets, DC brushless motors, speakers, MRI machines, and magnetic holding assemblies."
        )

    return {
        "behavior_class": classification,
        "class_code": category_code,
        "coercivity_value": coercivity_hc,
        "unit": "A/m",
        "description": description,
        "note": "Hard vs soft is a behavior class describing coercivity and domain-pinning kinetics, NOT a fifth fundamental magnetic ordering category."
    }
