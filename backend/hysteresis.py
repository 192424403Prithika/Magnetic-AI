"""
MAGNETIC AI - Hysteresis Modeling
Provides two hysteresis simulation models:
1. Phenomenological Model (Extended Tanh with saturation, coercivity, and squareness)
2. Jiles–Atherton Physical Model (solved via scipy.integrate)

All calculations in SI units (H in A/m, M in A/m, B in Tesla).
"""

import math
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
from scipy.integrate import solve_ivp
from scipy.interpolate import interp1d

from backend.physics_engine import (
    MU_0,
    compute_b_from_h_and_m,
    calculate_hysteresis_loop_area,
    extract_loop_parameters
)


def simulate_phenomenological_loop(
    ms: float = 1.2e6,       # Saturation magnetization Ms (A/m)
    hc: float = 2.5e3,       # Coercivity Hc (A/m)
    squareness: float = 0.8, # Remanence ratio S = Mr / Ms (0.01 to 0.99)
    h_max: float = 1e4,      # Peak applied field (A/m)
    num_points: int = 250
) -> Dict[str, Any]:
    """
    Phenomenological tanh-based hysteresis loop model.
    Ascending branch (from -Hmax to +Hmax):
        M_asc(H) = Ms * tanh((H - Hc_eff) / a)
    Descending branch (from +Hmax to -Hmax):
        M_desc(H) = Ms * tanh((H + Hc_eff) / a)
    
    The scaling parameter 'a' is calibrated so that at H=0, M = Mr = squareness * Ms.
    Since tanh(Hc_eff / a) = squareness, a = Hc_eff / artanh(squareness).
    For physical consistency, Hc_eff = Hc.
    """
    # Sanitize inputs
    ms = max(1e-3, float(ms))
    hc = max(1e-3, float(hc))
    squareness = min(0.99, max(0.01, float(squareness)))
    h_max = max(hc * 1.2, float(h_max))

    # Determine scaling parameter 'a'
    artanh_s = math.atanh(squareness)
    a = hc / max(1e-4, artanh_s)

    # Ascending field sweep: -Hmax to +Hmax
    h_asc = np.linspace(-h_max, h_max, num_points)
    m_asc = ms * np.tanh((h_asc - hc) / a)

    # Descending field sweep: +Hmax to -Hmax
    h_desc = np.linspace(h_max, -h_max, num_points)
    m_desc = ms * np.tanh((h_desc + hc) / a)

    # Initial virgin magnetization curve: from H=0, M=0 to H=+Hmax
    h_virgin = np.linspace(0, h_max, num_points // 2)
    m_virgin = ms * np.tanh(h_virgin / (a * 1.5))

    # Combine into full closed loop: Ascending then Descending
    h_loop = np.concatenate([h_asc, h_desc])
    m_loop = np.concatenate([m_asc, m_desc])
    b_loop = compute_b_from_h_and_m(h_loop, m_loop)

    b_asc = compute_b_from_h_and_m(h_asc, m_asc)
    b_desc = compute_b_from_h_and_m(h_desc, m_desc)
    b_virgin = compute_b_from_h_and_m(h_virgin, m_virgin)

    # Calculate exact loop parameters
    params = extract_loop_parameters(h_loop, b_loop, m_loop)

    assumptions = [
        "Phenomenological formulation using hyperbolic tangent functions for ascending and descending branches.",
        "Symmetric minor and major loops without asymmetric pinning or exchange bias.",
        "Static field response (quasi-static, zero frequency eddy current or dynamic damping effects).",
        "Assumes isotropic sample with uniform uniaxial magnetization alignment."
    ]

    return {
        "model_type": "phenomenological",
        "model_name": "Empirical Tanh Hysteresis Model",
        "h_loop": h_loop.tolist(),
        "m_loop": m_loop.tolist(),
        "b_loop": b_loop.tolist(),
        "h_asc": h_asc.tolist(),
        "m_asc": m_asc.tolist(),
        "b_asc": b_asc.tolist(),
        "h_desc": h_desc.tolist(),
        "m_desc": m_desc.tolist(),
        "b_desc": b_desc.tolist(),
        "h_virgin": h_virgin.tolist(),
        "m_virgin": m_virgin.tolist(),
        "b_virgin": b_virgin.tolist(),
        "parameters": params,
        "assumptions": assumptions
    }


def simulate_jiles_atherton_loop(
    ms: float = 1.6e6,       # Saturation magnetization Ms (A/m)
    a: float = 1.1e3,        # Domain density parameter 'a' (A/m)
    k: float = 1.6e3,        # Domain pinning energy 'k' (A/m)
    c: float = 0.2,          # Domain wall flexing / reversibility coefficient 'c' (0 to 1)
    alpha: float = 1.6e-3,   # Inter-domain coupling parameter 'alpha' (dimensionless)
    h_max: float = 8.0e3,    # Peak excitation field (A/m)
    num_points: int = 250
) -> Dict[str, Any]:
    """
    Physical Jiles–Atherton (J-A) Hysteresis Model.
    
    Equations:
    Effective magnetic field:
        He = H + alpha * M
    
    Anhysteretic magnetization (modified Langevin):
        Man = Ms * [coth(He / a) - a / He]
        (with Taylor series expansion around He=0 to avoid division by zero: Man ≈ Ms * He / (3a))
    
    Irreversible magnetization dMirr / dH:
        dMirr / dH = (Man - Mirr) / (delta * k - alpha * (Man - Mirr))
        where delta = sign(dH/dt) (+1 for ascending, -1 for descending).
        To ensure physical energy conservation, dMirr/dH >= 0 when (Man - Mirr) * delta > 0, else 0.
    
    Total magnetization:
        M = c * Man + (1 - c) * Mirr
        dM / dH = (1 - c) * dMirr / dH + c * dMan / dH
    """
    ms = max(1e3, float(ms))
    a = max(10.0, float(a))
    k = max(10.0, float(k))
    c = min(0.99, max(0.01, float(c)))
    alpha = max(1e-7, float(alpha))
    h_max = max(k * 1.2, float(h_max))

    def modified_langevin(he: float) -> float:
        """Modified Langevin anhysteretic function: L(x) = coth(x) - 1/x."""
        x = he / a
        if abs(x) < 1e-4:
            return ms * (x / 3.0 - (x**3) / 45.0)
        # Avoid overflow in coth
        if x > 300.0:
            return ms * (1.0 - 1.0 / x)
        if x < -300.0:
            return ms * (-1.0 - 1.0 / x)
        return ms * (1.0 / np.tanh(x) - 1.0 / x)

    # 1. First sweep: virgin curve from 0 to +Hmax
    # We solve stepwise or piecewise with RK4/Euler
    h_virgin_steps = np.linspace(0, h_max, num_points // 2)
    m_virgin_list: List[float] = [0.0]
    mirr_curr = 0.0
    m_curr = 0.0

    # Virgin curve integration
    for i in range(1, len(h_virgin_steps)):
        h_prev = h_virgin_steps[i - 1]
        h_next = h_virgin_steps[i]
        dh = h_next - h_prev
        delta = 1.0  # ascending

        he = h_prev + alpha * m_curr
        man = modified_langevin(he)
        
        # dMirr/dH
        denom = delta * k - alpha * (man - mirr_curr)
        if abs(denom) < 1e-9:
            d_mirr = 0.0
        else:
            diff = man - mirr_curr
            # Physical condition: domain wall pinning energy loss
            if diff * delta > 0:
                d_mirr = (diff / denom) * dh
            else:
                d_mirr = 0.0

        mirr_curr = np.clip(mirr_curr + d_mirr, -ms, ms)
        m_curr = c * man + (1.0 - c) * mirr_curr
        m_curr = np.clip(m_curr, -ms, ms)
        m_virgin_list.append(m_curr)

    # Now simulate stable major loop: Descending (+Hmax to -Hmax), then Ascending (-Hmax to +Hmax)
    # Descending:
    h_desc_steps = np.linspace(h_max, -h_max, num_points)
    m_desc_list: List[float] = [m_curr]

    for i in range(1, len(h_desc_steps)):
        h_prev = h_desc_steps[i - 1]
        h_next = h_desc_steps[i]
        dh = h_next - h_prev
        delta = -1.0  # descending

        he = h_prev + alpha * m_curr
        man = modified_langevin(he)
        denom = delta * k - alpha * (man - mirr_curr)
        if abs(denom) < 1e-9:
            d_mirr = 0.0
        else:
            diff = man - mirr_curr
            if diff * delta > 0:
                d_mirr = (diff / denom) * dh
            else:
                d_mirr = 0.0

        mirr_curr = np.clip(mirr_curr + d_mirr, -ms, ms)
        m_curr = c * man + (1.0 - c) * mirr_curr
        m_curr = np.clip(m_curr, -ms, ms)
        m_desc_list.append(m_curr)

    # Ascending (-Hmax to +Hmax):
    h_asc_steps = np.linspace(-h_max, h_max, num_points)
    m_asc_list: List[float] = [m_curr]

    for i in range(1, len(h_asc_steps)):
        h_prev = h_asc_steps[i - 1]
        h_next = h_asc_steps[i]
        dh = h_next - h_prev
        delta = 1.0  # ascending

        he = h_prev + alpha * m_curr
        man = modified_langevin(he)
        denom = delta * k - alpha * (man - mirr_curr)
        if abs(denom) < 1e-9:
            d_mirr = 0.0
        else:
            diff = man - mirr_curr
            if diff * delta > 0:
                d_mirr = (diff / denom) * dh
            else:
                d_mirr = 0.0

        mirr_curr = np.clip(mirr_curr + d_mirr, -ms, ms)
        m_curr = c * man + (1.0 - c) * mirr_curr
        m_curr = np.clip(m_curr, -ms, ms)
        m_asc_list.append(m_curr)

    # Construct complete closed loop: Ascending branch followed by Descending branch
    h_loop = np.concatenate([h_asc_steps, h_desc_steps])
    m_loop = np.concatenate([np.array(m_asc_list), np.array(m_desc_list)])
    b_loop = compute_b_from_h_and_m(h_loop, m_loop)

    h_asc = h_asc_steps
    m_asc = np.array(m_asc_list)
    b_asc = compute_b_from_h_and_m(h_asc, m_asc)

    h_desc = h_desc_steps
    m_desc = np.array(m_desc_list)
    b_desc = compute_b_from_h_and_m(h_desc, m_desc)

    h_virgin = h_virgin_steps
    m_virgin = np.array(m_virgin_list)
    b_virgin = compute_b_from_h_and_m(h_virgin, m_virgin)

    params = extract_loop_parameters(h_loop, b_loop, m_loop)

    assumptions = [
        "Jiles–Atherton physical differential model accounting for domain wall motion, pinning, and reversible bending.",
        "Anhysteretic state modeled via modified Langevin function L(He/a).",
        "Parameter 'a' characterizes domain thermal energy/effective domain density.",
        "Parameter 'k' characterizes average pinning site energy density (closely linked to coercivity Hc).",
        "Parameter 'c' measures reversible domain wall bowing (reversible component).",
        "Parameter 'alpha' represents Weiss mean field coupling between magnetic domains.",
        "Quasi-static formulation: rate-dependent eddy-current losses are modeled separately in the Frequency Module."
    ]

    return {
        "model_type": "jiles_atherton",
        "model_name": "Jiles–Atherton Physical Hysteresis Model",
        "h_loop": h_loop.tolist(),
        "m_loop": m_loop.tolist(),
        "b_loop": b_loop.tolist(),
        "h_asc": h_asc.tolist(),
        "m_asc": m_asc.tolist(),
        "b_asc": b_asc.tolist(),
        "h_desc": h_desc.tolist(),
        "m_desc": m_desc.tolist(),
        "b_desc": b_desc.tolist(),
        "h_virgin": h_virgin.tolist(),
        "m_virgin": m_virgin.tolist(),
        "b_virgin": b_virgin.tolist(),
        "parameters": params,
        "assumptions": assumptions
    }
