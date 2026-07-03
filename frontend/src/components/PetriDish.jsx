import { useEffect, useRef, useState, useMemo } from 'react'
import './PetriDish.css'

const DOT_POOL_SIZE = 260
const FRAME_INTERVAL_MS = 110

// Deterministic pseudo-random generator so a given run animates identically
// every render pass (no visual "jitter" on re-render).
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function generateDotPool(seed) {
  const rand = seededRandom(seed || 1)
  const pool = []
  for (let i = 0; i < DOT_POOL_SIZE; i++) {
    // Uniform random point inside a unit circle
    const angle = rand() * Math.PI * 2
    const radius = Math.sqrt(rand()) * 0.92
    pool.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      r: 2.4 + rand() * 2.6,
      phase: rand() * Math.PI * 2,
    })
  }
  return pool
}

export default function PetriDish({ result, runId, colors, onFrameChange, onComplete }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const intervalRef = useRef(null)
  const [frameIndex, setFrameIndex] = useState(0)
  const [status, setStatus] = useState('Ready')

  const dotPool = useMemo(() => generateDotPool(runId || 1), [runId])

  const series = result?.timeSeries
  const frameCount = series ? series.time.length : 0

  // Drive playback whenever a new result comes in
  useEffect(() => {
    if (!series) {
      setStatus('Ready')
      setFrameIndex(0)
      return
    }
    setStatus('Running')
    setFrameIndex(0)
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1
        if (next >= frameCount - 1) {
          clearInterval(intervalRef.current)
          setStatus('Complete')
          if (onComplete) onComplete()
          return frameCount - 1
        }
        return next
      })
    }, FRAME_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useEffect(() => {
    if (onFrameChange && series) {
      onFrameChange({
        time: series.time[frameIndex],
        total: series.totalPopulation[frameIndex],
        sensitive: series.sensitivePopulation[frameIndex],
        resistant: series.resistantPopulation[frameIndex],
        phase: series.phase[frameIndex],
        prevTotal: series.totalPopulation[Math.max(0, frameIndex - 1)],
      })
    }
  }, [frameIndex, series, onFrameChange])

  // Continuous gentle "living colony" animation via canvas redraw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const dishR = size * 0.46

    let start = performance.now()

    function draw(now) {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, size, size)

      // Agar plate background
      const grad = ctx.createRadialGradient(cx, cy, dishR * 0.1, cx, cy, dishR)
      grad.addColorStop(0, '#f6efc5')
      grad.addColorStop(1, '#ece0a0')
      ctx.beginPath()
      ctx.arc(cx, cy, dishR, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Subtle agar texture rings
      ctx.strokeStyle = 'rgba(180,165,100,0.12)'
      ctx.lineWidth = 1
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath()
        ctx.arc(cx, cy, (dishR / 4) * i, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Colonies
      const K = result?.summary?.carryingCapacity || 620
      const totalCap = 260
      const cur = series
        ? {
            total: series.totalPopulation[frameIndex],
            sensitive: series.sensitivePopulation[frameIndex],
            resistant: series.resistantPopulation[frameIndex],
          }
        : { total: 0, sensitive: 0, resistant: 0 }

      const showTotal = Math.min(totalCap, Math.round((cur.total / K) * totalCap))
      const resistShare = cur.total > 0 ? cur.resistant / cur.total : 0
      const showResistant = Math.round(showTotal * resistShare)
      const showSensitive = showTotal - showResistant

      dotPool.forEach((dot, i) => {
        let color = null
        if (i < showSensitive) color = colors?.normal || '#3fae4a'
        else if (i < showSensitive + showResistant) color = colors?.resistant || '#8b3fd1'
        if (!color) return

        const wobble = 1 + 0.12 * Math.sin(t * 1.6 + dot.phase)
        const px = cx + dot.x * dishR
        const py = cy + dot.y * dishR
        const r = dot.r * wobble

        ctx.beginPath()
        const dg = ctx.createRadialGradient(px, py, 0, px, py, r * 1.8)
        dg.addColorStop(0, color)
        dg.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = dg
        ctx.arc(px, py, r * 1.8, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = color
        ctx.globalAlpha = 0.85
        ctx.arc(px, py, r * 0.55, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [frameIndex, series, dotPool, colors, result])

  const displayTime = series ? series.time[frameIndex] : 0
  const displayPop = series ? Math.round(series.totalPopulation[frameIndex]) : 0
  const prevPop = series ? series.totalPopulation[Math.max(0, frameIndex - 1)] : 0
  const growthRate = series
    ? Math.round((series.totalPopulation[frameIndex] - prevPop) * 10) / 10
    : 0

  const statusClass =
    status === 'Ready' ? 'status-ready' : status === 'Running' ? 'status-running' : 'status-complete'

  return (
    <div className="petri-stage">
      <div className="petri-wrapper">
        <div className="petri-dish-frame">
          <canvas ref={canvasRef} width={420} height={420} className="petri-canvas" />
        </div>
        <div className="petri-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: colors?.normal }} /> Green = Normal Bacteria
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: colors?.resistant }} /> Purple = Resistant Bacteria
          </span>
        </div>
      </div>

      <div className="stats-column">
        <div className="stat-card">
          <span className="stat-label">Population</span>
          <span className="stat-value">{displayPop} CFU</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Growth Rate</span>
          <span className="stat-value">{growthRate}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Time</span>
          <span className="stat-value">{displayTime}h</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Status</span>
          <span className={`stat-value ${statusClass}`}>{status}</span>
        </div>
      </div>
    </div>
  )
}
