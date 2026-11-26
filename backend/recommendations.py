"""
MAGNETIC AI - Industrial Application Recommendation Engine
Evaluates magnetic properties and predicted material class to score suitability
across major engineering applications:
1. Transformer Core (Low loss, high μ, soft, low Hc, high Bs)
2. Electric Motor Stator / Rotor (High Bs, low loss at 50-400Hz, moderate cost)
3. Permanent Magnet / Actuator (High Hc, high Br, high BHmax, hard magnetic)
4. High-Density Magnetic Recording / Storage (High Hc, high squareness, stable against superparamagnetism)
5. Magnetic Sensors & Magnetometers (Ultra-high initial μ, near-zero Hc, high sensitivity)
6. High-Frequency Inductor / EMI Suppression (High resistivity, low eddy loss, ferrites)
"""

from typing import Dict, Any, List, Optional


def evaluate_application_suitability(
    category: str,
    coercivity_hc: Optional[float] = None,
    remanence_br: Optional[float] = None,
    saturation_bs: Optional[float] = None,
    loop_area: Optional[float] = None,
    initial_permeability: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes suitability scores (0 to 100) and engineering rationale for 6 industrial applications.
    """
    cat = category.lower().strip()
    hc = coercivity_hc if coercivity_hc is not None else 500.0
    br = remanence_br if remanence_br is not None else 0.5
    bs = saturation_bs if saturation_bs is not None else 1.2
    w_loss = loop_area if loop_area is not None else 100.0
    mu_i = initial_permeability if initial_permeability is not None else 1e-3

    scores: Dict[str, Dict[str, Any]] = {}

    # 1. Transformer Core
    if cat in ["ferromagnetic", "ferrimagnetic"]:
        # Needs: Soft (low Hc), low loss (low W), high permeability, high Bs
        s_hc = max(0, 100 - (hc / 50.0))
        s_loss = max(0, 100 - (w_loss / 10.0))
        s_bs = min(100, (bs / 1.8) * 100)
        score_transformer = round(0.4 * s_hc + 0.4 * s_loss + 0.2 * s_bs)
        rationale_transformer = (
            f"Transformer cores require minimal hysteresis loss and coercivity < 100 A/m to minimize eddy/hysteresis heat. "
            f"Observed Hc={hc:.1f} A/m and loop area={w_loss:.1f} J/m³."
        )
    else:
        score_transformer = 5
        rationale_transformer = f"{category.capitalize()} materials lack sufficient magnetic flux conduction for power transformer cores."

    scores["transformer_core"] = {
        "title": "Transformer Core & AC Inductors",
        "score": max(5, min(99, score_transformer)),
        "rating": "High" if score_transformer >= 75 else ("Moderate" if score_transformer >= 45 else "Low"),
        "key_requirements": "Low coercivity (Hc < 100 A/m), high saturation Bs > 1.5 T, minimal hysteresis loop area.",
        "rationale": rationale_transformer
    }

    # 2. Electric Motor Stator / Rotor
    if cat in ["ferromagnetic", "ferrimagnetic"]:
        s_hc = max(0, 100 - (hc / 150.0))
        s_bs = min(100, (bs / 1.6) * 100)
        score_motor = round(0.5 * s_bs + 0.5 * s_hc)
        rationale_motor = (
            f"Motor laminations demand high saturation flux density Bs ({bs:.2f} T) for torque density "
            f"and manageable hysteresis loss under rotating AC magnetic fields."
        )
    else:
        score_motor = 5
        rationale_motor = f"{category.capitalize()} materials cannot produce required motor magnetic torque."

    scores["electric_motor"] = {
        "title": "Electric Motor Stators & Rotors",
        "score": max(5, min(99, score_motor)),
        "rating": "High" if score_motor >= 75 else ("Moderate" if score_motor >= 45 else "Low"),
        "key_requirements": "High saturation flux density Bs > 1.5 T, moderate to low coercivity, high mechanical integrity.",
        "rationale": rationale_motor
    }

    # 3. Permanent Magnets / Actuators
    if cat in ["ferromagnetic", "ferrimagnetic"]:
        # Hard magnetic: high Hc (> 10 kA/m), high Br
        s_hc = min(100, (hc / 20000.0) * 100)
        s_br = min(100, (br / 1.2) * 100)
        score_pm = round(0.6 * s_hc + 0.4 * s_br)
        rationale_pm = (
            f"Permanent magnets require high coercivity (Hc > 10,000 A/m) to prevent demagnetization under reverse fields. "
            f"Current Hc = {hc:.1f} A/m."
        )
    else:
        score_pm = 0
        rationale_pm = f"Non-ferromagnetic material has no spontaneous remanence."

    scores["permanent_magnet"] = {
        "title": "Permanent Magnets & DC Actuators",
        "score": max(2, min(99, score_pm)),
        "rating": "High" if score_pm >= 75 else ("Moderate" if score_pm >= 45 else "Low"),
        "key_requirements": "High coercivity Hc > 10 kA/m, high remanence Br > 0.8 T, high (BH)max energy product.",
        "rationale": rationale_pm
    }

    # 4. Magnetic Recording & Storage
    if cat in ["ferromagnetic", "ferrimagnetic"]:
        # Moderate to high coercivity (1 kA/m to 50 kA/m) to prevent accidental erasure while allowing write heads
        if 1500 <= hc <= 100000:
            score_rec = 85
        elif hc > 100000:
            score_rec = 60
        else:
            score_rec = 30
        rationale_rec = f"Recording media requires balanced coercivity (~2-10 kA/m or higher for perpendicular recording) to retain bits securely."
    else:
        score_rec = 5
        rationale_rec = f"No stable remanent states for binary data bit storage."

    scores["magnetic_storage"] = {
        "title": "Magnetic Data Storage Media",
        "score": max(5, min(95, score_rec)),
        "rating": "High" if score_rec >= 75 else ("Moderate" if score_rec >= 45 else "Low"),
        "key_requirements": "Square hysteresis loop (high Mr/Ms), controlled coercivity to resist thermal demagnetization.",
        "rationale": rationale_rec
    }

    # 5. Magnetic Sensors & Fluxgates
    if cat in ["ferromagnetic", "ferrimagnetic"]:
        if hc < 500:
            score_sensor = 90
        elif hc < 2000:
            score_sensor = 65
        else:
            score_sensor = 25
        rationale_sensor = f"Sensors require sharp B-H nonlinearity, high initial permeability, and ultra-low coercivity for high sensitivity."
    elif cat == "paramagnetic":
        score_sensor = 40
        rationale_sensor = "Paramagnetic susceptibility can be utilized in specialized magnetic resonance or SQUID calibrate samples."
    else:
        score_sensor = 10
        rationale_sensor = "Low sensitivity to external magnetic field variations."

    scores["magnetic_sensors"] = {
        "title": "Magnetic Field Sensors & Magnetometers",
        "score": max(5, min(95, score_sensor)),
        "rating": "High" if score_sensor >= 75 else ("Moderate" if score_sensor >= 45 else "Low"),
        "key_requirements": "High initial permeability μ_i, near-zero coercivity, minimal Barkhausen noise.",
        "rationale": rationale_sensor
    }

    # 6. High-Frequency Inductor / RF Ferrite
    if cat == "ferrimagnetic":
        score_rf = 92
        rationale_rf = "Ferrimagnetic ferrites feature high electrical resistivity (reducing eddy currents by 10^6x) making them dominant in RF/switch-mode power supplies."
    elif cat == "ferromagnetic" and hc < 500:
        score_rf = 55
        rationale_rf = "Ferromagnetic metals require ultra-thin laminations or powder cores to suppress severe eddy currents at high frequencies."
    elif cat == "diamagnetic":
        score_rf = 30
        rationale_rf = "Used in diamagnetic levitation or electromagnetic shielding (copper/aluminum eddy screens)."
    else:
        score_rf = 15
        rationale_rf = "Limited utility in RF inductive circuits."

    scores["high_frequency_rf"] = {
        "title": "High-Frequency Inductor & EMI Suppression",
        "score": max(5, min(95, score_rf)),
        "rating": "High" if score_rf >= 75 else ("Moderate" if score_rf >= 45 else "Low"),
        "key_requirements": "High electrical resistivity (> 10^3 Ω·m), stable permeability up to MHz frequencies.",
        "rationale": rationale_rf
    }

    return scores
