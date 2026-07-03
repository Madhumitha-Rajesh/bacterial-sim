import { useState } from 'react'
import Modal from './Modal.jsx'
import flashcards from '../data/flashcards.js'
import './LearningCenter.css'

export default function LearningCenter({ onClose }) {
  const [flipped, setFlipped] = useState(() => new Set())

  const toggleCard = (index) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <Modal title="Learning Center" icon="📘" onClose={onClose}>
      <p className="learning-intro">
        Click a card to reveal the answer. Click again to flip it back.
      </p>
      <div className="flashcard-grid">
        {flashcards.map((card, index) => {
          const isFlipped = flipped.has(index)
          return (
            <button
              key={card.question}
              type="button"
              className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}
              onClick={() => toggleCard(index)}
              aria-expanded={isFlipped}
            >
              <div className="flashcard-inner">
                <div className="flashcard-face flashcard-front">
                  <span className="flashcard-q-icon">❓</span>
                  <span className="flashcard-text">{card.question}</span>
                  <span className="flashcard-hint">Tap to reveal answer</span>
                </div>
                <div className="flashcard-face flashcard-back">
                  <span className="flashcard-a-icon">✅</span>
                  <span className="flashcard-text">{card.answer}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
