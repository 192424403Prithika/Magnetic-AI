"""
MAGNETIC AI - FastAPI Backend Server
Intelligent Magnetic Material Analysis Platform
Engineering Physics + Machine Learning Capstone API
"""

import os
import io
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from backend.physics_engine import (
    MU_0,
    compute_b_from_h_and_m,
    compute_m_from_h_and_b,
    calculate_hysteresis_loop_area,
    extract_loop_parameters,
    classify_hard_or_soft_magnetic
)
from backend.hysteresis import (
    simulate_phenomenological_loop,
    simulate_jiles_atherton_loop
)
from backend.temperature import calculate_temperature_curves, REFERENCE_TRANSITION_TEMPERATURES
from backend.frequency import compute_frequency_losses
from backend.recommendations import evaluate_application_suitability
from backend.classifier import classifier_service, PRESET_MATERIALS
from backend.database import save_analysis, get_analysis_history
from backend.report import build_pdf_report

app = FastAPI(
    title="MAGNETIC AI API",
    description="Intelligent Magnetic Material Analysis Platform - Engineering Physics & ML Capstone",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server and production clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Request Models ---

class ClassificationRequest(BaseModel):
    material_name: Optional[str] = "Unknown Sample"
    susceptibility: Optional[float] = Field(None, description="Volume magnetic susceptibility χ (SI)")
    temperature: Optional[float] = Field(300.0, ge=1.0, le=3000.0, description="Temperature in Kelvin (K)")
    saturation_magnetization: Optional[float] = Field(None, ge=0.0, description="Saturation Magnetization Ms in A/m")
    remanent_magnetization: Optional[float] = Field(None, ge=0.0, description="Remanent Magnetization Mr in A/m")
    coercivity: Optional[float] = Field(None, ge=0.0, description="Coercivity Hc in A/m")
    initial_permeability: Optional[float] = Field(None, ge=0.0, description="Initial Permeability μ_i in H/m")
    loop_area: Optional[float] = Field(None, ge=0.0, description="Hysteresis loop area W in J/m³")


class HysteresisSimulationRequest(BaseModel):
    model_type: str = Field("phenomenological", description="'phenomenological' or 'jiles_atherton'")
    ms: float = Field(1.2e6, gt=0, description="Saturation magnetization Ms in A/m")
    hc: float = Field(2.5e3, gt=0, description="Coercivity Hc in A/m")
    squareness: float = Field(0.75, ge=0.01, le=0.99, description="Mr / Ms ratio")
    h_max: float = Field(1.5e4, gt=0, description="Peak applied field Hmax in A/m")
    # Jiles-Atherton specific parameters
    a: Optional[float] = Field(1100.0, gt=0, description="J-A thermal/domain density parameter a in A/m")
    k: Optional[float] = Field(1600.0, gt=0, description="J-A pinning energy parameter k in A/m")
    c: Optional[float] = Field(0.2, ge=0.01, le=0.99, description="J-A reversibility parameter c")
    alpha: Optional[float] = Field(1.6e-3, gt=0, description="J-A mean-field parameter alpha")
    num_points: int = Field(200, ge=50, le=1000)


class PropertiesCalculationRequest(BaseModel):
    h: List[float] = Field(..., description="Array of magnetic field intensity H values (A/m)")
    b: Optional[List[float]] = Field(None, description="Array of magnetic flux density B values (Tesla)")
    m: Optional[List[float]] = Field(None, description="Array of magnetization M values (A/m)")


class TemperatureRequest(BaseModel):
    material_type: str = Field("ferromagnetic", description="diamagnetic, paramagnetic, ferromagnetic, antiferromagnetic, ferrimagnetic")
    t_min: float = Field(10.0, ge=1.0)
    t_max: float = Field(1200.0, ge=10.0)
    num_points: int = Field(200, ge=20, le=1000)
    tc_or_tn: Optional[float] = Field(None, gt=0, description="Curie (Tc) or Néel (TN) temperature in K")
    ms0: Optional[float] = Field(None, gt=0, description="Saturation Ms at 0 K in A/m")
    beta: float = Field(0.35, ge=0.1, le=0.6, description="Critical exponent beta")
    curie_constant: float = Field(0.1, gt=0)
    weiss_constant_theta: float = Field(0.0)
    chi_base: float = Field(1e-4)


class FrequencyRequest(BaseModel):
    wh_cycle: float = Field(120.0, ge=0.0, description="Hysteresis loss per cycle Wh in J/m³")
    ke_eddy: float = Field(0.005, ge=0.0, description="Eddy current coefficient Pe in W·s²/m³")
    k_exc: float = Field(0.05, ge=0.0, description="Excess loss coefficient Pexc in W·s^1.5/m³")
    f_min: float = Field(10.0, ge=1.0)
    f_max: float = Field(10000.0, ge=10.0)
    num_points: int = Field(150, ge=20, le=500)
    density_kg_per_m3: float = Field(7850.0, ge=100.0, description="Material mass density in kg/m³")


class MaterialComparisonRequest(BaseModel):
    materials: List[Dict[str, Any]] = Field(..., max_items=5, min_items=1)


class ReportGenerationRequest(BaseModel):
    material_name: str = "Magnetic Sample"
    analysis_data: Dict[str, Any]


# --- API Endpoints ---

@app.get("/")
def read_root():
    return {
        "app": "MAGNETIC AI - Intelligent Magnetic Material Analysis Platform",
        "status": "online",
        "documentation": "/docs",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/classify")
def classify_material_endpoint(payload: ClassificationRequest):
    """
    Classifies a sample into one of five categories using the trained ML pipeline.
    Also provides hard/soft classification, SHAP explanations, OOD warning, and industrial recommendations.
    """
    try:
        input_dict = {
            "susceptibility": payload.susceptibility,
            "temperature": payload.temperature,
            "saturation_magnetization": payload.saturation_magnetization,
            "remanent_magnetization": payload.remanent_magnetization,
            "coercivity": payload.coercivity,
            "initial_permeability": payload.initial_permeability,
            "loop_area": payload.loop_area
        }

        result = classifier_service.classify(input_dict)
        result["material_name"] = payload.material_name

        # Persist analysis to SQLite history
        record_id = save_analysis(
            material_name=payload.material_name or "Custom Sample",
            predicted_category=result["predicted_category"],
            confidence=result["confidence_score"],
            hard_soft_class=result["hard_soft_classification"].get("behavior_class"),
            input_features=input_dict,
            probabilities=result["probabilities"]
        )
        result["analysis_id"] = record_id

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")


@app.post("/api/hysteresis")
def simulate_hysteresis_endpoint(payload: HysteresisSimulationRequest):
    """
    Simulates magnetic induction (B-H) and magnetization (M-H) loops using either
    the Phenomenological (tanh) or Jiles–Atherton physical model.
    """
    try:
        if payload.model_type.lower() == "jiles_atherton":
            result = simulate_jiles_atherton_loop(
                ms=payload.ms,
                a=payload.a or 1100.0,
                k=payload.k or payload.hc,
                c=payload.c or 0.2,
                alpha=payload.alpha or 1.6e-3,
                h_max=payload.h_max,
                num_points=payload.num_points
            )
        else:
            result = simulate_phenomenological_loop(
                ms=payload.ms,
                hc=payload.hc,
                squareness=payload.squareness,
                h_max=payload.h_max,
                num_points=payload.num_points
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hysteresis simulation failed: {str(e)}")


@app.post("/api/properties")
def compute_properties_endpoint(payload: PropertiesCalculationRequest):
    """
    Calculates physical magnetic properties (Hc, Br, Ms, loop area, permeability, susceptibility)
    from supplied H and B/M numerical arrays or single point inputs.
    """
    try:
        h_arr = np.array(payload.h, dtype=float)
        if len(h_arr) == 0:
            raise HTTPException(status_code=400, detail="Array cannot be empty.")

        if payload.b is not None:
            b_arr = np.array(payload.b, dtype=float)
            m_arr = compute_m_from_h_and_b(h_arr, b_arr)
        elif payload.m is not None:
            m_arr = np.array(payload.m, dtype=float)
            b_arr = compute_b_from_h_and_m(h_arr, m_arr)
        else:
            raise HTTPException(status_code=400, detail="Either 'b' or 'm' array must be provided.")

        if len(h_arr) >= 4:
            params = extract_loop_parameters(h_arr, b_arr, m_arr)
            hard_soft = classify_hard_or_soft_magnetic(params["coercivity_hc"], params["remanence_br"], params["loop_area"])
        else:
            # Single or small point evaluation
            m_val = float(m_arr[0])
            h_val = float(h_arr[0])
            b_val = float(b_arr[0])
            chi_val = m_val / h_val if abs(h_val) > 1e-9 else 0.0
            mu_val = b_val / h_val if abs(h_val) > 1e-9 else MU_0
            params = {
                "coercivity_hc": 0.0,
                "remanence_br": abs(b_val),
                "remanent_magnetization_mr": abs(m_val),
                "saturation_ms": abs(m_val),
                "saturation_bs": abs(b_val),
                "loop_area": 0.0,
                "initial_permeability": mu_val,
                "max_permeability": mu_val,
                "relative_max_permeability": mu_val / MU_0,
                "susceptibility": chi_val,
                "relative_permeability": 1.0 + chi_val
            }
            hard_soft = {
                "behavior_class": "Point Evaluation (Single Field State)",
                "class_code": "point",
                "coercivity_value": 0.0,
                "unit": "A/m",
                "description": f"Computed point state: B = {b_val:.4f} T, M = {m_val:.2f} A/m, χ = {chi_val:.4e}.",
                "note": "Coercivity and loop area require a closed hysteresis loop with multiple excitation points."
            }

        return {
            "parameters": params,
            "hard_soft_classification": hard_soft,
            "num_points": len(h_arr),
            "h_range": [float(np.min(h_arr)), float(np.max(h_arr))],
            "b_range": [float(np.min(b_arr)), float(np.max(b_arr))]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Property extraction failed: {str(e)}")


@app.post("/api/upload")
async def upload_csv_data(file: UploadFile = File(...)):
    """
    Parses an uploaded CSV file containing experimental magnetometry data (H and B/M columns).
    Validates units, performs data cleaning, calculates hysteresis parameters, and attempts ML classification.
    """
    try:
        content = await file.read()
        try:
            df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        except Exception:
            df = pd.read_csv(io.BytesIO(content))

        cols_lower = {col.lower().strip(): col for col in df.columns}
        
        # Identify H column
        h_col = None
        for cand in ["h", "h_field", "field", "h (a/m)", "h(a/m)", "applied_field"]:
            if cand in cols_lower:
                h_col = cols_lower[cand]
                break

        # Identify B or M column
        b_col = None
        m_col = None
        for cand in ["b", "flux_density", "b_tesla", "b (t)", "b(t)"]:
            if cand in cols_lower:
                b_col = cols_lower[cand]
                break

        for cand in ["m", "magnetization", "m (a/m)", "m(a/m)"]:
            if cand in cols_lower:
                m_col = cols_lower[cand]
                break

        if not h_col or (not b_col and not m_col):
            # Fallback to column indices if 2 columns present
            if len(df.columns) >= 2:
                h_col = df.columns[0]
                b_col = df.columns[1]
            else:
                return JSONResponse(status_code=400, content={
                    "error": "CSV must have at least an applied field (H) and induction (B or M) column.",
                    "detected_columns": list(df.columns)
                })

        # Clean numerical data
        clean_df = df[[h_col, b_col if b_col else m_col]].dropna()
        h_vals = pd.to_numeric(clean_df[h_col], errors="coerce").dropna().values
        
        if b_col:
            b_vals = pd.to_numeric(clean_df[b_col], errors="coerce").dropna().values
            min_len = min(len(h_vals), len(b_vals))
            h_vals = h_vals[:min_len]
            b_vals = b_vals[:min_len]
            m_vals = compute_m_from_h_and_b(h_vals, b_vals)
        else:
            m_vals = pd.to_numeric(clean_df[m_col], errors="coerce").dropna().values
            min_len = min(len(h_vals), len(m_vals))
            h_vals = h_vals[:min_len]
            m_vals = m_vals[:min_len]
            b_vals = compute_b_from_h_and_m(h_vals, m_vals)

        # Extract parameters
        params = extract_loop_parameters(h_vals, b_vals, m_vals)
        hard_soft = classify_hard_or_soft_magnetic(params["coercivity_hc"], params["remanence_br"], params["loop_area"])

        # Attempt classification with extracted parameters
        classification = None
        try:
            susceptibility = params["remanent_magnetization_mr"] / max(1.0, params["coercivity_hc"])
            class_input = {
                "susceptibility": float(susceptibility),
                "temperature": 300.0,
                "saturation_magnetization": float(params["saturation_ms"]),
                "remanent_magnetization": float(params["remanent_magnetization_mr"]),
                "coercivity": float(params["coercivity_hc"]),
                "initial_permeability": float(params["initial_permeability"]),
                "loop_area": float(params["loop_area"])
            }
            classification = classifier_service.classify(class_input)
        except Exception as e:
            print(f"Auto-classification error on upload: {e}")

        # Subsample for lightweight UI rendering (up to 300 points)
        step = max(1, len(h_vals) // 300)
        h_sub = h_vals[::step].tolist()
        b_sub = b_vals[::step].tolist()
        m_sub = m_vals[::step].tolist()

        return {
            "filename": file.filename,
            "total_rows_parsed": len(h_vals),
            "h_column": h_col,
            "b_or_m_column": b_col if b_col else m_col,
            "parameters": params,
            "hard_soft_classification": hard_soft,
            "classification": classification,
            "plot_data": {
                "h": h_sub,
                "b": b_sub,
                "m": m_sub
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV processing failed: {str(e)}")


@app.post("/api/temperature")
def calculate_temperature_endpoint(payload: TemperatureRequest):
    """
    Computes temperature response curves: Ms(T), χ(T), and 1/χ(T) according to the
    Curie–Weiss law, Néel temperature transitions, and Langevin diamagnetism.
    """
    try:
        curves = calculate_temperature_curves(
            material_type=payload.material_type,
            t_min=payload.t_min,
            t_max=payload.t_max,
            num_points=payload.num_points,
            tc_or_tn=payload.tc_or_tn,
            ms0=payload.ms0,
            beta=payload.beta,
            curie_constant=payload.curie_constant,
            weiss_constant_theta=payload.weiss_constant_theta,
            chi_base=payload.chi_base
        )
        return curves
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Temperature calculation error: {str(e)}")


@app.post("/api/frequency")
def calculate_frequency_endpoint(payload: FrequencyRequest):
    """
    Computes theoretical Bertotti frequency-dependent power loss separation:
    P_total = P_hysteresis + P_eddy + P_excess.
    """
    try:
        return compute_frequency_losses(
            wh_cycle=payload.wh_cycle,
            ke_eddy=payload.ke_eddy,
            k_exc=payload.k_exc,
            f_min=payload.f_min,
            f_max=payload.f_max,
            num_points=payload.num_points,
            density_kg_per_m3=payload.density_kg_per_m3
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frequency analysis error: {str(e)}")


@app.post("/api/compare")
def compare_materials_endpoint(payload: MaterialComparisonRequest):
    """
    Compares up to 5 materials side-by-side:
    Generates overlaid hysteresis loops, radar chart metrics, hard-vs-soft verdicts, and suitability scores.
    """
    try:
        comparison_results = []
        for mat in payload.materials:
            name = mat.get("name", "Custom")
            ms = float(mat.get("saturation_magnetization", mat.get("ms", 1.2e6)))
            hc = float(mat.get("coercivity", mat.get("hc", 2000.0)))
            sq = float(mat.get("squareness", 0.75))
            cat = mat.get("category", mat.get("material_type", "ferromagnetic"))

            # Simulate representative loop
            loop_data = simulate_phenomenological_loop(ms=ms, hc=hc, squareness=sq, h_max=max(hc * 2.5, 10000.0), num_points=120)
            params = loop_data["parameters"]
            hard_soft = classify_hard_or_soft_magnetic(hc, params["remanence_br"], params["loop_area"])
            apps = evaluate_application_suitability(
                category=cat,
                coercivity_hc=hc,
                remanence_br=params["remanence_br"],
                saturation_bs=params["saturation_bs"],
                loop_area=params["loop_area"],
                initial_permeability=params["initial_permeability"]
            )

            # Radar metric scores normalized (0 to 100)
            radar = {
                "saturation": min(100, round((ms / 2.0e6) * 100)),
                "permeability": min(100, round((params["relative_max_permeability"] / 50000.0) * 100)),
                "coercivity_strength": min(100, round((hc / 1.0e6) * 100)),
                "energy_efficiency": max(0, min(100, round(100 - (params["loop_area"] / 500.0)))),
                "thermal_stability": 80
            }

            comparison_results.append({
                "name": name,
                "category": cat,
                "parameters": params,
                "hard_soft": hard_soft,
                "applications": apps,
                "radar_scores": radar,
                "h_loop": loop_data["h_loop"],
                "b_loop": loop_data["b_loop"]
            })

        return {
            "count": len(comparison_results),
            "materials": comparison_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Material comparison failed: {str(e)}")


@app.get("/api/materials")
def get_preset_materials():
    """Returns the library of standard preset reference materials."""
    return {
        "presets": PRESET_MATERIALS,
        "count": len(PRESET_MATERIALS)
    }


@app.get("/api/model/metrics")
def get_model_metrics():
    """Returns the trained model cross-validation benchmarks and confusion matrix."""
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            return json.load(f)
    elif classifier_service.metrics:
        return classifier_service.metrics
    else:
        raise HTTPException(status_code=404, detail="Model metrics file not found.")


@app.get("/api/learning/quiz")
def get_learning_centre_data():
    """
    Returns 20+ comprehensive physics quiz questions and the complete viva voce Q&A list.
    """
    quiz_questions = [
        {
            "id": 1,
            "topic": "Magnetic Susceptibility",
            "question": "What is the defining physical property of a diamagnetic material in terms of magnetic susceptibility χ?",
            "options": [
                "Negative susceptibility (χ < 0) independent of temperature",
                "Large positive susceptibility (χ >> 1)",
                "Temperature-dependent positive susceptibility following Curie's Law",
                "Susceptibility that peaks sharply at the Curie temperature"
            ],
            "correct_index": 0,
            "explanation": "Diamagnetism arises from Lenz's law response of paired electron orbital motions opposing the applied magnetic field, resulting in a small negative susceptibility (χ < 0) that is essentially temperature-independent."
        },
        {
            "id": 2,
            "topic": "Hysteresis Parameters",
            "question": "In a B-H hysteresis loop, what does coercivity (Hc) represent?",
            "options": [
                "The reverse magnetic field required to reduce magnetic flux density B to zero",
                "The residual induction left in the material when the external field H is zero",
                "The maximum flux density attainable under infinite excitation",
                "The total area enclosed by the loop per cycle"
            ],
            "correct_index": 0,
            "explanation": "Coercivity Hc is the intensity of the reverse magnetic field needed to completely demagnetize the material, bringing B to zero along the demagnetization curve."
        },
        {
            "id": 3,
            "topic": "Hard vs Soft Magnetic Classification",
            "question": "Which of the following is correct regarding 'Hard' vs 'Soft' magnetic materials?",
            "options": [
                "Hard vs Soft is a behavior class describing coercivity and domain-pinning kinetics, not a fundamental magnetic ordering category",
                "Hard magnetic materials form a distinct 5th quantum ordering state",
                "Soft magnetic materials must have coercivity Hc > 10,000 A/m",
                "Hard magnetic materials exhibit zero hysteresis loss"
            ],
            "correct_index": 0,
            "explanation": "Hard and soft are engineering behavior classifications based on coercivity Hc (soft: Hc < 1 kA/m, hard: Hc > 10 kA/m). The 5 fundamental quantum ordering categories are diamagnetic, paramagnetic, ferromagnetic, antiferromagnetic, and ferrimagnetic."
        },
        {
            "id": 4,
            "topic": "Quantum Exchange Interaction",
            "question": "Why do ferromagnets exhibit spontaneous magnetization while paramagnets do not?",
            "options": [
                "Quantum mechanical exchange interaction (J > 0) creates parallel alignment of adjacent electron spins",
                "Direct dipole-dipole electrostatic interaction between nucleus and electron orbits",
                "Lenz's law induces permanent circulating micro-currents",
                "Thermal agitation at room temperature forces moment alignment"
            ],
            "correct_index": 0,
            "explanation": "Spontaneous magnetization is driven by the quantum Heisenberg exchange interaction (J > 0) resulting from the Pauli exclusion principle and Coulomb electrostatic repulsion between overlapping electron wavefunctions."
        },
        {
            "id": 5,
            "topic": "Antiferromagnetism",
            "question": "What happens to the magnetic susceptibility of an antiferromagnetic material as temperature increases from 0 K through its Néel temperature (TN)?",
            "options": [
                "χ increases up to TN, reaches a maximum peak, and then decreases following Curie-Weiss behavior above TN",
                "χ decreases monotonically with temperature according to Curie's Law",
                "χ remains strictly zero at all temperatures",
                "χ jumps to infinity at TN like a superconductor"
            ],
            "correct_index": 0,
            "explanation": "Below TN, thermal agitation helps overcome rigid antiparallel sublattice exchange, increasing χ up to TN. Above TN, the long-range antiferromagnetic ordering is broken, and χ decreases following a modified Curie-Weiss law with negative Weiss constant θ."
        },
        {
            "id": 6,
            "topic": "Ferrimagnetism",
            "question": "How does ferrimagnetism (e.g. Magnetite Fe3O4) differ microscopically from antiferromagnetism?",
            "options": [
                "Sublattices have unequal opposing magnetic moments, yielding a net macroscopic magnetization",
                "All magnetic moments are strictly parallel across all lattice sites",
                "There is no exchange coupling between sublattices",
                "Ferrimagnets have zero electrical resistivity"
            ],
            "correct_index": 0,
            "explanation": "Both antiferromagnets and ferrimagnets possess antiparallel sublattices, but in ferrimagnets, the opposing sublattices contain different ions or occupancies (e.g. Fe3+ vs Fe2+ in octahedral vs tetrahedral sites), leaving a net non-zero spontaneous magnetization."
        },
        {
            "id": 7,
            "topic": "Energy Loss",
            "question": "The area enclosed by the closed B-H loop, W = ∮ H dB, represents:",
            "options": [
                "The hysteresis energy loss dissipated as heat per unit volume per cycle (J/m³)",
                "The electrical conductivity of the core material in S/m",
                "The total stored mechanical strain energy in the core",
                "The maximum flux rate dΦ/dt in Webers per second"
            ],
            "correct_index": 0,
            "explanation": "By Poynting's theorem and electromagnetic thermodynamics, the integral ∮ H dB around a closed hysteresis loop equals the thermal energy loss per unit volume dissipated per cycle in Joules per cubic meter (J/m³)."
        },
        {
            "id": 8,
            "topic": "Curie Temperature",
            "question": "Above the Curie temperature (Tc), a ferromagnetic material transitions into which magnetic phase?",
            "options": [
                "Paramagnetic phase with χ = C / (T - Tc)",
                "Diamagnetic phase with negative susceptibility",
                "Superconducting phase with Meissner effect",
                "Antiferromagnetic phase with zero susceptibility"
            ],
            "correct_index": 0,
            "explanation": "Above Tc, thermal kinetic energy overcomes the quantum exchange energy, destroying long-range spontaneous magnetic alignment and rendering the material paramagnetic according to the Curie–Weiss law."
        },
        {
            "id": 9,
            "topic": "Dynamic Core Loss",
            "question": "In the classical Bertotti loss separation model, how does eddy current power loss Pe scale with excitation frequency f?",
            "options": [
                "Quadratic scaling with frequency (Pe ∝ f²)",
                "Linear scaling with frequency (Pe ∝ f)",
                "Inverse scaling with frequency (Pe ∝ 1/f)",
                "Independent of excitation frequency"
            ],
            "correct_index": 0,
            "explanation": "By Faraday's law of induction, induced EMF is proportional to f, causing eddy currents to scale as f, and volumetric I²R power loss to scale quadratically with frequency (f²)."
        },
        {
            "id": 10,
            "topic": "Domain Wall Dynamics",
            "question": "The Barkhausen effect observed during magnetization provides direct acoustic/inductive evidence of:",
            "options": [
                "Discontinuous, jerky domain wall jumping past pinning sites (dislocations, grain boundaries, impurities)",
                "Continuously smooth spin precession under resonance",
                "Quantum tunneling of whole magnetic domains through the core",
                "Piezoelectric phase transitions in magnetic oxides"
            ],
            "correct_index": 0,
            "explanation": "The Barkhausen effect proves that domain wall motion is not continuous; walls jump abruptly when the applied field overcomes local microstructural pinning barriers."
        },
        {
            "id": 11,
            "topic": "Jiles-Atherton Model",
            "question": "In the Jiles–Atherton physical hysteresis model, what physical mechanism does parameter 'k' represent?",
            "options": [
                "Average domain wall pinning energy density per unit volume",
                "Weiss mean field inter-domain coupling",
                "Reversible domain wall flexing coefficient",
                "Total saturation magnetization"
            ],
            "correct_index": 0,
            "explanation": "In Jiles-Atherton theory, 'k' quantifies the average energy dissipated per unit volume when domain walls overcome microscopic pinning obstacles, directly determining coercivity."
        },
        {
            "id": 12,
            "topic": "Transformer Core Engineering",
            "question": "Why is 3% Silicon Steel preferred over pure Iron for large power distribution transformers?",
            "options": [
                "Silicon increases electrical resistivity (reducing eddy current loss) and lowers magnetostriction",
                "Silicon makes the steel a permanent magnet with high coercivity",
                "Silicon doubles the saturation magnetization Ms of iron",
                "Silicon eliminates the need for core laminations"
            ],
            "correct_index": 0,
            "explanation": "Adding ~3% silicon increases electrical resistivity roughly four-fold, greatly reducing eddy currents while maintaining high saturation Bs and reducing noise-causing magnetostriction."
        },
        {
            "id": 13,
            "topic": "RF Inductor Cores",
            "question": "Why are ferrites (like MnZn and NiZn) used for high-frequency (kHz to MHz) switch-mode power supplies?",
            "options": [
                "High electrical resistivity (> 10² to 10⁶ Ω·m) virtually eliminates classical eddy current losses",
                "They have higher saturation induction Bs than silicon steel",
                "They have infinite coercivity",
                "They are superconductors at room temperature"
            ],
            "correct_index": 0,
            "explanation": "Ferrites are ceramic magnetic oxides with electrical resistivities orders of magnitude higher than metallic conductors, making high-frequency eddy current losses negligible."
        },
        {
            "id": 14,
            "topic": "Permeability of Free Space",
            "question": "What is the approximate numerical value of the magnetic constant μ0 in SI units?",
            "options": [
                "4π × 10⁻⁷ H/m (~1.257 × 10⁻⁶ T·m/A)",
                "8.854 × 10⁻¹² F/m",
                "1.000 × 10⁻³ H/m",
                "9.109 × 10⁻³¹ kg"
            ],
            "correct_index": 0,
            "explanation": "In SI units, the permeability of free space μ0 = 4π × 10⁻⁷ H/m ≈ 1.2566 × 10⁻⁶ H/m."
        },
        {
            "id": 15,
            "topic": "Rare-Earth Magnets",
            "question": "Why do Nd2Fe14B permanent magnets have such high coercivity (> 800 kA/m)?",
            "options": [
                "Extremely high uniaxial magnetocrystalline anisotropy of the tetragonal crystal lattice",
                "Very low Curie temperature",
                "High electrical conductivity",
                "Absence of magnetic domains"
            ],
            "correct_index": 0,
            "explanation": "Nd2Fe14B possesses an exceptionally strong magnetocrystalline anisotropy constant K1, making rotation of atomic moments away from the c-axis require immense reverse magnetic fields."
        },
        {
            "id": 16,
            "topic": "Curie–Weiss Constant",
            "question": "In the Curie–Weiss law χ = C / (T - θ), a positive value of the Weiss constant θ indicates:",
            "options": [
                "Ferromagnetic exchange coupling tending to align spins parallel",
                "Antiferromagnetic coupling tending to align spins antiparallel",
                "Pure orbital diamagnetism",
                "Zero interaction between atomic moments"
            ],
            "correct_index": 0,
            "explanation": "A positive Weiss constant θ > 0 reflects ferromagnetic exchange favoring parallel moment alignment, while θ < 0 indicates antiferromagnetic interactions."
        },
        {
            "id": 17,
            "topic": "Superparamagnetism",
            "question": "What is the superparamagnetic limit in magnetic recording nanoparticles?",
            "options": [
                "Thermal energy kBT flips the magnetization of nanoscale grains faster than measurement time, causing bit loss",
                "The material melts from eddy currents",
                "The exchange interaction becomes negative",
                "Coercivity becomes infinite"
            ],
            "correct_index": 0,
            "explanation": "When grain volume V becomes small, thermal energy kBT exceeds the magnetic anisotropy energy barrier KV, causing spontaneous thermal flipping of the entire particle's magnetization."
        },
        {
            "id": 18,
            "topic": "Initial Permeability",
            "question": "Initial permeability μ_i is defined as the slope of the virgin B-H curve as:",
            "options": [
                "H approaches zero from the demagnetized state (lim H→0 B/H)",
                "H reaches the saturation field",
                "B crosses zero on the descending branch",
                "Frequency approaches infinity"
            ],
            "correct_index": 0,
            "explanation": "Initial permeability μ_i measures the ease of reversible domain wall bowing at infinitesimal excitation fields starting from a completely demagnetized state."
        },
        {
            "id": 19,
            "topic": "Flux Density vs Magnetization",
            "question": "Which of the following equations correctly relates magnetic flux density B, applied field H, and magnetization M in SI units?",
            "options": [
                "B = μ0 (H + M)",
                "B = H + 4π M",
                "M = μ0 (B + H)",
                "B = μ0 H - M"
            ],
            "correct_index": 0,
            "explanation": "In SI units, total magnetic flux density is B = μ0 (H + M), where H and M are in A/m and B is in Tesla."
        },
        {
            "id": 20,
            "topic": "Machine Learning in Physics",
            "question": "Why is GroupKFold validation based on material name critical when training ML models on augmented magnetic datasets?",
            "options": [
                "To prevent data leakage by ensuring all simulated variants of a material remain together in either train or test splits",
                "To speed up matrix multiplication in scikit-learn",
                "Because GroupKFold automatically normalizes SI units",
                "To remove missing values from the dataset"
            ],
            "correct_index": 0,
            "explanation": "Grouping by material name guarantees that simulated variants of the same base material are never split across train and test sets simultaneously, avoiding over-optimistic evaluation from data leakage."
        }
    ]

    viva_qa = [
        {
            "question": "Q1: What are the fundamental physical differences between the 5 magnetic categories?",
            "answer": "Diamagnetism: all electron shells are full, no net atomic magnetic moment, χ < 0 independent of T (Lenz law). Paramagnetism: unpaired electron spins, net atomic moments aligned randomly by thermal motion, χ > 0 (Curie law χ=C/T). Ferromagnetism: spontaneous parallel spin ordering via positive exchange J>0 below Tc, forming domains with hysteresis and high remanence. Antiferromagnetism: adjacent sublattices align antiparallel via J<0 below TN, producing zero net moment but a susceptibility peak at TN. Ferrimagnetism: antiparallel sublattices with unequal magnetic moments yielding a net spontaneous magnetization and hysteresis (e.g. ferrites)."
        },
        {
            "question": "Q2: Is 'Hard vs Soft' magnetic material a fifth magnetic category?",
            "answer": "No. Hard and soft are engineering behavior classifications based on coercivity (Hc) and domain wall mobility, not fundamental quantum ordering categories. Both hard and soft materials are typically ferromagnetic or ferrimagnetic. Soft materials (Hc < 1 kA/m) allow rapid domain wall motion for AC cores, while hard materials (Hc > 10 kA/m) exhibit heavy defect pinning for permanent magnets."
        },
        {
            "question": "Q3: Explain the origin and derivation of the hysteresis energy loss formula W = ∮ H dB.",
            "answer": "From Maxwell's equations and Poynting's theorem for electrodynamics, the total electromagnetic energy density delivered to a magnetic core over time is ∫ (E × H) · n dA = ∫ H · (dB/dt) dt = ∮ H dB. For a closed cycle in the H-B plane, the enclosed area represents the net electrical work converted irreversibly into thermal kinetic energy (heat) due to domain wall pinning and Barkhausen jumps."
        },
        {
            "question": "Q4: How does the Jiles–Atherton model capture physical hysteresis better than empirical tanh models?",
            "answer": "The phenomenological tanh model uses fixed mathematical functions for ascending/descending branches without underlying energy balance. The Jiles–Atherton model directly models domain mechanics: an anhysteretic state Man via the modified Langevin function L(He/a), effective Weiss field He=H+αM, irreversible domain wall motion driven by pinning energy density k, and reversible wall bowing parameter c. This allows modeling arbitrary minor loops and dynamic minor excitations."
        },
        {
            "question": "Q5: How does your ML pipeline handle missing values for diamagnets/paramagnets without corrupting physics?",
            "answer": "Diamagnets and paramagnets have legitimately missing hysteresis parameters (no coercivity, no remanence, no loop area). Setting them to zero can mislead linear models. Our pipeline uses SimpleImputer with add_indicator=True combined with RobustScaler. The indicator flags explicitly inform tree splits that coercivity is unmeasured, which is itself a strong physical feature separating hysteretic from non-hysteretic materials."
        }
    ]

    return {
        "quiz": quiz_questions,
        "viva_qa": viva_qa,
        "total_questions": len(quiz_questions),
        "total_viva": len(viva_qa)
    }


@app.post("/api/report")
def generate_report_endpoint(payload: ReportGenerationRequest):
    """
    Compiles an analysis into a downloadable PDF technical characterization report via ReportLab.
    """
    try:
        pdf_path = build_pdf_report(
            analysis_data=payload.analysis_data,
            material_name=payload.material_name
        )
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=os.path.basename(pdf_path)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@app.get("/api/history")
def get_history_endpoint(limit: int = Query(50, ge=1, le=200)):
    """Returns the persistent log of prior material analyses from SQLite."""
    try:
        records = get_analysis_history(limit=limit)
        return {
            "count": len(records),
            "history": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")


from fastapi.staticfiles import StaticFiles

# --- Static Frontend Serving for Production / Render ---
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Do not intercept API or docs routes
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
