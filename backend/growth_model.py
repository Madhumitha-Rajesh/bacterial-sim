"""
growth_model.py
----------------
Core simulation engine for the Bacterial Growth Virtual Simulation.

Models two co-existing sub-populations sharing one agar plate:
  - Sensitive ("normal") population  -> killed/suppressed by antibiotic once
    the live plate concentration crosses the species/drug MIC.
  - Resistant ("mutant") population  -> a small starting fraction of the
    inoculum that tolerates much higher drug concentrations (with a small
    fitness cost that slows its baseline growth).

Both share logistic (carrying-capacity limited) growth. Antibiotic
concentration on the plate decays over time (first-order / exponential
clearance), which is what powers the "Live Antibiotic Clearance Profile"
chart on the dashboard.

All biological parameters are read from the JSON config files in ./config
so they can be tuned without touching this file.
"""

import json
import math
import os

CONFIG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config")


def _load_json(name):
    with open(os.path.join(CONFIG_DIR, name), "r") as f:
        return json.load(f)


def load_configs():
    return {
        "bacteria": _load_json("bacteria.json"),
        "antibiotics": _load_json("antibiotics.json"),
        "nutrients": _load_json("nutrients.json"),
    }


def _temperature_factor(temp_c, optimal, tolerance, min_t, max_t):
    """Gaussian-shaped growth response to temperature. Returns 0..1."""
    if temp_c <= min_t or temp_c >= max_t:
        return 0.0
    exponent = -((temp_c - optimal) ** 2) / (2 * (tolerance ** 2))
    return math.exp(exponent)


def _downsample(series, max_points=120):
    n = len(series)
    if n <= max_points:
        return series
    stride = max(1, n // max_points)
    sampled = series[::stride]
    if sampled[-1] != series[-1]:
        sampled.append(series[-1])
    return sampled


def run_simulation(species, temperature, nutrient_level, antibiotic_type,
                    antibiotic_pct, duration_hours):
    """
    Run the growth simulation and return a JSON-serialisable dict with
    time-series data (for charts / petri-dish animation) and summary
    metrics (for the dashboard cards).
    """
    cfg = load_configs()
    bacteria_cfg = cfg["bacteria"]
    antibiotics_cfg = cfg["antibiotics"]
    nutrients_cfg = cfg["nutrients"]

    if species not in bacteria_cfg:
        raise ValueError(f"Unknown species: {species}")
    if antibiotic_type not in antibiotics_cfg:
        raise ValueError(f"Unknown antibiotic: {antibiotic_type}")
    if nutrient_level not in nutrients_cfg:
        raise ValueError(f"Unknown nutrient level: {nutrient_level}")

    b = bacteria_cfg[species]
    drug = antibiotics_cfg[antibiotic_type]
    nutrient = nutrients_cfg[nutrient_level]

    duration_hours = max(1, min(float(duration_hours), 168))
    antibiotic_pct = max(0.0, min(float(antibiotic_pct), 100.0))
    temperature = float(temperature)

    temp_factor = _temperature_factor(
        temperature, b["optimalTemp"], b["tempTolerance"], b["minTemp"], b["maxTemp"]
    )
    r_base = b["baseGrowthRate"] * nutrient["growthMultiplier"] * temp_factor
    K = float(nutrient["carryingCapacity"])
    lag_time = b["lagTime"]

    mic_s = drug["mic"].get(species, 10)
    mic_r = mic_s * 15.0
    clearance_rate = drug["clearanceRate"]
    max_kill = drug["maxKillRate"]
    fitness_cost = b["resistantFitnessCost"]

    # Initial inoculum
    N0 = 5.0
    Ns = N0 * (1 - b["resistantFraction"])
    Nr = N0 * b["resistantFraction"]

    dt = 0.05
    steps = int(duration_hours / dt)

    times, totals, sensitives, resistants, drug_curve, phases = [], [], [], [], [], []

    peak_total = Ns + Nr
    peak_time = 0.0
    first_log_time = None
    doubling_time = None
    log_growth_started = False

    t = 0.0
    for i in range(steps + 1):
        N = Ns + Nr
        Ct = antibiotic_pct * math.exp(-clearance_rate * t)

        logistic_factor = max(0.0, 1 - N / K) if K > 0 else 0.0

        if t < lag_time:
            eff_r = r_base * 0.05
            phase = "Lag"
        else:
            eff_r = r_base
            phase = "Log"

        # Sensitive sub-population response to drug
        if mic_s > 0 and Ct > mic_s:
            kill_s = max_kill * (1 - math.exp(-(Ct / mic_s - 1)))
            r_s_eff = eff_r * 0.2
        else:
            supp = 1 - 0.6 * (Ct / mic_s) if mic_s > 0 else 1.0
            supp = max(supp, 0.15)
            r_s_eff = eff_r * supp
            kill_s = 0.0

        # Resistant sub-population response to drug (much higher tolerance)
        eff_r_r = eff_r * (1 - fitness_cost)
        if mic_r > 0 and Ct > mic_r:
            kill_r = max_kill * 0.5 * (1 - math.exp(-(Ct / mic_r - 1)))
            r_r_eff = eff_r_r * 0.3
        else:
            kill_r = 0.0
            r_r_eff = eff_r_r

        dNs = r_s_eff * Ns * logistic_factor - kill_s * Ns
        dNr = r_r_eff * Nr * logistic_factor - kill_r * Nr

        Ns = max(0.0, Ns + dNs * dt)
        Nr = max(0.0, Nr + dNr * dt)
        N_new = Ns + Nr

        # Track doubling time during genuine log growth (no lethal drug present)
        if not log_growth_started and t >= lag_time and Ct <= mic_s:
            log_growth_started = True
            first_log_time = t
            n_at_log_start = N_new if N_new > 0 else N0
        if (
            log_growth_started
            and doubling_time is None
            and N_new >= 2 * max(n_at_log_start, 1)
        ):
            doubling_time = round(t - first_log_time, 2)

        if N_new > peak_total:
            peak_total = N_new
            peak_time = t

        # Phase classification for this instant
        if t < lag_time:
            phase = "Lag"
        elif kill_s > 0.05 and N_new < peak_total * 0.98:
            phase = "Death"
        elif N_new >= K * 0.92:
            phase = "Stationary"
        elif N_new > (totals[-1] if totals else N0) + 1e-6:
            phase = "Log"
        else:
            phase = "Stationary"

        times.append(round(t, 2))
        totals.append(round(N_new, 2))
        sensitives.append(round(Ns, 2))
        resistants.append(round(Nr, 2))
        drug_curve.append(round(Ct, 2))
        phases.append(phase)

        t += dt

    final_total = totals[-1]
    final_sensitive = sensitives[-1]
    final_resistant = resistants[-1]
    final_phase = phases[-1]

    survival_rate = (final_total / peak_total * 100) if peak_total > 0 else 0.0
    survival_rate = round(max(0.0, min(100.0, survival_rate)), 1)

    # Net decline velocity: rate of loss from peak to final point (CFU/hr)
    time_span_after_peak = times[-1] - peak_time
    if final_total < peak_total and time_span_after_peak > 0:
        net_decline_velocity = round((peak_total - final_total) / time_span_after_peak, 2)
    else:
        net_decline_velocity = 0.0

    phase_order = ["Lag", "Log", "Stationary", "Death"]
    reached_phases = []
    seen = set()
    for p in phases:
        if p not in seen:
            seen.add(p)
            reached_phases.append(p)

    result = {
        "species": species,
        "parameters": {
            "temperature": temperature,
            "nutrientLevel": nutrient_level,
            "antibioticType": antibiotic_type,
            "antibioticPct": antibiotic_pct,
            "durationHours": duration_hours,
        },
        "timeSeries": {
            "time": _downsample(times),
            "totalPopulation": _downsample(totals),
            "sensitivePopulation": _downsample(sensitives),
            "resistantPopulation": _downsample(resistants),
            "antibioticConcentration": _downsample(drug_curve),
            "phase": _downsample(phases),
        },
        "summary": {
            "finalPopulation": round(final_total),
            "finalSensitive": round(final_sensitive),
            "finalResistant": round(final_resistant),
            "growthPhaseStatus": final_phase,
            "phaseSequence": phase_order,
            "reachedPhases": reached_phases,
            "survivalRate": survival_rate,
            "netDeclineVelocity": net_decline_velocity,
            "peakDensity": round(peak_total),
            "peakTime": round(peak_time, 2),
            "generationDoublingTime": doubling_time if doubling_time is not None else None,
            "carryingCapacity": round(K),
            "mic": mic_s,
        },
    }
    return result
