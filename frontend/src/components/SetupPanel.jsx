import options from '../config/simulationOptions.json'
import './SetupPanel.css'

const EQUIPMENT = [
  { icon: '🧪', label: 'Pipette' },
  { icon: '🧫', label: 'Agar Plate' },
  { icon: '💧', label: 'Antibiotic Bottle' },
  { icon: '🌡️', label: 'Incubator' },
]

export default function SetupPanel({ params, onChange, onStart, onReset, isRunning }) {
  const { temperatureRange, antibioticRange } = options

  const update = (key) => (e) => {
    const value = e.target.value
    onChange(key, value)
  }

  return (
    <aside className="setup-panel">
      <h2 className="setup-title">Experiment Setup</h2>

      <div className="field-group">
        <label className="field-label">Species</label>
        <select
          className="field-select"
          value={params.species}
          onChange={update('species')}
          disabled={isRunning}
        >
          {options.species.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">
          Temperature (°C)
        </label>
        <div className="slider-row">
          <input
            type="range"
            min={temperatureRange.min}
            max={temperatureRange.max}
            value={params.temperature}
            onChange={update('temperature')}
            disabled={isRunning}
          />
        </div>
        <div className="slider-value">{params.temperature} °C</div>
      </div>

      <div className="field-group">
        <label className="field-label">Nutrient Level</label>
        <select
          className="field-select"
          value={params.nutrientLevel}
          onChange={update('nutrientLevel')}
          disabled={isRunning}
        >
          {options.nutrientLevels.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">Antibiotic Type</label>
        <select
          className="field-select"
          value={params.antibioticType}
          onChange={update('antibioticType')}
          disabled={isRunning}
        >
          {options.antibioticTypes.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">Antibiotic (%)</label>
        <div className="slider-row">
          <input
            type="range"
            min={antibioticRange.min}
            max={antibioticRange.max}
            value={params.antibioticPct}
            onChange={update('antibioticPct')}
            disabled={isRunning}
          />
        </div>
        <div className="slider-value">{params.antibioticPct}%</div>
      </div>

      <div className="field-group">
        <label className="field-label">Duration (Hours)</label>
        <input
          type="number"
          className="field-input"
          min={1}
          max={168}
          value={params.durationHours}
          onChange={update('durationHours')}
          disabled={isRunning}
        />
      </div>

      <button className="start-btn" onClick={onStart} disabled={isRunning}>
        {isRunning ? 'Running…' : 'Start Experiment'}
      </button>
      <button className="reset-btn" onClick={onReset}>
        Reset
      </button>

      <h3 className="equipment-title">Laboratory Equipment</h3>
      <ul className="equipment-list">
        {EQUIPMENT.map((item) => (
          <li key={item.label} className="equipment-item">
            <span className="equipment-icon">{item.icon}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  )
}
