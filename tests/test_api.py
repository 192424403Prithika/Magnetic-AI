"""
API Smoke and Integration Tests for FastAPI backend endpoints.
Directly invokes FastAPI route functions with Pydantic request models.
"""

import os
import pytest
from backend.app import (
    read_root,
    get_preset_materials,
    classify_material_endpoint,
    simulate_hysteresis_endpoint,
    compute_properties_endpoint,
    calculate_temperature_endpoint,
    calculate_frequency_endpoint,
    compare_materials_endpoint,
    get_learning_centre_data,
    generate_report_endpoint,
    ClassificationRequest,
    HysteresisSimulationRequest,
    PropertiesCalculationRequest,
    TemperatureRequest,
    FrequencyRequest,
    MaterialComparisonRequest,
    ReportGenerationRequest
)


def test_root_endpoint():
    res = read_root()
    assert res["status"] == "online"
    assert res["app"] == "MAGNETIC AI - Intelligent Magnetic Material Analysis Platform"


def test_materials_presets():
    res = get_preset_materials()
    assert "presets" in res
    assert len(res["presets"]) >= 5


def test_classify_endpoint():
    req = ClassificationRequest(
        material_name="Test Soft Iron",
        susceptibility=5000.0,
        temperature=300.0,
        saturation_magnetization=1.7e6,
        remanent_magnetization=1.15e6,
        coercivity=40.0,
        initial_permeability=1.256e-3,
        loop_area=180.0
    )
    res = classify_material_endpoint(req)
    assert "predicted_category" in res
    assert "probabilities" in res
    assert "hard_soft_classification" in res
    assert "xai" in res
    assert "applications" in res
    assert res["hard_soft_classification"]["class_code"] == "soft"


def test_hysteresis_phenomenological():
    req = HysteresisSimulationRequest(
        model_type="phenomenological",
        ms=1.2e6,
        hc=2000.0,
        squareness=0.8,
        h_max=8000.0,
        num_points=100
    )
    res = simulate_hysteresis_endpoint(req)
    assert "h_loop" in res
    assert "b_loop" in res
    assert "parameters" in res
    assert res["parameters"]["loop_area"] > 0


def test_hysteresis_jiles_atherton():
    req = HysteresisSimulationRequest(
        model_type="jiles_atherton",
        ms=1.5e6,
        hc=2000.0,
        squareness=0.75,
        h_max=8000.0,
        a=1100.0,
        k=1600.0,
        c=0.2,
        alpha=1.6e-3,
        num_points=100
    )
    res = simulate_hysteresis_endpoint(req)
    assert "h_loop" in res
    assert "parameters" in res


def test_compute_properties():
    h = [-2000.0, -1000.0, 0.0, 1000.0, 2000.0, 1000.0, 0.0, -1000.0, -2000.0]
    b = [-1.5, -1.2, -0.8, 0.5, 1.5, 1.2, 0.8, -0.5, -1.5]
    req = PropertiesCalculationRequest(h=h, b=b)
    res = compute_properties_endpoint(req)
    assert "parameters" in res
    assert res["parameters"]["coercivity_hc"] > 0


def test_temperature_endpoint():
    req = TemperatureRequest(
        material_type="ferromagnetic",
        t_min=100.0,
        t_max=1200.0,
        tc_or_tn=1043.0,
        ms0=1.74e6,
        beta=0.36
    )
    res = calculate_temperature_endpoint(req)
    assert "temperature_k" in res
    assert "saturation_ms" in res
    assert "reference_table" in res


def test_frequency_endpoint():
    req = FrequencyRequest(
        wh_cycle=100.0,
        ke_eddy=0.004,
        k_exc=0.04,
        f_min=50.0,
        f_max=5000.0
    )
    res = calculate_frequency_endpoint(req)
    assert "power_loss_total_W_per_m3" in res


def test_compare_endpoint():
    req = MaterialComparisonRequest(
        materials=[
            {"name": "Soft Iron", "ms": 1.7e6, "hc": 40.0, "category": "ferromagnetic"},
            {"name": "NdFeB", "ms": 1.2e6, "hc": 800000.0, "category": "ferromagnetic"}
        ]
    )
    res = compare_materials_endpoint(req)
    assert res["count"] == 2


def test_quiz_endpoint():
    res = get_learning_centre_data()
    assert res["total_questions"] >= 20
    assert res["total_viva"] >= 5


def test_report_generation_endpoint():
    analysis_data = {
        "predicted_category": "ferromagnetic",
        "confidence_score": 0.98,
        "probabilities": {
            "diamagnetic": 0.0,
            "paramagnetic": 0.0,
            "ferromagnetic": 0.98,
            "antiferromagnetic": 0.01,
            "ferrimagnetic": 0.01
        },
        "hard_soft_classification": {
            "behavior_class": "Soft Magnetic Material",
            "class_code": "soft"
        },
        "properties": {
            "coercivity_hc": 40.0,
            "remanence_br": 1.15,
            "saturation_ms": 1.71e6,
            "loop_area": 180.0,
            "initial_permeability": 1.256e-3
        },
        "xai": {
            "plain_english_narrative": "Classification driven by high saturation magnetization."
        },
        "applications": {
            "transformer_core": {
                "title": "Transformer Core & AC Inductors",
                "score": 92,
                "rating": "High",
                "rationale": "High permeability and low coercivity minimize power loss."
            }
        }
    }
    req = ReportGenerationRequest(
        material_name="Pure Iron Specimen",
        analysis_data=analysis_data
    )
    res = generate_report_endpoint(req)
    assert res.status_code == 200
    assert os.path.exists(res.path)
    assert os.path.getsize(res.path) > 1000
