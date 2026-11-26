"""
MAGNETIC AI - PDF Technical Report Generator
Uses ReportLab to generate publication-grade technical analysis reports.
Embeds:
- Title banner and metadata
- Input parameters and units
- Predicted magnetic category and probability spectrum
- Behavior class (Hard vs Soft badge)
- Matplotlib-rendered B-H Hysteresis loop plot
- Computed electromagnetic parameters table
- Plain-English XAI Shapley attribution synthesis
- Industrial application suitability scores
- Physics assumptions, equations, and experimental disclaimers
"""

import os
from datetime import datetime
from typing import Dict, Any, Optional

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    HRFlowable
)


def generate_hysteresis_plot_png(
    h_loop: list,
    b_loop: list,
    hc: Optional[float] = None,
    br: Optional[float] = None,
    ms: Optional[float] = None,
    output_png: str = "reports/temp_bh_plot.png"
) -> str:
    """Generates a clean publication-quality B-H plot with annotations."""
    os.makedirs(os.path.dirname(output_png), exist_ok=True)
    
    plt.figure(figsize=(6.5, 3.8), facecolor="white")
    ax = plt.subplot(1, 1, 1)
    
    ax.plot(h_loop, b_loop, color="#0D9488", linewidth=2.0, label="B-H Major Loop")
    ax.axhline(0, color="#64748B", linestyle="--", linewidth=0.8, alpha=0.7)
    ax.axvline(0, color="#64748B", linestyle="--", linewidth=0.8, alpha=0.7)
    
    # Shade loop area
    ax.fill(h_loop, b_loop, color="#14B8A6", alpha=0.15, label="Hysteresis Loss (∮ H dB)")

    # Annotate Hc and Br
    if hc is not None and hc > 0:
        ax.plot([hc, -hc], [0, 0], "ro", markersize=5)
        ax.annotate(f"Hc = {hc:.1f} A/m", xy=(hc, 0), xytext=(hc * 1.05, max(b_loop) * 0.1),
                    color="#DC2626", fontsize=8, arrowprops=dict(arrowstyle="->", color="#DC2626"))

    if br is not None and br > 0:
        ax.plot([0, 0], [br, -br], "bs", markersize=5)
        ax.annotate(f"Br = {br:.2f} T", xy=(0, br), xytext=(max(h_loop) * 0.1, br * 1.02),
                    color="#2563EB", fontsize=8, arrowprops=dict(arrowstyle="->", color="#2563EB"))

    ax.set_title("Simulated Magnetic Induction Hysteresis Loop (B vs H)", fontsize=11, fontweight="bold", pad=8)
    ax.set_xlabel("Applied Magnetic Field H (A/m)", fontsize=9, fontweight="bold")
    ax.set_ylabel("Magnetic Flux Density B (Tesla)", fontsize=9, fontweight="bold")
    ax.grid(True, linestyle=":", alpha=0.6)
    ax.legend(loc="lower right", fontsize=8)
    plt.tight_layout()
    plt.savefig(output_png, dpi=200)
    plt.close()
    return output_png


def build_pdf_report(
    analysis_data: Dict[str, Any],
    material_name: str = "Magnetic Sample Specimen",
    output_filename: Optional[str] = None
) -> str:
    """Builds and saves the complete ReportLab PDF document."""
    os.makedirs("reports", exist_ok=True)
    if not output_filename:
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        output_filename = f"reports/magnetic_analysis_{timestamp_str}.pdf"

    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom palette
    navy_dark = colors.HexColor("#0B1530")
    teal_accent = colors.HexColor("#0D9488")
    slate_dark = colors.HexColor("#1E293B")
    gray_light = colors.HexColor("#F8FAFC")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=navy_dark,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=teal_accent,
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=slate_dark
    )

    disclaimer_style = ParagraphStyle(
        "DisclaimerText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748B")
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("MAGNETIC AI: Technical Material Characterization Report", title_style))
    story.append(Paragraph(
        f"Material: <b>{material_name}</b> | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Engineering Physics + ML Capstone",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=teal_accent, spaceBefore=0, spaceAfter=10))

    # 2. Executive Prediction Summary
    pred_cat = analysis_data.get("predicted_category", "Unknown").upper()
    confidence = analysis_data.get("confidence_score", 0.0)
    hard_soft = analysis_data.get("hard_soft_classification", {})
    hs_badge = hard_soft.get("behavior_class", "N/A")

    summary_data = [
        [
            Paragraph("<b>Predicted Magnetic Class:</b>", body_style),
            Paragraph(f"<font color='#0D9488'><b>{pred_cat}</b></font>", body_style),
            Paragraph("<b>Model Confidence:</b>", body_style),
            Paragraph(f"<b>{confidence:.1%}</b>", body_style)
        ],
        [
            Paragraph("<b>Behavior Classification:</b>", body_style),
            Paragraph(f"<b>{hs_badge}</b>", body_style),
            Paragraph("<b>OOD Status:</b>", body_style),
            Paragraph("Normal In-Distribution" if not analysis_data.get("out_of_distribution", {}).get("is_ood") else "<font color='#DC2626'><b>Flagged OOD</b></font>", body_style)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[1.8 * inch, 2.0 * inch, 1.5 * inch, 2.0 * inch])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), gray_light),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 3. Class Probabilities Spectrum
    story.append(Paragraph("Class Probability Distribution", h2_style))
    prob_dict = analysis_data.get("probabilities", {})
    prob_rows = [["Magnetic Class", "Model Probability Score", "Significance"]]
    for cat_name, prob_val in prob_dict.items():
        prob_rows.append([
            cat_name.capitalize(),
            f"{prob_val:.2%}",
            "Dominant Prediction" if cat_name.lower() == pred_cat.lower() else "Alternative Candidate"
        ])

    prob_table = Table(prob_rows, colWidths=[2.5 * inch, 2.2 * inch, 2.6 * inch])
    prob_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), navy_dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(prob_table)
    story.append(Spacer(1, 10))

    # 4. Optional B-H Curve Graph
    hyst_data = analysis_data.get("hysteresis")
    if hyst_data and "h_loop" in hyst_data and "b_loop" in hyst_data:
        story.append(Paragraph("Simulated Magnetic Hysteresis Loop", h2_style))
        params = hyst_data.get("parameters", {})
        png_path = generate_hysteresis_plot_png(
            h_loop=hyst_data["h_loop"],
            b_loop=hyst_data["b_loop"],
            hc=params.get("coercivity_hc"),
            br=params.get("remanence_br"),
            ms=params.get("saturation_ms"),
            output_png=f"reports/plot_{datetime.utcnow().strftime('%f')}.png"
        )
        story.append(Image(png_path, width=6.2 * inch, height=3.2 * inch))
        story.append(Spacer(1, 8))

    # 5. Physical Properties Table
    props = analysis_data.get("properties") or (hyst_data.get("parameters") if hyst_data else {})
    if props:
        story.append(Paragraph("Extracted Physical Parameters", h2_style))
        prop_rows = [
            ["Parameter", "SI Symbol", "Value", "Units"],
            ["Coercivity", "Hc", f"{props.get('coercivity_hc', 0.0):.2f}", "A/m"],
            ["Remanence", "Br", f"{props.get('remanence_br', 0.0):.4f}", "Tesla (T)"],
            ["Saturation Magnetization", "Ms", f"{props.get('saturation_ms', 0.0):g}", "A/m"],
            ["Hysteresis Energy Loss", "W = ∮ H dB", f"{props.get('loop_area', 0.0):.2f}", "J/m³ per cycle"],
            ["Initial Permeability", "μ_i", f"{props.get('initial_permeability', 0.0):.3e}", "H/m (T·m/A)"]
        ]
        prop_table = Table(prop_rows, colWidths=[2.4 * inch, 1.2 * inch, 1.8 * inch, 1.9 * inch])
        prop_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), navy_dark),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, gray_light]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(prop_table)
        story.append(Spacer(1, 10))

    # 6. Explainable AI (XAI) Synthesis
    xai = analysis_data.get("xai", {})
    narrative = xai.get("plain_english_narrative", "")
    if narrative:
        story.append(Paragraph("Explainable AI (XAI) Physical Attribution", h2_style))
        # Format markdown asterisks into HTML for ReportLab
        formatted_narrative = narrative.replace("**", "<b>").replace("`", "")
        # Close matching tags if simple
        for para_text in formatted_narrative.split("\n\n"):
            if para_text.strip():
                story.append(Paragraph(para_text.strip(), body_style))
                story.append(Spacer(1, 4))
        story.append(Spacer(1, 6))

    # 7. Industrial Application Suitability
    apps = analysis_data.get("applications", {})
    if apps:
        story.append(Paragraph("Industrial Application Recommendations", h2_style))
        app_rows = [["Industrial Application", "Suitability Score", "Suitability Rating", "Engineering Rationale"]]
        for app_key, app_info in apps.items():
            app_rows.append([
                app_info.get("title", app_key),
                f"{app_info.get('score', 0)} / 100",
                app_info.get("rating", "N/A"),
                Paragraph(app_info.get("rationale", ""), body_style)
            ])
        app_table = Table(app_rows, colWidths=[2.0 * inch, 1.1 * inch, 1.2 * inch, 3.0 * inch])
        app_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), navy_dark),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7.5),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, gray_light]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(app_table)
        story.append(Spacer(1, 10))

    # 8. Disclaimer & Academic Framework
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#94A3B8"), spaceBefore=6, spaceAfter=6))
    story.append(Paragraph(
        "<b>ACADEMIC & SCIENTIFIC DISCLAIMER:</b> MAGNETIC AI is an Engineering Physics + Machine Learning capstone project. "
        "The classification model was trained on standard literature reference anchors augmented with physical simulated variations. "
        "Probabilities reflect ensemble statistical scores, not certified laboratory measurements. "
        "All hysteresis and frequency models employ phenomenological or Jiles–Atherton theoretical representations.",
        disclaimer_style
    ))

    doc.build(story)
    return output_filename
