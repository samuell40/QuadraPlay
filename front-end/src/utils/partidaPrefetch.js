const STORAGE_KEY = 'quadralivre_partida_prefetch'
const TTL_MS = 60 * 1000

export function salvarPrefetchPartida(payload) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...payload,
        savedAt: Date.now()
      })
    )
  } catch (error) {
    console.warn('Não foi possível salvar o prefetch da partida.', error)
  }
}

export function consumirPrefetchPartida(partidaId, campeonatoId) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const data = JSON.parse(raw)
    sessionStorage.removeItem(STORAGE_KEY)

    const savedAt = Number(data?.savedAt || 0)
    if (!savedAt || Date.now() - savedAt > TTL_MS) return null

    if (Number(data?.partidaId) !== Number(partidaId)) return null
    if (Number(data?.campeonatoId) !== Number(campeonatoId)) return null

    return data
  } catch (error) {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}
