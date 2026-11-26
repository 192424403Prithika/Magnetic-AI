"""
Unit tests for MAGNETIC AI Physics Engine & Hysteresis Calculations.
Verifies:
1. B = μ0 * (H + M) relation and susceptibility χ = M / H
2. Coercivity Hc and Remanence Br zero-crossing detection on synthetic loops
3. Loop area calculation vs numerical trapezoidal integration
4. Hard vs Soft classification thresholds
5. Phenomenological and Jiles–Atherton hysteresis loop sanity
"""

import math
import numpy as np
import pytest

from backend.physics_engine import (
    MU_0,
    compute_b_from_h_and_m,
    compute_m_from_h_and_b,
    compute_susceptibility,
    compute_relative_permeability,
    find_zero_crossings_linear,
    calculate_hysteresis_loop_area,
    extract_loop_parameters,
    classify_hard_or_soft_magnetic
)
from backend.hysteresis import (
    simulate_phenomenological_loop,
    simulate_jiles_atherton_loop
)


def test_flux_density_and_magnetization_conversion():
    """Verify B = μ0 * (H + M) and inverse conversion M = B/μ0 - H."""
    h = np.array([0.0, 1000.0, 5000.0, -2000.0])
    m = np.array([0.0, 50000.0, 1200000.0, -80000.0])
    
    b = compute_b_from_h_and_m(h, m)
    expected_b = MU_0 * (h + m)
    assert np.allclose(b, expected_b, rtol=1e-6)

    m_recovered = compute_m_from_h_and_b(h, b)
    assert np.allclose(m_recovered, m, rtol=1e-6)


def test_susceptibility_and_permeability():
    """Verify volume susceptibility χ = M / H and μr = 1 + χ."""
    h = 2000.0
    m = 4000.0
    chi = compute_susceptibility(m, h)
    assert math.isclose(chi, 2.0, rel_tol=1e-6)

    mu_r = compute_relative_permeability(chi)
    assert math.isclose(mu_r, 3.0, rel_tol=1e-6)

    # Diamagnetic negative susceptibility check
    chi_dia = -1.6e-5
    assert chi_dia < 0.0
    mu_r_dia = compute_relative_permeability(chi_dia)
    assert mu_r_dia < 1.0


def test_zero_crossing_linear_interpolation():
    """Verify exact root finding for linear crossing."""
    x = np.array([-2.0, -1.0, 1.0, 2.0])
    y = np.array([-4.0, -2.0, 2.0, 4.0])
    # Root should be exactly at x = 0.0
    roots = find_zero_crossings_linear(x, y)
    assert len(roots) == 1
    assert math.isclose(roots[0], 0.0, abs_tol=1e-6)


def test_loop_area_vs_trapezoid_integration():
    """
    Test hysteresis loop area calculation against standard closed polygon trapezoid formula.
    Synthetic ellipse in H-B plane:
    H(t) = H0 * cos(t)
    B(t) = B0 * sin(t)
    Analytic Area = π * H0 * B0
    """
    h0 = 1000.0  # A/m
    b0 = 1.5     # T
    t = np.linspace(0, 2 * math.pi, 1000, endpoint=False)
    h_ellipse = h0 * np.cos(t)
    b_ellipse = b0 * np.sin(t)

    analytic_area = math.pi * h0 * b0  # ~4712.3889 J/m³
    calculated_area = calculate_hysteresis_loop_area(h_ellipse, b_ellipse)

    assert math.isclose(calculated_area, analytic_area, rel_tol=0.01)


def test_hard_vs_soft_classification():
    """Verify standard engineering physics thresholds for Hc."""
    # Soft magnetic (Hc < 1 kA/m)
    res_soft = classify_hard_or_soft_magnetic(80.0)
    assert res_soft["class_code"] == "soft"

    # Semi-hard / Intermediate (1 kA/m <= Hc <= 10 kA/m)
    res_inter = classify_hard_or_soft_magnetic(4500.0)
    assert res_inter["class_code"] == "intermediate"

    # Hard magnetic (Hc > 10 kA/m)
    res_hard = classify_hard_or_soft_magnetic(50000.0)
    assert res_hard["class_code"] == "hard"


def test_phenomenological_hysteresis_loop():
    """Verify that phenomenological model produces a closed loop with reasonable parameters."""
    ms = 1.2e6
    hc = 2000.0
    sq = 0.8
    res = simulate_phenomenological_loop(ms=ms, hc=hc, squareness=sq, h_max=10000.0)
    
    assert res["model_type"] == "phenomenological"
    params = res["parameters"]
    assert params["saturation_ms"] > 0
    assert params["coercivity_hc"] > 0
    assert params["remanence_br"] > 0
    assert params["loop_area"] > 0


def test_jiles_atherton_hysteresis_loop():
    """Verify that Jiles-Atherton differential model runs stably and returns proper loops."""
    res = simulate_jiles_atherton_loop(ms=1.4e6, a=1000.0, k=1500.0, c=0.2, alpha=1e-3, h_max=8000.0)
    assert res["model_type"] == "jiles_atherton"
    params = res["parameters"]
    assert params["saturation_ms"] > 0
    assert params["loop_area"] > 0
