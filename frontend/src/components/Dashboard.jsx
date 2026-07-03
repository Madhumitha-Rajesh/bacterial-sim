import GrowthChart from './GrowthChart.jsx'
import ClearanceChart from './ClearanceChart.jsx'
import './Dashboard.css'

const PHASES = ['Lag', 'Log', 'Stationary', 'Death']

export default function Dashboard({ result, params, onBack }) {
  const { summary, timeSeries } = result

  return (
    <div className="dashboard">
      <div className="dashboard-topbar">
        <button className="back-btn" onClick={onBack}>
          ← Back to Setup Panel
        </button>
        <h2 className="dashboard-title">
          <span className="dashboard-icon">🔬</span> Simulation Dynamics Dashboard
        </h2>
        <span className="organism-pill">Organism: {result.species}</span>
      </div>

      <div className="live-params">
        Live Parameter Values:&nbsp;
        <span>🌡️ {params.temperature}°C</span>
        <span className="dot-sep">|</span>
        <span>🌱 Nutrient: {params.nutrientLevel}</span>
        <span className="dot-sep">|</span>
        <span>💊 Drug: {params.antibioticType}</span>
        <span className="dot-sep">|</span>
        <span>💧 Concentration: {params.antibioticPct}%</span>
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <span className="metric-label">Growth Phase Status</span>
          <div className="phase-badges">
            {PHASES.map((p) => (
              <span
                key={p}
                className={`phase-badge ${p === summary.growthPhaseStatus ? `active-${p.toLowerCase()}` : ''}`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-label">Survival Rate</span>
          <span className="metric-value value-green">{summary.survivalRate}%</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">⚠️ Net Decline Velocity</span>
          <span className="metric-value value-orange">{summary.netDeclineVelocity} CFU/hr</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Total Duration</span>
          <span className="metric-value value-blue">{summary.durationDisplay || `${params.durationHours} Hours`}</span>
        </div>
      </div>

      <div className="colony-row">
        <div className="colony-card colony-green">
          <span className="metric-label">🟢 Normal Sensitive Colony Size</span>
          <span className="colony-value colony-value-green">{summary.finalSensitive} CFU</span>
        </div>
        <div className="colony-card colony-purple">
          <span className="metric-label">🟣 Resistant Mutant Colony Size</span>
          <span className="colony-value colony-value-purple">{summary.finalResistant} CFU</span>
        </div>
      </div>

      <div className="secondary-row">
        <div className="secondary-card">
          <span className="metric-label">📈 Peak Recorded Density</span>
          <span className="secondary-value">{summary.peakDensity} CFU</span>
        </div>
        <div className="secondary-card">
          <span className="metric-label">⏱️ Generation Doubling Time</span>
          <span className="secondary-value">
            {summary.generationDoublingTime !== null ? `${summary.generationDoublingTime} h` : 'N/A'}
          </span>
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">📊 Dynamic Bacterial Growth Profile (Logistic Curve)</h3>
        <GrowthChart series={timeSeries} />
      </div>

      <div className="chart-card">
        <h3 className="chart-title">💉 Live Antibiotic Clearance Profile (Exponential Decay Curve)</h3>
        <ClearanceChart series={timeSeries} />
      </div>
    </div>
  )
}
