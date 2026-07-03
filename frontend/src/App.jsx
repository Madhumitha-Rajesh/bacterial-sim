import { useState, useCallback, useEffect } from 'react'
import Header from './components/Header.jsx'
import SetupPanel from './components/SetupPanel.jsx'
import PetriDish from './components/PetriDish.jsx'
import Dashboard from './components/Dashboard.jsx'
import ExperimentHistory from './components/ExperimentHistory.jsx'
import { runSimulation, fetchConfig } from './api/simulationApi.js'
import options from './config/simulationOptions.json'
import './App.css'

const FALLBACK_COLORS = {
  'E. coli': { normal: '#3fae4a', resistant: '#9b4fd6' },
  'Pseudomonas aeruginosa': { normal: '#2f9e6b', resistant: '#a855c7' },
  'Bacillus subtilis': { normal: '#4caf50', resistant: '#8e44ad' },
}

export default function App() {
  const [view, setView] = useState('setup')
  const [params, setParams] = useState(options.defaults)
  const [result, setResult] = useState(null)
  const [runId, setRunId] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [animDone, setAnimDone] = useState(false)
  const [error, setError] = useState(null)
  const [speciesColors, setSpeciesColors] = useState(FALLBACK_COLORS)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchConfig()
      .then((cfg) => {
        const colors = {}
        Object.entries(cfg.bacteria || {}).forEach(([name, def]) => {
          colors[name] = { normal: def.colorNormal, resistant: def.colorResistant }
        })
        if (Object.keys(colors).length) setSpeciesColors(colors)
      })
      .catch(() => {
        // Backend not reachable yet — fall back to local defaults silently.
      })
  }, [])

  const handleChange = (key, value) => {
    const numericKeys = ['temperature', 'antibioticPct', 'durationHours']
    setParams((prev) => ({
      ...prev,
      [key]: numericKeys.includes(key) ? Number(value) : value,
    }))
  }

  const handleStart = async () => {
    setError(null)
    setIsRunning(true)
    setAnimDone(false)
    try {
      const data = await runSimulation(params)
      setResult(data)
      setRunId((id) => id + 1)
    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setParams(options.defaults)
    setResult(null)
    setIsRunning(false)
    setAnimDone(false)
    setError(null)
    setView('setup')
  }

  // Going back from the dashboard should NOT leave a finished/running
  // simulation sitting behind it — clear the result so the petri dish
  // shows a fresh, idle "Ready" plate instead of replaying/continuing.
  // The chosen setup parameters (species, temperature, etc.) are kept
  // so the user doesn't have to re-enter them.
  const handleBackToSetup = () => {
    setResult(null)
    setIsRunning(false)
    setAnimDone(false)
    setError(null)
    setView('setup')
  }

  const handleAnimComplete = useCallback(() => {
    setIsRunning(false)
    setAnimDone(true)
  }, [])

  const currentColors = speciesColors[params.species] || FALLBACK_COLORS['E. coli']

  if (view === 'dashboard' && result) {
    return (
      <div className="app-shell">
        <Dashboard result={result} params={params} onBack={handleBackToSetup} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header onOpenHistory={() => setShowHistory(true)} />
      <main className="main-content">
        {error && (
          <div className="error-banner">
            ⚠ {error}. Make sure the Python backend is running on port 5000 (see README).
          </div>
        )}
        <div className="stage-row">
          <SetupPanel
            params={params}
            onChange={handleChange}
            onStart={handleStart}
            onReset={handleReset}
            isRunning={isRunning}
          />
          <PetriDish
            result={result}
            runId={runId}
            colors={currentColors}
            onComplete={handleAnimComplete}
          />
        </div>
        {result && (
          <div className="dashboard-cta-row">
            <button className="dashboard-cta" onClick={() => setView('dashboard')}>
              View Simulation Dynamics Dashboard →
            </button>
            {!animDone && <span className="cta-hint">Animation in progress — you can still view live data</span>}
          </div>
        )}
      </main>

      {showHistory && <ExperimentHistory onClose={() => setShowHistory(false)} />}
    </div>
  )
}
