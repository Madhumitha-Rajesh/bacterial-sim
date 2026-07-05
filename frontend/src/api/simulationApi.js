const BASE_URL = import.meta.env.VITE_API_URL || '/api'

function getClientId() {
  let id = localStorage.getItem("client_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("client_id", id);
  }

  return id;
}
export async function runSimulation(params) {
  const response = await fetch(`${BASE_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
  ...params,
  client_id: getClientId(),
}),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Simulation request failed (${response.status})`)
  }

  return response.json()
}

export async function fetchConfig() {
  const response = await fetch(`${BASE_URL}/config`)
  if (!response.ok) {
    throw new Error('Failed to load configuration from server')
  }
  return response.json()
}

export async function fetchExperiments(limit = 100) {
  const response = await fetch(
    `${BASE_URL}/experiments?client_id=${getClientId()}&limit=${limit}`
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to load experiment history')
  }

  return response.json()
}

export async function fetchExperiment(id) {
  const response = await fetch(`${BASE_URL}/experiments/${id}`)
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to load experiment')
  }
  return response.json()
}

export async function compareExperiments(ids) {
  const response = await fetch(`${BASE_URL}/experiments/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to compare experiments')
  }
  return response.json()
}

export async function deleteExperiment(id) {
  const response = await fetch(`${BASE_URL}/experiments/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete experiment')
  }
  return response.json()
}
