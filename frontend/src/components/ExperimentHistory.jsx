import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import Modal from './Modal.jsx'
import { fetchExperiments, compareExperiments, deleteExperiment } from '../api/simulationApi.js'
import './ExperimentHistory.css'

const MAX_COMPARE = 4
const LINE_COLORS = ['#2f6fed', '#8b3fd1', '#e2712b', '#22a35a']

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function ExperimentHistory({ onClose }) {
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [compareData, setCompareData] = useState(null)
  const [comparing, setComparing] = useState(false)

  const loadList = () => {
    setLoading(true)
    setError(null)
    fetchExperiments()
      .then(setExperiments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadList, [])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, id]
    })
  }

  const handleCompare = async () => {
    setComparing(true)
    setError(null)
    try {
      const docs = await compareExperiments(selectedIds)
      // Preserve the order the user selected them in
      const ordered = selectedIds.map((id) => docs.find((d) => d.id === id)).filter(Boolean)
      setCompareData(ordered)
    } catch (err) {
      setError(err.message)
    } finally {
      setComparing(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await deleteExperiment(id)
      setExperiments((prev) => prev.filter((x) => x.id !== id))
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const labelFor = (doc) =>
    `${doc.species} · ${doc.parameters.antibioticType} ${doc.parameters.antibioticPct}%`

  return (
    <Modal title="Experiment History & Comparison" icon="📊" onClose={onClose} wide>
      {error && <div className="history-error">⚠ {error}</div>}

      {!compareData && (
        <>
          {loading ? (
            <p className="history-empty">Loading experiment history…</p>
          ) : experiments.length === 0 ? (
            <p className="history-empty">
              No saved experiments yet. Run a simulation on the setup screen and it will show up
              here automatically.
            </p>
          ) : (
            <>
              <div className="history-toolbar">
                <span className="history-hint">
                  Select up to {MAX_COMPARE} experiments to compare ({selectedIds.length} selected)
                </span>
                <button
                  className="compare-btn"
                  disabled={selectedIds.length < 2 || comparing}
                  onClick={handleCompare}
                >
                  {comparing ? 'Loading…' : `Compare Selected (${selectedIds.length})`}
                </button>
              </div>

              <div className="history-list">
                {experiments.map((doc) => (
                  <label
                    key={doc.id}
                    className={`history-row ${selectedIds.includes(doc.id) ? 'is-selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                    />
                    <div className="history-row-main">
                      <span className="history-species">{doc.species}</span>
                      <span className="history-meta">
                        {doc.parameters.temperature}°C · {doc.parameters.nutrientLevel} nutrient ·{' '}
                        {doc.parameters.antibioticType} {doc.parameters.antibioticPct}% ·{' '}
                        {doc.parameters.durationHours}h
                      </span>
                    </div>
                    <div className="history-row-stats">
                      <span>Peak {doc.summary.peakDensity} CFU</span>
                      <span>Survival {doc.summary.survivalRate}%</span>
                    </div>
                    <span className="history-date">{formatDate(doc.createdAt)}</span>
                    <button className="history-delete" onClick={(e) => handleDelete(doc.id, e)}>
                      🗑
                    </button>
                  </label>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {compareData && (
        <div className="compare-view">
          <button className="back-to-list-btn" onClick={() => setCompareData(null)}>
            ← Back to list
          </button>

          <div className="compare-chart-card">
            <h3 className="compare-chart-title">Growth Curve Comparison</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eef1f6" vertical={false} />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(v) => `${v}h`}
                  tick={{ fontSize: 11, fill: '#9aa4b2' }}
                  axisLine={{ stroke: '#e4e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9aa4b2' }}
                  axisLine={{ stroke: '#e4e8f0' }}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  formatter={(value) => [`${Math.round(value)} CFU`, 'Population']}
                  labelFormatter={(label) => `t = ${label}h`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {compareData.map((doc, i) => (
                  <Line
                    key={doc.id}
                    data={doc.timeSeries.time.map((t, idx) => ({
                      time: t,
                      population: doc.timeSeries.totalPopulation[idx],
                    }))}
                    dataKey="population"
                    name={labelFor(doc)}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="compare-table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {compareData.map((doc, i) => (
                    <th key={doc.id} style={{ color: LINE_COLORS[i % LINE_COLORS.length] }}>
                      {labelFor(doc)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Temperature</td>
                  {compareData.map((doc) => (
                    <td key={doc.id}>{doc.parameters.temperature}°C</td>
                  ))}
                </tr>
                <tr>
                  <td>Nutrient level</td>
                  {compareData.map((doc) => (
                    <td key={doc.id}>{doc.parameters.nutrientLevel}</td>
                  ))}
                </tr>
                <tr>
                  <td>Duration</td>
                  {compareData.map((doc) => (
                    <td key={doc.id}>{doc.parameters.durationHours}h</td>
                  ))}
                </tr>
                <tr>
                  <td>Peak density</td>
                  {compareData.map((doc) => (
                    <td key={doc.id}>{doc.summary.peakDensity} CFU</td>
                  ))}
                </tr>
                <tr>
                  <td>Survival rate</td>
                  {compareData.map((doc) => (
                    <td key={doc.id}>{doc.summary.survivalRate}%</td>
                  ))}
                </tr>
                <tr>
                  <td>Net decline velocity</td>
                  {compareData.map((doc) => (
                    <td key={doc.id}>{doc.summary.netDeclineVelocity} CFU/hr</td>
                  ))}
                </tr>
                <tr>
                  <td>Final sensitive</td>
                  {compareData.map((doc) => (
                    <td key={doc.id}>{doc.summary.finalSensitive} CFU</td>
                  ))}
                </tr>
                <tr>
                  <td>Final resistant</td>
                  {compareData.map((doc) => (
                    <td key={doc.id}>{doc.summary.finalResistant} CFU</td>
                  ))}
                </tr>
                <tr>
                  <td>Doubling time</td>
                  {compareData.map((doc) => (
                    <td key={doc.id}>
                      {doc.summary.generationDoublingTime !== null
                        ? `${doc.summary.generationDoublingTime}h`
                        : 'N/A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}
