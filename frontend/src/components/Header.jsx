import { useState } from 'react'
import LearningCenter from './LearningCenter.jsx'
import HelpGuide from './HelpGuide.jsx'
import './Header.css'

export default function Header({ onOpenHistory }) {
  const [showLearning, setShowLearning] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <header className="app-header">
      <div className="app-header-left">
        <span className="app-header-icon">🧫</span>
        <h1>Bacterial Growth Virtual Simulation</h1>
      </div>
      <div className="app-header-right">
        {onOpenHistory && (
          <button className="btn btn-outline" onClick={onOpenHistory}>
            <span className="btn-icon">📊</span> History
          </button>
        )}
        <button className="btn btn-primary-soft" onClick={() => setShowLearning(true)}>
          <span className="btn-icon">📘</span> Learning Center
        </button>
        <button className="btn btn-outline" onClick={() => setShowHelp(true)}>
          Help
        </button>
      </div>

      {showLearning && <LearningCenter onClose={() => setShowLearning(false)} />}
      {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}
    </header>
  )
}
