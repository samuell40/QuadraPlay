const DATA_VERSION_KEY = 'quadraLivreDataVersion'
const DATA_UPDATED_EVENT = 'quadra-livre:data-updated'

let versaoDados = 0

function lerVersaoPersistida() {
  if (typeof window === 'undefined') return 0

  const valor = Number(window.localStorage.getItem(DATA_VERSION_KEY) || 0)
  return Number.isFinite(valor) && valor >= 0 ? valor : 0
}

function persistirVersao(versao) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DATA_VERSION_KEY, String(versao))
}

versaoDados = lerVersaoPersistida()

export function getDataVersion() {
  return versaoDados
}

export function bumpDataVersion(motivo = 'mutacao') {
  versaoDados += 1
  persistirVersao(versaoDados)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT, {
      detail: {
        version: versaoDados,
        reason: motivo,
        timestamp: Date.now()
      }
    }))
  }

  return versaoDados
}

export function resetDataVersion() {
  versaoDados = 0
  persistirVersao(versaoDados)
  return versaoDados
}

export function subscribeDataVersion(handler) {
  if (typeof window === 'undefined' || typeof handler !== 'function') {
    return () => {}
  }

  const listener = (event) => handler(event?.detail || {})
  window.addEventListener(DATA_UPDATED_EVENT, listener)

  return () => {
    window.removeEventListener(DATA_UPDATED_EVENT, listener)
  }
}
