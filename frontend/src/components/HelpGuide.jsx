import Modal from './Modal.jsx'
import helpSteps from '../data/helpSteps.js'
import './HelpGuide.css'

export default function HelpGuide({ onClose }) {
  return (
    <Modal title="How to Run an Experiment" icon="🧭" onClose={onClose}>
      <ol className="help-steps">
        {helpSteps.map((step, index) => (
          <li key={step.title} className="help-step">
            <span className="help-step-number">{index + 1}</span>
            <div className="help-step-body">
              <h4 className="help-step-title">{step.title}</h4>
              <p className="help-step-detail">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  )
}
